/**
 * API functions for Telemed/Samel video consultation
 */

const TELEMED_BASE_URL = "https://telemed.samel.com.br/api/prontuario/telemedicina";

interface TelemedTokenResponse {
  data: {
    token: string;
  };
}

interface RoomCheckResponse {
  status: boolean;
  message: string;
  data: {
    ID_SALA: string;
  };
}

interface CreateRoomResponse {
  status: string;
  message: string;
  data: {
    createRoom: {
      roomId: string;
      token: string;
    };
  };
}

interface CreateConsultationRoomResponse {
  success: boolean;
  rowsAffected?: number;
}

/**
 * Step 1: Get Samel Telemed token
 */
export const getTelemedToken = async (): Promise<string> => {
  const response = await fetch(`${TELEMED_BASE_URL}/token`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get telemed token: ${response.status}`);
  }

  const data: TelemedTokenResponse = await response.json();
  return data.data.token;
};

/**
 * Step 2: Check if room exists for attendance
 */
export const getRoomByAtendimento = async (
  nrAtendimento: number | string,
  samelToken: string
): Promise<RoomCheckResponse | null> => {
  const response = await fetch(
    `${TELEMED_BASE_URL}/room/getRoomByAtendimento/${nrAtendimento}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${samelToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data: RoomCheckResponse = await response.json();
  
  if (!data.data?.ID_SALA || data.status === false) {
    return null;
  }

  return data;
};

/**
 * Step 3: Create a new room
 */
export const createRoom = async (
  cdMedico: string,
  samelToken: string,
  nrAtendimento: number | string
): Promise<{ roomId: string; videoSdkToken: string }> => {
  const response = await fetch(`${TELEMED_BASE_URL}/room/createRoom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": samelToken,
    },
    body: JSON.stringify({
      cd_medico: cdMedico,
      token: samelToken,
      nr_atendimento: Number(nrAtendimento),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create room: ${response.status}`);
  }

  const data: CreateRoomResponse = await response.json();
  
  return {
    roomId: data.data.createRoom.roomId,
    videoSdkToken: data.data.createRoom.token,
  };
};

/**
 * Step 4: Persist room in database
 */
export const createConsultationRoom = async (
  cdPessoaFisica: string | number,
  idSala: string,
  nrAtendimento: string | number
): Promise<boolean> => {
  const response = await fetch(`${TELEMED_BASE_URL}/createConsultationRoom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      CD_PESSOA_FISICA: String(cdPessoaFisica),
      ID_SALA: idSala,
      NR_ATENDIMENTO: String(nrAtendimento),
    }),
  });

  if (!response.ok) {
    return false;
  }

  const data: CreateConsultationRoomResponse = await response.json();
  
  return data.success || (data.rowsAffected !== undefined && data.rowsAffected >= 1);
};

/**
 * Complete flow: Get or create room for video consultation
 */
export const getOrCreateVideoRoom = async (
  nrAtendimento: number | string,
  cdMedico: string,
  cdPessoaFisica: string | number
): Promise<{ roomId: string; videoSdkToken: string }> => {
  // Step 1: Get token
  const samelToken = await getTelemedToken();

  // Step 2: Check if room exists
  const existingRoom = await getRoomByAtendimento(nrAtendimento, samelToken);

  if (existingRoom?.data?.ID_SALA) {
    return { 
      roomId: existingRoom.data.ID_SALA, 
      videoSdkToken: samelToken 
    };
  }

  // Step 3: Create new room only if none exists
  const { roomId, videoSdkToken } = await createRoom(
    cdMedico,
    samelToken,
    nrAtendimento
  );

  // Step 4: Persist in database
  await createConsultationRoom(cdPessoaFisica, roomId, nrAtendimento);

  return { roomId, videoSdkToken };
};
