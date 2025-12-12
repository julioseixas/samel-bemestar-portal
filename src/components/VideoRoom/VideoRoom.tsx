import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MeetingProvider, useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ParticipantView from "./ParticipantView";
import Controls from "./Controls";
import ChatPanel, { ChatMessage } from "./ChatPanel";
import ParticipantsList from "./ParticipantsList";
import { Maximize2, Minimize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiHeaders } from "@/lib/api-headers";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// Sound notification helper
const playMessageSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant notification sound - two quick tones
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1); // C#6
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error("[VideoRoom] Error playing sound:", error);
  }
};

// Sound for participant joining
const playParticipantJoinSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Distinct sound for participant joining - ascending tone
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    oscillator.frequency.linearRampToValueAtTime(660, audioContext.currentTime + 0.2); // E5
    oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.4); // A5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error("[VideoRoom] Error playing join sound:", error);
  }
};
const sessionMessages: Map<string, ChatMessage[]> = new Map();

interface VideoRoomProps {
  roomId: string;
  token: string;
  participantName: string;
  onLeave: () => void;
  idAgenda?: string;
  idCliente?: string;
  nrAtendimento?: string;
  cdMedico?: string;
}

// Inner component that uses the meeting hooks
const MeetingView: React.FC<{ 
  onLeave: () => void; 
  roomName: string;
  idAgenda?: string;
  idCliente?: string;
  nrAtendimento?: string;
  cdMedico?: string;
}> = ({
  onLeave,
  roomName,
  idAgenda,
  idCliente,
  nrAtendimento,
  cdMedico,
}) => {
  const navigate = useNavigate();
  
  // State declarations first
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Push notifications hook
  const { sendNotification } = usePushNotifications(idCliente);

  const {
    leave,
    participants,
    localParticipant,
    meetingId,
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
    onParticipantJoined: async (participant) => {
      console.log("[VideoRoom] Participant joined:", participant.displayName, "ID:", participant.id);
      toast.info(`${participant.displayName || "Participante"} entrou`);
      
      // Play sound when participant joins
      playParticipantJoinSound();
      
      // Show browser notification if tab is in background
      if (document.hidden && Notification.permission === "granted") {
        try {
          new Notification("Consulta Online - Samel", {
            body: `${participant.displayName || "O profissional"} entrou na sala de consulta!`,
            icon: "/favicon.png",
            tag: `participant-joined-${participant.id}`
          });
        } catch (error) {
          console.error("[VideoRoom] Error showing notification:", error);
        }
      }
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

  // Load persisted messages on mount
  useEffect(() => {
    if (meetingId) {
      const existingMessages = sessionMessages.get(meetingId) || [];
      setMessages(existingMessages);
      console.log("[VideoRoom] Loaded persisted messages:", existingMessages.length);
    }
  }, [meetingId]);

  // Parse message helper - handles both JSON and plain text
  const parseMessage = useCallback((data: any): ChatMessage | null => {
    try {
      // VideoSDK wraps the message - data.message contains what we published
      let messageContent = data.message;
      let senderName = data.senderName || "Participante";
      let timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

      // Try to parse if it's a JSON string
      if (typeof messageContent === "string") {
        try {
          const parsed = JSON.parse(messageContent);
          if (parsed.message) {
            messageContent = parsed.message;
            senderName = parsed.senderName || senderName;
            timestamp = parsed.timestamp ? new Date(parsed.timestamp) : timestamp;
          }
        } catch {
          // Not JSON, use as plain text - this is fine
        }
      }

      // If message is still an object, stringify it for display
      if (typeof messageContent === "object") {
        messageContent = messageContent.message || JSON.stringify(messageContent);
      }

      return {
        id: `${Date.now()}-${data.senderId}-${Math.random()}`,
        senderId: data.senderId,
        senderName,
        message: String(messageContent),
        timestamp,
      };
    } catch (error) {
      console.error("[VideoRoom] Error parsing message:", error);
      return null;
    }
  }, []);

  // Use PubSub for chat - THIS IS ALWAYS ACTIVE regardless of chat panel state
  const { publish } = usePubSub("CHAT", {
    onMessageReceived: (data: any) => {
      console.log("[VideoRoom] Received raw message:", data, "chatOpen:", chatOpen);
      
      // IGNORE messages from self - we already added them locally in handleSendMessage
      if (data.senderId === localParticipant?.id) {
        console.log("[VideoRoom] Ignoring own message from PubSub");
        return;
      }
      
      const newMessage = parseMessage(data);
      if (!newMessage) return;

      // Check for duplicates and add message
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (m) => m.senderId === newMessage.senderId && 
                 m.message === newMessage.message &&
                 Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 2000
        );
        
        if (isDuplicate) {
          console.log("[VideoRoom] Duplicate message ignored");
          return prev;
        }

        const updated = [...prev, newMessage];
        
        // Persist messages for this meeting
        if (meetingId) {
          sessionMessages.set(meetingId, updated);
        }
        
        return updated;
      });

      // Notify for new message from others when chat is closed
      console.log("[VideoRoom] Message from other participant, chatOpen:", chatOpen);
      // Use functional update to check current chatOpen state
      setChatOpen(currentChatOpen => {
        if (!currentChatOpen) {
          console.log("[VideoRoom] Chat is closed, incrementing unread and playing sound");
          setUnreadMessages(prev => prev + 1);
          playMessageSound();
        }
        return currentChatOpen; // Don't change the state
      });
    },
    onOldMessagesReceived: (oldMessages: any[]) => {
      console.log("[VideoRoom] Received old messages:", oldMessages);
      
      if (!oldMessages || oldMessages.length === 0) return;
      
      const parsedMessages: ChatMessage[] = [];
      for (const data of oldMessages) {
        const parsed = parseMessage(data);
        if (parsed) parsedMessages.push(parsed);
      }

      setMessages((prev) => {
        // Merge old messages avoiding duplicates
        const existingIds = new Set(prev.map(m => m.id));
        const newOldMessages = parsedMessages.filter(m => !existingIds.has(m.id));
        const merged = [...newOldMessages, ...prev].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        if (meetingId) {
          sessionMessages.set(meetingId, merged);
        }
        
        return merged;
      });
    },
  });

  // Handle sending message
  const handleSendMessage = useCallback((messageText: string) => {
    if (!localParticipant) return;
    
    console.log("[VideoRoom] Sending message:", messageText);
    
    // Create local message object
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${localParticipant.id}-${Math.random()}`,
      senderId: localParticipant.id,
      senderName: localParticipant.displayName || "Você",
      message: messageText,
      timestamp: new Date(),
    };
    
    // Add to local state immediately
    setMessages((prev) => {
      const updated = [...prev, newMessage];
      if (meetingId) {
        sessionMessages.set(meetingId, updated);
      }
      return updated;
    });
    
    // Publish to other participants
    publish(messageText, { persist: true });
  }, [publish, localParticipant, meetingId]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (chatOpen) {
      console.log("[VideoRoom] Chat opened, resetting unread count");
      setUnreadMessages(0);
    }
  }, [chatOpen]);

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

  // Handle view queue - call API first then navigate
  const handleViewQueue = useCallback(async () => {
    if (!idAgenda || !idCliente) {
      toast.error("Dados da fila não disponíveis");
      navigate("/telemedicine-queue");
      return;
    }

    try {
      const headers = getApiHeaders();
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarFilaTele",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            idAgenda: idAgenda,
            idCliente: idCliente
          })
        }
      );

      const data = await response.json();

      if (data.sucesso && data.dados) {
        localStorage.setItem("telemedicineQueueData", JSON.stringify(data.dados));
        navigate("/telemedicine-queue");
      } else {
        toast.error(data.mensagem || "Erro ao obter informações da fila");
      }
    } catch (error) {
      console.error("[VideoRoom] Error fetching queue:", error);
      toast.error("Erro ao carregar fila de atendimento");
    }
  }, [idAgenda, idCliente, navigate]);


  // Calculate grid columns based on participant count
  const gridClass = useMemo(() => {
    const count = participantIds.length;
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 sm:grid-cols-3";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  }, [participantIds.length]);

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
        {/* Video Area - Grid Layout */}
        <div
          className={cn(
            "flex-1 p-4 pb-24 overflow-auto",
            (chatOpen || participantsOpen) && "lg:mr-80"
          )}
        >
          {participantIds.length > 0 ? (
            <div className={cn("grid gap-3 h-full auto-rows-fr", gridClass)}>
              {participantIds.map((id) => (
                <div key={id} className="min-h-[200px]">
                  <ParticipantView
                    participantId={id}
                    isLocal={id === localParticipant?.id}
                    isMainView={participantIds.length <= 2}
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
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl">
              <p className="text-muted-foreground">
                Aguardando participantes...
              </p>
            </div>
          )}
        </div>

        {/* Side Panel - Desktop */}
        {(chatOpen || participantsOpen) && (
          <div className="hidden lg:flex lg:flex-col w-80 border-l absolute right-0 top-[73px] bottom-[80px]">
            {chatOpen && (
              <ChatPanel 
                onClose={() => setChatOpen(false)}
                messages={messages}
                onSendMessage={handleSendMessage}
                localParticipantId={localParticipant?.id}
                nrAtendimento={nrAtendimento}
                cdMedico={cdMedico}
              />
            )}
            {participantsOpen && !chatOpen && (
              <ParticipantsList onClose={() => setParticipantsOpen(false)} />
            )}
          </div>
        )}
      </div>

      {/* Mobile Side Panel (overlay) */}
      {(chatOpen || participantsOpen) && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
          {chatOpen && (
            <ChatPanel 
              onClose={() => setChatOpen(false)}
              messages={messages}
              onSendMessage={handleSendMessage}
              localParticipantId={localParticipant?.id}
              nrAtendimento={nrAtendimento}
              cdMedico={cdMedico}
            />
          )}
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
        onViewQueue={handleViewQueue}
        unreadMessages={unreadMessages}
        nrAtendimento={nrAtendimento}
        cdMedico={cdMedico}
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
  idAgenda,
  idCliente,
  nrAtendimento,
  cdMedico,
}) => {
  console.log("[VideoRoom] Rendering with:", { 
    roomId, 
    tokenPresent: !!token && token.length > 0,
    tokenLength: token?.length,
    participantName,
    idAgenda,
    idCliente,
    nrAtendimento,
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
      <MeetingView onLeave={onLeave} roomName={`Consulta - ${roomId}`} idAgenda={idAgenda} idCliente={idCliente} nrAtendimento={nrAtendimento} cdMedico={cdMedico} />
    </MeetingProvider>
  );
};

export default VideoRoom;
