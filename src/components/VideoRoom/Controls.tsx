import React, { useState, useEffect } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ControlsProps {
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  chatOpen: boolean;
  participantsOpen: boolean;
  onLeave: () => void;
  onViewQueue?: () => void;
  unreadMessages?: number;
}

interface MediaDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

const Controls: React.FC<ControlsProps> = ({
  onToggleChat,
  onToggleParticipants,
  chatOpen,
  participantsOpen,
  onLeave,
  onViewQueue,
  unreadMessages = 0,
}) => {
  const {
    toggleMic,
    toggleWebcam,
    localMicOn,
    localWebcamOn,
    changeMic,
    changeWebcam,
  } = useMeeting();

  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");

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
        console.error("Error enumerating devices:", error);
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
      console.error("Error changing mic:", error);
      toast.error("Erro ao alterar microfone");
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    try {
      setSelectedVideoDevice(deviceId);
      await changeWebcam(deviceId);
      toast.success("Câmera alterada");
    } catch (error) {
      console.error("Error changing camera:", error);
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
      <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap max-w-full">
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

        {/* Mobile More Options Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="sm:hidden h-10 w-10"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem onClick={onToggleParticipants}>
              <Users className="h-4 w-4 mr-2" />
              {participantsOpen ? "Fechar Participantes" : "Ver Participantes"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
    </div>
  );
};

export default Controls;
