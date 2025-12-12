import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

interface TokenData {
  NR_SEQUENCIA: number;
  NR_ATENDIMENTO: number;
  CD_MEDICO: string;
  DS_TOKEN: string;
  DT_VALIDADE: string;
  VALIDADO: string;
}

interface ChatPanelProps {
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  localParticipantId?: string;
  nrAtendimento?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  onClose, 
  messages, 
  onSendMessage,
  localParticipantId,
  nrAtendimento,
}) => {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tokenPopoverOpen, setTokenPopoverOpen] = useState(false);

  const fetchToken = async () => {
    if (!nrAtendimento) {
      toast.error("Dados do atendimento não disponíveis");
      return;
    }

    setTokenLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/telemedicina/buscarTokenConsultaTelemed/${nrAtendimento}`
      );
      const data: TokenData[] = await response.json();
      
      if (data && data.length > 0) {
        setTokenData(data[0]);
      } else {
        setTokenData(null);
        toast.info("Nenhum token disponível no momento");
      }
    } catch (error) {
      console.error("[ChatPanel] Error fetching token:", error);
      toast.error("Erro ao buscar token");
      setTokenData(null);
    } finally {
      setTokenLoading(false);
    }
  };

  const handleTokenClick = () => {
    setTokenPopoverOpen(true);
    fetchToken();
  };

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
    onSendMessage(message.trim());
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
    <div className="flex flex-col h-full bg-background overflow-hidden">
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
        <div className="flex items-center gap-1">
          <Popover open={tokenPopoverOpen} onOpenChange={setTokenPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleTokenClick}
                className="h-8 w-8"
                title="Ver token do médico"
              >
                {tokenLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Token do Médico</p>
                {tokenLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : tokenData ? (
                  <p className="text-3xl font-bold tracking-widest text-primary">
                    {tokenData.DS_TOKEN}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum token disponível
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="hidden lg:flex h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages - responsive with proper flex sizing */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs sm:text-sm py-6 sm:py-8">
                Nenhuma mensagem ainda. Inicie uma conversa!
              </div>
            ) : (
              messages.map((msg) => {
                const isLocal = msg.senderId === localParticipantId;
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
      </div>

      {/* Input - responsive and always visible */}
      <div className="p-3 sm:p-4 border-t shrink-0 bg-background">
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
