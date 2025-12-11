import React, { useState, useEffect, useMemo, useReducer, useCallback } from "react";
import { MeetingProvider, useMeeting } from "@videosdk.live/react-sdk";
import { toast } from "sonner";
import ParticipantView from "./ParticipantView";
import Controls from "./Controls";
import ChatPanel from "./ChatPanel";
import ParticipantsList from "./ParticipantsList";
import { Maximize2, Minimize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoRoomProps {
  roomId: string;
  token: string;
  participantName: string;
  onLeave: () => void;
}

// Inner component that uses the meeting hooks
const MeetingView: React.FC<{ onLeave: () => void; roomName: string }> = ({
  onLeave,
  roomName,
}) => {
  // State declarations first
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const {
    leave,
    participants,
    localParticipant,
  } = useMeeting({
    onMeetingJoined: () => {
      console.log("[VideoRoom] Meeting joined");
      toast.success("Você entrou na consulta");
    },
    onMeetingLeft: () => {
      console.log("[VideoRoom] Meeting left");
      toast.info("Você saiu da consulta");
      onLeave();
    },
    onParticipantJoined: (participant) => {
      console.log("[VideoRoom] Participant joined:", participant.displayName, "ID:", participant.id);
      toast.info(`${participant.displayName || "Participante"} entrou`);
    },
    onParticipantLeft: (participant) => {
      console.log("[VideoRoom] Participant left:", participant.displayName, "ID:", participant.id);
      toast.info(`${participant.displayName || "Participante"} saiu`);
    },
    onError: (error) => {
      console.error("[VideoRoom] Error:", error);
      toast.error("Erro na videochamada: " + error.message);
    },
  });

  // Sync participant IDs with the participants Map
  useEffect(() => {
    const currentIds = [...participants.keys()];
    console.log("[VideoRoom] Syncing participants:", currentIds);
    setParticipantIds(currentIds);
  }, [participants.size]);

  // Also update on any participants change
  useEffect(() => {
    const interval = setInterval(() => {
      const currentIds = [...participants.keys()];
      if (currentIds.length !== participantIds.length || 
          currentIds.some((id, i) => id !== participantIds[i])) {
        console.log("[VideoRoom] Detected participant change via interval:", currentIds);
        setParticipantIds(currentIds);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [participants, participantIds]);

  // Monitora quando o meeting é joined via joinWithoutUserInteraction
  useEffect(() => {
    if (localParticipant) {
      console.log("[VideoRoom] Local participant ready:", localParticipant.id);
      setIsJoining(false);
    }
  }, [localParticipant]);

  // Timeout para loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isJoining) {
        console.log("[VideoRoom] Join timeout - forcing loading off");
        setIsJoining(false);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isJoining]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle leave
  const handleLeave = () => {
    leave();
  };


  // Determine main view participant (pinned or active speaker or first remote)
  const mainParticipantId = useMemo(() => {
    if (pinnedParticipant && participantIds.includes(pinnedParticipant)) {
      return pinnedParticipant;
    }
    // Find first remote participant (not local)
    const remoteParticipant = participantIds.find(
      (id) => id !== localParticipant?.id
    );
    return remoteParticipant || participantIds[0] || null;
  }, [participantIds, pinnedParticipant, localParticipant]);

  // Other participants for the grid/thumbnails
  const thumbnailParticipants = useMemo(() => {
    return participantIds.filter((id) => id !== mainParticipantId);
  }, [participantIds, mainParticipantId]);

  if (isJoining) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">Entrando na consulta...</p>
          <p className="text-sm text-muted-foreground">
            Aguarde enquanto conectamos você
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">
            {roomName}
          </h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {participantIds.length} participante(s)
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div
          className={cn(
            "flex-1 flex flex-col p-4 pb-24 overflow-hidden",
            (chatOpen || participantsOpen) && "lg:mr-80"
          )}
        >
          {/* Main View */}
          <div className="flex-1 mb-4">
            {mainParticipantId ? (
              <ParticipantView
                participantId={mainParticipantId}
                isLocal={mainParticipantId === localParticipant?.id}
                isMainView
                isPinned={pinnedParticipant === mainParticipantId}
                onPin={(id) =>
                  setPinnedParticipant((prev) => (prev === id ? null : id))
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl">
                <p className="text-muted-foreground">
                  Aguardando outros participantes...
                </p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {thumbnailParticipants.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {thumbnailParticipants.map((id) => (
                <div key={id} className="w-40 flex-shrink-0">
                  <ParticipantView
                    participantId={id}
                    isLocal={id === localParticipant?.id}
                    isPinned={pinnedParticipant === id}
                    onPin={(participantId) =>
                      setPinnedParticipant((prev) =>
                        prev === participantId ? null : participantId
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Panel */}
        {(chatOpen || participantsOpen) && (
          <div className="hidden lg:block w-80 border-l">
            {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
            {participantsOpen && !chatOpen && (
              <ParticipantsList onClose={() => setParticipantsOpen(false)} />
            )}
          </div>
        )}
      </div>

      {/* Mobile Side Panel (overlay) */}
      {(chatOpen || participantsOpen) && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
          {participantsOpen && !chatOpen && (
            <ParticipantsList onClose={() => setParticipantsOpen(false)} />
          )}
        </div>
      )}

      {/* Controls */}
      <Controls
        onToggleChat={() => {
          setChatOpen(!chatOpen);
          if (!chatOpen) setParticipantsOpen(false);
        }}
        onToggleParticipants={() => {
          setParticipantsOpen(!participantsOpen);
          if (!participantsOpen) setChatOpen(false);
        }}
        chatOpen={chatOpen}
        participantsOpen={participantsOpen}
        onLeave={handleLeave}
      />
    </div>
  );
};

// Main component with MeetingProvider
const VideoRoom: React.FC<VideoRoomProps> = ({
  roomId,
  token,
  participantName,
  onLeave,
}) => {
  console.log("[VideoRoom] Rendering with:", { 
    roomId, 
    tokenPresent: !!token && token.length > 0,
    tokenLength: token?.length,
    participantName 
  });

  // Validar token antes de renderizar
  if (!token || token.length === 0) {
    console.error("[VideoRoom] Token inválido ou ausente!");
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium text-destructive">Erro: Token não disponível</p>
          <Button onClick={onLeave}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: roomId,
        micEnabled: true,
        webcamEnabled: true,
        name: participantName,
        debugMode: true,
        multiStream: false,
        maxResolution: 'hd',
        defaultCamera: 'front',
      }}
      token={token}
      joinWithoutUserInteraction={true}
    >
      <MeetingView onLeave={onLeave} roomName={`Consulta - ${roomId}`} />
    </MeetingProvider>
  );
};

export default VideoRoom;
