import React, { useMemo, useRef, useEffect } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";
import { Mic, MicOff, Video, VideoOff, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantViewProps {
  participantId: string;
  isLocal?: boolean;
  isMainView?: boolean;
  onPin?: (id: string) => void;
  isPinned?: boolean;
}

const ParticipantView: React.FC<ParticipantViewProps> = ({
  participantId,
  isLocal = false,
  isMainView = false,
  onPin,
  isPinned = false,
}) => {
  const {
    webcamStream,
    micStream,
    webcamOn,
    micOn,
    isActiveSpeaker,
    displayName,
    screenShareOn,
    screenShareStream,
  } = useParticipant(participantId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle webcam stream
  useEffect(() => {
    if (videoRef.current && webcamStream && webcamOn) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(console.error);
    }
  }, [webcamStream, webcamOn]);

  // Handle audio stream (only for remote participants to avoid echo)
  useEffect(() => {
    if (audioRef.current && micStream && micOn && !isLocal) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);
      audioRef.current.srcObject = mediaStream;
      audioRef.current.play().catch(console.error);
    }
  }, [micStream, micOn, isLocal]);

  // Handle screen share stream
  useEffect(() => {
    if (screenShareRef.current && screenShareStream && screenShareOn) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(screenShareStream.track);
      screenShareRef.current.srcObject = mediaStream;
      screenShareRef.current.play().catch(console.error);
    }
  }, [screenShareStream, screenShareOn]);

  const initials = useMemo(() => {
    if (!displayName) return "?";
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [displayName]);

  return (
    <div
      className={cn(
        "relative bg-muted rounded-xl overflow-hidden transition-all duration-300",
        isMainView ? "w-full h-full" : "aspect-video",
        isActiveSpeaker && !isMainView && "ring-2 ring-primary",
        isPinned && "ring-2 ring-yellow-500"
      )}
      onClick={() => onPin?.(participantId)}
    >
      {/* Screen share view */}
      {screenShareOn && screenShareStream ? (
        <video
          ref={screenShareRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain bg-black"
        />
      ) : webcamOn && webcamStream ? (
        /* Webcam view */
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            "w-full h-full object-contain bg-black",
            isLocal && "transform scale-x-[-1]"
          )}
        />
      ) : (
        /* Avatar fallback */
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div
            className={cn(
              "rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold",
              isMainView ? "w-32 h-32 text-4xl" : "w-16 h-16 text-xl"
            )}
          >
            {initials}
          </div>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate max-w-[150px]">
              {displayName || "Participante"}
              {isLocal && " (Você)"}
            </span>
            {screenShareOn && (
              <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                Tela
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {micOn ? (
              <Mic className="h-4 w-4 text-white" />
            ) : (
              <MicOff className="h-4 w-4 text-red-500" />
            )}
            {webcamOn ? (
              <Video className="h-4 w-4 text-white" />
            ) : (
              <VideoOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Pin indicator */}
      {isPinned && (
        <div className="absolute top-2 right-2">
          <Pin className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        </div>
      )}

      {/* Active speaker indicator */}
      {isActiveSpeaker && (
        <div className="absolute top-2 left-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* Hidden audio element for remote participants */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}
    </div>
  );
};

export default ParticipantView;
