import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, AlertCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import VideoRoom from "@/components/VideoRoom/VideoRoom";
import { getOrCreateVideoRoom } from "@/lib/telemed-api";

type ConnectionState = "loading" | "ready" | "connected" | "error";

const VideoConsultation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [connectionState, setConnectionState] = useState<ConnectionState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<{
    roomId: string;
    token: string;
    participantName: string;
  } | null>(null);

  // Get params from URL
  const nrAtendimento = searchParams.get("nr_atendimento");
  const cdMedico = searchParams.get("cd_medico");
  const cdPessoaFisica = searchParams.get("cd_pessoa_fisica");
  const patientName = searchParams.get("patient_name") || "Paciente";

  useEffect(() => {
    const initializeRoom = async () => {
      // Validate required params
      if (!nrAtendimento || !cdMedico || !cdPessoaFisica) {
        setError("Parâmetros inválidos. Retorne e tente novamente.");
        setConnectionState("error");
        return;
      }

      try {
        console.log("[VideoConsultation] Initializing room...", {
          nrAtendimento,
          cdMedico,
          cdPessoaFisica,
        });

        const { roomId, videoSdkToken } = await getOrCreateVideoRoom(
          nrAtendimento,
          cdMedico,
          cdPessoaFisica
        );

        console.log("[VideoConsultation] Room ready:", roomId);

        setRoomData({
          roomId,
          token: videoSdkToken,
          participantName: patientName,
        });
        setConnectionState("ready");
      } catch (err) {
        console.error("[VideoConsultation] Error initializing room:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao preparar a sala de consulta"
        );
        setConnectionState("error");
      }
    };

    initializeRoom();
  }, [nrAtendimento, cdMedico, cdPessoaFisica, patientName]);

  const handleJoinRoom = () => {
    if (roomData) {
      setConnectionState("connected");
    }
  };

  const handleLeaveRoom = () => {
    toast.info("Você saiu da consulta");
    navigate("/online-consultation-details");
  };

  const handleRetry = () => {
    setConnectionState("loading");
    setError(null);
    window.location.reload();
  };

  // Loading state
  if (connectionState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Preparando sua consulta</h1>
          <p className="text-muted-foreground">
            Estamos configurando a sala de vídeo. Isso pode levar alguns
            segundos...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (connectionState === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao preparar consulta</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/online-consultation-details")}
            >
              Voltar
            </Button>
            <Button className="flex-1" onClick={handleRetry}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - waiting room
  if (connectionState === "ready" && roomData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Video className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Sala pronta!</h1>
            <p className="text-muted-foreground">
              Sua sala de consulta está preparada. Clique no botão abaixo para
              entrar.
            </p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sala:</span>
              <span className="font-mono">{roomData.roomId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Participante:</span>
              <span>{roomData.participantName}</span>
            </div>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Certifique-se de permitir o acesso à câmera e microfone quando
              solicitado.
            </AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/online-consultation-details")}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleJoinRoom}>
              <Video className="h-4 w-4 mr-2" />
              Entrar na Consulta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Connected state - video room
  if (connectionState === "connected" && roomData) {
    return (
      <VideoRoom
        roomId={roomData.roomId}
        token={roomData.token}
        participantName={roomData.participantName}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return null;
};

export default VideoConsultation;
