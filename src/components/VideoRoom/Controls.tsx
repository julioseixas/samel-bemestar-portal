import React, { useState, useEffect } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Settings,
  MessageSquare,
  Users,
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
}) => {
  const {
    toggleMic,
    toggleWebcam,
    toggleScreenShare,
    localMicOn,
    localWebcamOn,
    localScreenShareOn,
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

  const handleToggleScreenShare = async () => {
    try {
      await toggleScreenShare();
      toast.info(
        localScreenShareOn
          ? "Compartilhamento encerrado"
          : "Compartilhando tela"
      );
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast.error("Erro ao compartilhar tela");
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {/* Mic Toggle with Dropdown */}
        <div className="flex items-center">
          <Button
            variant={localMicOn ? "secondary" : "destructive"}
            size="lg"
            onClick={handleToggleMic}
            className="rounded-r-none"
          >
            {localMicOn ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={localMicOn ? "secondary" : "destructive"}
                size="lg"
                className="rounded-l-none border-l px-2"
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
            size="lg"
            onClick={handleToggleWebcam}
            className="rounded-r-none"
          >
            {localWebcamOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={localWebcamOn ? "secondary" : "destructive"}
                size="lg"
                className="rounded-l-none border-l px-2"
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

        {/* Screen Share */}
        <Button
          variant={localScreenShareOn ? "default" : "secondary"}
          size="lg"
          onClick={handleToggleScreenShare}
          className="hidden sm:flex"
        >
          {localScreenShareOn ? (
            <MonitorOff className="h-5 w-5" />
          ) : (
            <Monitor className="h-5 w-5" />
          )}
        </Button>

        {/* Chat Toggle */}
        <Button
          variant={chatOpen ? "default" : "secondary"}
          size="lg"
          onClick={onToggleChat}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        {/* Participants Toggle */}
        <Button
          variant={participantsOpen ? "default" : "secondary"}
          size="lg"
          onClick={onToggleParticipants}
          className="hidden sm:flex"
        >
          <Users className="h-5 w-5" />
        </Button>

        {/* Leave Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={onLeave}
          className="ml-4"
        >
          <PhoneOff className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </div>
  );
};

export default Controls;
