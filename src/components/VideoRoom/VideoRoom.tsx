import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MeetingProvider, useMeeting, usePubSub, createCameraVideoTrack } from "@videosdk.live/react-sdk";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ParticipantView from "./ParticipantView";
import Controls from "./Controls";
import ChatPanel, { ChatMessage } from "./ChatPanel";
import ParticipantsList from "./ParticipantsList";
import { BackgroundOption, BACKGROUND_OPTIONS } from "./BackgroundSelector";
import { Maximize2, Minimize2, Loader2, Clock, Users, PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiHeaders } from "@/lib/api-headers";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
}> = ({ onLeave, roomName, idAgenda, idCliente, nrAtendimento, cdMedico }) => {
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
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [queueData, setQueueData] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<string>("none");
  const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const processorRef = useRef<any>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  // Detect if running in WebView (Android or iOS)
  const isWebView = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes("wv") || // Android WebView
      ua.includes("webview") ||
      (window as any).AndroidBridge !== undefined ||
      (window as any).webkit?.messageHandlers !== undefined
    );
  }, []);

  // Push notifications hook
  const { sendNotification, triggerAndroidNotification } = usePushNotifications(idCliente);

  // Load saved background preference
  useEffect(() => {
    const savedBg = localStorage.getItem("videoroom-background");
    if (savedBg) {
      setSelectedBackground(savedBg);
    }
  }, []);

  const { leave, participants, localParticipant, meetingId, changeWebcam } = useMeeting({
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

      const notificationTitle = "Consulta Online - Samel";
      const notificationBody = `${participant.displayName || "O profissional"} entrou na sala de consulta!`;

      // Try Android bridge first (for WebView)
      if (window.AndroidNotificationBridge) {
        window.AndroidNotificationBridge.triggerTestNotification(notificationTitle, notificationBody);
        console.log("[VideoRoom] Notification sent via Android bridge");
      } else if (document.hidden && Notification.permission === "granted") {
        // Fallback to browser notification if tab is in background
        try {
          new Notification(notificationTitle, {
            body: notificationBody,
            icon: "/favicon.png",
            tag: `participant-joined-${participant.id}`,
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
          (m) =>
            m.senderId === newMessage.senderId &&
            m.message === newMessage.message &&
            Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 2000,
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
      setChatOpen((currentChatOpen) => {
        if (!currentChatOpen) {
          console.log("[VideoRoom] Chat is closed, incrementing unread and playing sound");
          setUnreadMessages((prev) => prev + 1);
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
        const existingIds = new Set(prev.map((m) => m.id));
        const newOldMessages = parsedMessages.filter((m) => !existingIds.has(m.id));
        const merged = [...newOldMessages, ...prev].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        if (meetingId) {
          sessionMessages.set(meetingId, merged);
        }

        return merged;
      });
    },
  });

  // Handle sending message
  const handleSendMessage = useCallback(
    (messageText: string) => {
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
    },
    [publish, localParticipant, meetingId],
  );

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
      if (currentIds.length !== participantIds.length || currentIds.some((id, i) => id !== participantIds[i])) {
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

  // Toggle Picture-in-Picture mode
  const togglePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
        return;
      }

      // Find the first remote participant's video, or local if alone
      const remoteId = participantIds.find(id => id !== localParticipant?.id) || localParticipant?.id;
      if (!remoteId) {
        toast.error("Nenhum vídeo disponível para PiP");
        return;
      }

      // Find the video element for this participant
      const videoElements = document.querySelectorAll('video');
      let targetVideo: HTMLVideoElement | null = null;

      for (const video of videoElements) {
        if (video.srcObject && (video.srcObject as MediaStream).active) {
          targetVideo = video;
          break;
        }
      }

      if (!targetVideo) {
        toast.error("Nenhum stream de vídeo ativo para PiP");
        return;
      }

      await targetVideo.requestPictureInPicture();
      setIsPipActive(true);
      toast.success("Modo Picture-in-Picture ativado");
    } catch (error) {
      console.error("[VideoRoom] PiP error:", error);
      toast.error("Seu navegador não suporta Picture-in-Picture");
    }
  }, [participantIds, localParticipant?.id]);

  // Listen for PiP exit
  useEffect(() => {
    const handlePipExit = () => {
      setIsPipActive(false);
    };
    
    document.addEventListener("leavepictureinpicture", handlePipExit);
    return () => {
      document.removeEventListener("leavepictureinpicture", handlePipExit);
    };
  }, []);

  // Handle leave
  const handleLeave = () => {
    leave();
  };

  // Handle view queue - show in modal instead of navigating
  const handleViewQueue = useCallback(async () => {
    if (!idAgenda || !idCliente) {
      toast.error("Dados da fila não disponíveis");
      return;
    }

    setQueueModalOpen(true);
    setQueueLoading(true);

    try {
      const headers = getApiHeaders();
      const response = await fetch("https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarFilaTele", {
        method: "POST",
        headers,
        body: JSON.stringify({
          idAgenda: idAgenda,
          idCliente: idCliente,
        }),
      });

      const data = await response.json();

      if (data.sucesso && data.dados) {
        setQueueData(data.dados);
      } else {
        toast.error(data.mensagem || "Erro ao obter informações da fila");
        setQueueData([]);
      }
    } catch (error) {
      console.error("[VideoRoom] Error fetching queue:", error);
      toast.error("Erro ao carregar fila de atendimento");
      setQueueData([]);
    } finally {
      setQueueLoading(false);
    }
  }, [idAgenda, idCliente]);

  // Handle background selection
  const handleSelectBackground = useCallback(async (option: BackgroundOption) => {
    setIsBackgroundProcessing(true);
    
    try {
      // Stop existing processor if any
      if (processorRef.current) {
        try {
          await processorRef.current.stop();
        } catch (e) {
          console.log("[VideoRoom] Error stopping previous processor:", e);
        }
        processorRef.current = null;
      }
      
      if (option.type === "none") {
        // Create a clean camera track without processing
        const cleanStream = await createCameraVideoTrack({});
        await changeWebcam(cleanStream);
        
        setSelectedBackground("none");
        localStorage.setItem("videoroom-background", "none");
        toast.success("Fundo removido");
      } else {
        // Dynamically import the processor only when needed
        const { VirtualBackgroundProcessor } = await import("@videosdk.live/videosdk-media-processor-web");
        
        // Create new camera track
        const cameraStream = await createCameraVideoTrack({});
        
        // Create and initialize processor
        const processor = new VirtualBackgroundProcessor();
        
        if (!processor.ready) {
          await processor.init();
        }
        
        let processedStream: MediaStream;
        
        // Configure based on type
        if (option.type === "blur-light" || option.type === "blur-strong") {
          processedStream = await processor.start(cameraStream, {
            type: "blur",
          });
        } else if (option.type === "image" && option.imageUrl) {
          processedStream = await processor.start(cameraStream, {
            type: "image",
            imageUrl: option.imageUrl,
          });
        } else {
          throw new Error("Invalid background type");
        }
        
        // Apply the processed stream to the meeting
        await changeWebcam(processedStream);
        
        processorRef.current = processor;
        setSelectedBackground(option.id);
        localStorage.setItem("videoroom-background", option.id);
        toast.success(`Fundo "${option.label}" aplicado`);
      }
    } catch (error) {
      console.error("[VideoRoom] Error applying background:", error);
      toast.error("Erro ao aplicar fundo virtual. Este recurso pode não ser suportado no seu navegador.");
    } finally {
      setIsBackgroundProcessing(false);
    }
  }, [changeWebcam]);

  // Check if patient is alone (only local participant)
  const isPatientAlone = useMemo(() => {
    return participantIds.length === 1 && participantIds[0] === localParticipant?.id;
  }, [participantIds, localParticipant?.id]);

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
          <p className="text-sm text-muted-foreground">Aguarde enquanto conectamos você</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-col border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Consulta Online</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {participantIds.length} participante(s)
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* PiP Button - always visible */}
            {'pictureInPictureEnabled' in document && (
              <Button 
                variant={isPipActive ? "default" : "ghost"} 
                size="icon" 
                onClick={togglePictureInPicture}
                title="Picture-in-Picture"
              >
                <PictureInPicture2 className="h-5 w-5" />
              </Button>
            )}
            
          </div>
        </div>

        {/* Waiting message when patient is alone */}
        {isPatientAlone && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <Clock className="h-5 w-5 text-primary flex-shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Aguarde, o profissional entrará em instantes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enquanto isso, você pode{" "}
                  <button onClick={handleViewQueue} className="text-primary hover:underline font-medium">
                    ver sua posição na fila
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area - Grid Layout */}
        <div className={cn("flex-1 p-4 pb-24 overflow-auto", (chatOpen || participantsOpen) && "lg:mr-80")}>
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
                      setPinnedParticipant((prev) => (prev === participantId ? null : participantId))
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl">
              <p className="text-muted-foreground">Aguardando participantes...</p>
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
            {participantsOpen && !chatOpen && <ParticipantsList onClose={() => setParticipantsOpen(false)} />}
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
          {participantsOpen && !chatOpen && <ParticipantsList onClose={() => setParticipantsOpen(false)} />}
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
        roomId={meetingId}
        selectedBackground={selectedBackground}
        onSelectBackground={handleSelectBackground}
        isBackgroundProcessing={isBackgroundProcessing}
      />

      {/* Queue Modal */}
      <Dialog open={queueModalOpen} onOpenChange={setQueueModalOpen}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Fila de Atendimento
            </DialogTitle>
          </DialogHeader>

          {queueLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : queueData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum dado de fila disponível</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queueData.map((item, index) => {
                const isCurrentPatient = item.idCliente === idCliente;
                const statusDisplay = ["AC", "O", "M"].includes(item.status)
                  ? item.statusDescricao
                  : "Paciente ainda não chegou";

                return (
                  <Card
                    key={index}
                    className={cn("transition-all", isCurrentPatient && "ring-2 ring-primary bg-primary/5")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">Posição {index + 1}</span>
                            {isCurrentPatient && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Você
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">Horário: {item.horario || "-"}</p>
                          {item.horaChegada && (
                            <p className="text-xs text-muted-foreground">Check-in: {item.horaChegada}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              isCurrentPatient ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {statusDisplay}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
        maxResolution: "hd",
        defaultCamera: "front",
      }}
      token={token}
      joinWithoutUserInteraction={true}
    >
      <MeetingView
        onLeave={onLeave}
        roomName={`Consulta - ${roomId}`}
        idAgenda={idAgenda}
        idCliente={idCliente}
        nrAtendimento={nrAtendimento}
        cdMedico={cdMedico}
      />
    </MeetingProvider>
  );
};

export default VideoRoom;
