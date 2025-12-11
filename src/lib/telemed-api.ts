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
  ID_SALA?: string;
  status?: boolean;
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
  console.log("[Telemed] Getting token...");
  
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
  console.log("[Telemed] Token obtained successfully");
  return data.data.token;
};

/**
 * Step 2: Check if room exists for attendance
 */
export const getRoomByAtendimento = async (
  nrAtendimento: number | string,
  samelToken: string
): Promise<RoomCheckResponse | null> => {
  console.log("[Telemed] Checking existing room for atendimento:", nrAtendimento);
  
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
    console.log("[Telemed] No existing room found or error");
    return null;
  }

  const data: RoomCheckResponse = await response.json();
  
  if (!data.ID_SALA || data.status === false) {
    console.log("[Telemed] Room check returned empty/false");
    return null;
  }

  console.log("[Telemed] Existing room found:", data.ID_SALA);
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
  console.log("[Telemed] Creating new room...");
  
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
  
  console.log("[Telemed] Room created:", data.data.createRoom.roomId);
  
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
  console.log("[Telemed] Persisting room in database...");
  
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
    console.error("[Telemed] Failed to persist room");
    return false;
  }

  const data: CreateConsultationRoomResponse = await response.json();
  console.log("[Telemed] Room persisted, rows affected:", data.rowsAffected);
  
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

  if (existingRoom?.ID_SALA) {
    // Room exists, but we need a fresh VideoSDK token
    // Create a new room to get a valid token (the API handles this)
    console.log("[Telemed] Room exists, getting fresh token...");
  }

  // Step 3: Create room (or get fresh token for existing room)
  const { roomId, videoSdkToken } = await createRoom(
    cdMedico,
    samelToken,
    nrAtendimento
  );

  // Step 4: Persist in database
  await createConsultationRoom(cdPessoaFisica, roomId, nrAtendimento);

  return { roomId, videoSdkToken };
};
