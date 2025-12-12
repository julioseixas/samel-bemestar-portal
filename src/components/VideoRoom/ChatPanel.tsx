import React, { useState, useRef, useEffect } from "react";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

// Store messages outside component to persist during session
const sessionMessages: Map<string, ChatMessage[]> = new Map();

const ChatPanel: React.FC<ChatPanelProps> = ({ onClose }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { localParticipant, meetingId } = useMeeting();

  // Load persisted messages on mount
  useEffect(() => {
    if (meetingId) {
      const existingMessages = sessionMessages.get(meetingId) || [];
      setMessages(existingMessages);
    }
  }, [meetingId]);

  // Parse message helper - handles both JSON and plain text
  const parseMessage = (data: any): ChatMessage | null => {
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
      console.error("[ChatPanel] Error parsing message:", error);
      return null;
    }
  };

  // Use PubSub for chat
  const { publish } = usePubSub("CHAT", {
    onMessageReceived: (data: any) => {
      console.log("[ChatPanel] Received raw message:", data);
      
      const newMessage = parseMessage(data);
      if (!newMessage) return;

      // Check for duplicates
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (m) => m.senderId === newMessage.senderId && 
                 m.message === newMessage.message &&
                 Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 2000
        );
        
        if (isDuplicate) {
          console.log("[ChatPanel] Duplicate message ignored");
          return prev;
        }

        const updated = [...prev, newMessage];
        
        // Persist messages for this meeting
        if (meetingId) {
          sessionMessages.set(meetingId, updated);
        }
        
        return updated;
      });
    },
    onOldMessagesReceived: (oldMessages: any[]) => {
      console.log("[ChatPanel] Received old messages:", oldMessages);
      
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;

    // Send as plain text for simplicity
    publish(message.trim(), { persist: true });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - responsive */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="lg:hidden h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold text-sm sm:text-base">Chat</h3>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {messages.length}
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="hidden lg:flex h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages - responsive */}
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
        <div className="space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs sm:text-sm py-6 sm:py-8">
              Nenhuma mensagem ainda. Inicie uma conversa!
            </div>
          ) : (
            messages.map((msg) => {
              const isLocal = msg.senderId === localParticipant?.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-0.5 sm:gap-1",
                    isLocal ? "items-end" : "items-start"
                  )}
                >
                  <span className="text-[10px] sm:text-xs text-muted-foreground px-1">
                    {isLocal ? "Você" : msg.senderName}
                  </span>
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[80%] rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm break-words",
                      isLocal
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input - responsive */}
      <div className="p-3 sm:p-4 border-t shrink-0 pb-safe">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 text-sm sm:text-base h-9 sm:h-10"
          />
          <Button 
            onClick={handleSend} 
            disabled={!message.trim()}
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
