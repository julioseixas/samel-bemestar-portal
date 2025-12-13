import React, { useState, useEffect } from "react";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  MessageSquare,
  Users,
  MoreVertical,
  ListOrdered,
  Key,
  Loader2,
  Hash,
  Copy,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getApiHeaders } from "@/lib/api-headers";
import { VideoCallHelpDialog } from "@/components/TelemedicineHelpSection";
import BackgroundSelector, { BackgroundOption, BACKGROUND_OPTIONS } from "./BackgroundSelector";

interface ControlsProps {
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  chatOpen: boolean;
  participantsOpen: boolean;
  onLeave: () => void;
  onViewQueue?: () => void;
  unreadMessages?: number;
  nrAtendimento?: string;
  cdMedico?: string;
  roomId?: string;
  selectedBackground?: string;
  onSelectBackground?: (option: BackgroundOption) => void;
  isBackgroundProcessing?: boolean;
}

interface MediaDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

interface TokenData {
  visibilidade: string;
  token: string;
  idMedico: number;
  idPaciente: number;
  atendimentoId: number;
  VALIDADO?: string;
}

const Controls: React.FC<ControlsProps> = ({
  onToggleChat,
  onToggleParticipants,
  chatOpen,
  participantsOpen,
  onLeave,
  onViewQueue,
  unreadMessages = 0,
  nrAtendimento,
  cdMedico,
  roomId,
  selectedBackground = "none",
  onSelectBackground,
  isBackgroundProcessing = false,
}) => {
  const {
    toggleMic,
    toggleWebcam,
    localMicOn,
    localWebcamOn,
    changeMic,
    changeWebcam,
  } = useMeeting();

  const { publish } = usePubSub("CHAT");

  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isFetchingToken, setIsFetchingToken] = useState(false);

  // Fetch existing token
  const fetchToken = async () => {
    if (!nrAtendimento) return;
    
    setIsFetchingToken(true);
    try {
      const response = await fetch(
        `https://appv2-back.samel.com.br/api/telemedicina/buscarTokenConsultaTelemed/${nrAtendimento}`,
        {
          method: "GET",
          headers: getApiHeaders(),
        }
      );
      
      const data = await response.json();
      
      // API returns an array directly
      if (Array.isArray(data) && data.length > 0) {
        const tokenInfo = data[0];
        setTokenData({
          visibilidade: "",
          token: tokenInfo.DS_TOKEN,
          idMedico: parseInt(tokenInfo.CD_MEDICO) || 0,
          idPaciente: 0,
          atendimentoId: tokenInfo.NR_ATENDIMENTO,
          VALIDADO: tokenInfo.VALIDADO,
        });
      } else {
        setTokenData(null);
      }
    } catch (error) {
      // Error fetching token
    } finally {
      setIsFetchingToken(false);
    }
  };

  // Generate new token
  const handleGenerateToken = async () => {
    if (!nrAtendimento || !cdMedico) {
      toast.error("Dados insuficientes para gerar token");
      return;
    }

    setIsGeneratingToken(true);
    try {
      const response = await fetch(
        "https://appv2-back.samel.com.br/api/telemedicina/criarTokenConsultaTelemed",
        {
          method: "POST",
          headers: {
            ...getApiHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nr_atendimento: parseInt(nrAtendimento),
            cd_medico: cdMedico,
          }),
        }
      );

      const token = await response.text();

      if (token && token.trim()) {
        const tokenMessage = `Meu token: ${token.trim()}`;
        publish(tokenMessage, { persist: true });
        toast.success("Token gerado e enviado no chat!");
        await fetchToken();
      } else {
        toast.error("Erro ao gerar token");
      }
    } catch (error) {
      toast.error("Erro ao gerar token");
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // Fetch token on mount
  useEffect(() => {
    if (nrAtendimento) {
      fetchToken();
    }
  }, [nrAtendimento]);

  // Enumerate devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const audio = devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microfone ${d.deviceId.slice(0, 5)}`,
            kind: d.kind,
          }));
        
        const video = devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Câmera ${d.deviceId.slice(0, 5)}`,
            kind: d.kind,
          }));

        setAudioDevices(audio);
        setVideoDevices(video);

        if (audio.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audio[0].deviceId);
        }
        if (video.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(video[0].deviceId);
        }
      } catch (error) {
        // Error enumerating devices
      }
    };

    getDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener("devicechange", getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices);
    };
  }, []);

  const handleMicChange = async (deviceId: string) => {
    try {
      setSelectedAudioDevice(deviceId);
      await changeMic(deviceId);
      toast.success("Microfone alterado");
    } catch (error) {
      toast.error("Erro ao alterar microfone");
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    try {
      setSelectedVideoDevice(deviceId);
      await changeWebcam(deviceId);
      toast.success("Câmera alterada");
    } catch (error) {
      toast.error("Erro ao alterar câmera");
    }
  };

  const handleToggleMic = () => {
    toggleMic();
    toast.info(localMicOn ? "Microfone desligado" : "Microfone ligado");
  };

  const handleToggleWebcam = () => {
    toggleWebcam();
    toast.info(localWebcamOn ? "Câmera desligada" : "Câmera ligada");
  };


  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-2 sm:p-4 safe-area-pb">
      
      <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-full">
        {/* Mic Toggle with Dropdown */}
        <div className="flex items-center">
          <Button
            variant={localMicOn ? "secondary" : "destructive"}
            size="icon"
            onClick={handleToggleMic}
            className="h-10 w-10 sm:h-11 sm:w-11 sm:rounded-r-none"
          >
            {localMicOn ? (
              <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={localMicOn ? "secondary" : "destructive"}
                size="icon"
                className="hidden sm:flex h-11 w-8 rounded-l-none border-l"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Selecionar Microfone</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {audioDevices.map((device) => (
                <DropdownMenuItem
                  key={device.deviceId}
                  onClick={() => handleMicChange(device.deviceId)}
                  className={cn(
                    selectedAudioDevice === device.deviceId && "bg-accent"
                  )}
                >
                  {device.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Camera Toggle with Dropdown */}
        <div className="flex items-center">
          <Button
            variant={localWebcamOn ? "secondary" : "destructive"}
            size="icon"
            onClick={handleToggleWebcam}
            className="h-10 w-10 sm:h-11 sm:w-11 sm:rounded-r-none"
          >
            {localWebcamOn ? (
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={localWebcamOn ? "secondary" : "destructive"}
                size="icon"
                className="hidden sm:flex h-11 w-8 rounded-l-none border-l"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Selecionar Câmera</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {videoDevices.map((device) => (
                <DropdownMenuItem
                  key={device.deviceId}
                  onClick={() => handleCameraChange(device.deviceId)}
                  className={cn(
                    selectedVideoDevice === device.deviceId && "bg-accent"
                  )}
                >
                  {device.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Background Selector - Desktop only */}
        {onSelectBackground && (
          <div className="hidden sm:block">
            <BackgroundSelector
              selectedBackground={selectedBackground}
              onSelectBackground={onSelectBackground}
              isProcessing={isBackgroundProcessing}
            />
          </div>
        )}


        {/* Chat Toggle - visible on all screen sizes */}
        <Button
          variant={chatOpen ? "default" : "secondary"}
          size="icon"
          onClick={onToggleChat}
          className="h-10 w-10 sm:h-11 sm:w-11 relative"
        >
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadMessages > 0 && !chatOpen && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </Button>

        {/* Participants Toggle - hidden on mobile */}
        <Button
          variant={participantsOpen ? "default" : "secondary"}
          size="icon"
          onClick={onToggleParticipants}
          className="hidden sm:flex h-11 w-11"
        >
          <Users className="h-5 w-5" />
        </Button>

        {/* Queue Button - visible on all screen sizes */}
        {onViewQueue && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onViewQueue}
            className="h-10 w-10 sm:h-11 sm:w-11"
          >
            <ListOrdered className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}

        {/* Token Button - visible on all screen sizes */}
        {nrAtendimento && cdMedico && (
          <Button
            variant={tokenData ? "outline" : "secondary"}
            size="icon"
            onClick={handleGenerateToken}
            disabled={isGeneratingToken}
            className="h-10 w-10 sm:h-11 sm:w-11"
            title="Gerar Token"
          >
            {isGeneratingToken ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Key className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        )}

        {/* Help Button - Desktop only (mobile is in separate row above) */}
        <div className="hidden sm:block">
          <VideoCallHelpDialog />
        </div>

        {/* Mobile More Options - Bottom Sheet */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="sm:hidden h-10 w-10"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="px-4 pb-8">
            <DrawerHeader className="pb-2">
              <DrawerTitle>Mais opções</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-2">
              <Button
                variant={participantsOpen ? "default" : "outline"}
                className="w-full justify-start h-12"
                onClick={onToggleParticipants}
              >
                <Users className="h-5 w-5 mr-3" />
                {participantsOpen ? "Fechar Participantes" : "Ver Participantes"}
              </Button>
              
              {onSelectBackground && (
                <>
                  <div className="pt-2 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">Fundo Virtual</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {BACKGROUND_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => onSelectBackground(option)}
                        disabled={isBackgroundProcessing}
                        className={cn(
                          "relative aspect-video rounded-lg border-2 overflow-hidden transition-all",
                          selectedBackground === option.id
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border",
                          isBackgroundProcessing && "opacity-50"
                        )}
                      >
                        {option.type === "image" && option.preview ? (
                          <img 
                            src={option.preview.replace("w=100", "w=300").replace("q=60", "q=80")} 
                            alt={option.label} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-2 py-1">
                          <span className="text-xs font-medium">{option.label}</span>
                        </div>
                        {selectedBackground === option.id && (
                          <div className="absolute top-1 right-1">
                            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {roomId && (
                <>
                  <div className="pt-2 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">ID da Sala</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12"
                    onClick={() => {
                      navigator.clipboard.writeText(roomId);
                      toast.success("ID da sala copiado!");
                    }}
                  >
                    <div className="flex items-center">
                      <Hash className="h-5 w-5 mr-3" />
                      <span className="font-mono text-sm truncate max-w-[200px]">{roomId}</span>
                    </div>
                    <Copy className="h-4 w-4 opacity-50" />
                  </Button>
                </>
              )}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Leave Button */}
        <Button
          variant="destructive"
          size="icon"
          onClick={onLeave}
          className="h-10 w-10 sm:h-11 sm:w-auto sm:px-4 ml-1 sm:ml-2"
        >
          <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
      
      {/* Mobile Help Button - Full Width below controls */}
      <div className="sm:hidden w-full mt-2">
        <VideoCallHelpDialog 
          fullWidth 
          className="w-full h-10 justify-center"
        />
      </div>
    </div>
  );
};

export default Controls;
