import React from "react";
import { useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantsListProps {
  onClose: () => void;
}

interface ParticipantItemProps {
  participantId: string;
  isLocal: boolean;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({
  participantId,
  isLocal,
}) => {
  const { displayName, webcamOn, micOn, screenShareOn } =
    useParticipant(participantId);

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {displayName || "Participante"}
          {isLocal && (
            <span className="text-muted-foreground ml-1">(Você)</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {screenShareOn && (
          <Monitor className="h-4 w-4 text-blue-500" />
        )}
        {micOn ? (
          <Mic className="h-4 w-4 text-muted-foreground" />
        ) : (
          <MicOff className="h-4 w-4 text-red-500" />
        )}
        {webcamOn ? (
          <Video className="h-4 w-4 text-muted-foreground" />
        ) : (
          <VideoOff className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
};

const ParticipantsList: React.FC<ParticipantsListProps> = ({ onClose }) => {
  const { participants, localParticipant } = useMeeting();

  const participantIds = [...participants.keys()];

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">
          Participantes ({participantIds.length})
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {participantIds.map((id) => (
            <ParticipantItem
              key={id}
              participantId={id}
              isLocal={id === localParticipant?.id}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParticipantsList;
