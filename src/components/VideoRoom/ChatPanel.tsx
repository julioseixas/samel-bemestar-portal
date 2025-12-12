import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, ArrowLeft, KeyRound, Loader2, RefreshCw, Plus, Copy } from "lucide-react";
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
  cdMedico?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  onClose, 
  messages, 
  onSendMessage,
  localParticipantId,
  nrAtendimento,
  cdMedico,
}) => {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tokenPopoverOpen, setTokenPopoverOpen] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  const fetchToken = async () => {
    if (!nrAtendimento) {
      toast.error("Dados do atendimento não disponíveis");
      return;
    }

    setTokenLoading(true);
    try {
      const response = await fetch(
        `https://appv2-back.samel.com.br/api/telemedicina/buscarTokenConsultaTelemed/${nrAtendimento}`
      );
      const data: TokenData[] = await response.json();
      
      if (data && data.length > 0) {
        setTokenData(data[0]);
      } else {
        setTokenData(null);
      }
    } catch (error) {
      console.error("[ChatPanel] Error fetching token:", error);
      toast.error("Erro ao buscar token");
      setTokenData(null);
    } finally {
      setTokenLoading(false);
    }
  };

  const copyToken = async () => {
    if (!tokenData?.DS_TOKEN) return;
    
    try {
      await navigator.clipboard.writeText(tokenData.DS_TOKEN);
      toast.success("Token copiado!");
    } catch (error) {
      console.error("[ChatPanel] Error copying token:", error);
      toast.error("Erro ao copiar token");
    }
  };

  const canGenerateToken = !tokenData || tokenData.VALIDADO === "N";

  const generateToken = async () => {
    if (!nrAtendimento || !cdMedico) {
      toast.error("Dados do atendimento não disponíveis");
      return;
    }

    // Check if token exists and is validated
    if (tokenData && tokenData.VALIDADO === "S") {
      toast.warning("Token já validado, não é possível gerar um novo");
      return;
    }

    setGeneratingToken(true);
    try {
      const response = await fetch(
        "https://appv2-back.samel.com.br/api/telemedicina/criarTokenConsultaTelemed",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nr_atendimento: Number(nrAtendimento),
            cd_medico: cdMedico,
          }),
        }
      );
      const data = await response.json();

      if (data.status === true && data.data?.ds_token) {
        const token = data.data.ds_token;
        // Send token in chat automatically with new format
        onSendMessage(`Meu token: ${token}`);
        toast.success("Token gerado e enviado no chat!");
        // Refresh token list
        await fetchToken();
      } else {
        toast.error(data.message || "Erro ao gerar token");
      }
    } catch (error) {
      console.error("[ChatPanel] Error generating token:", error);
      toast.error("Erro ao gerar token");
    } finally {
      setGeneratingToken(false);
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

  const hasExistingToken = !!tokenData;
  const isTokenValidated = tokenData?.VALIDADO === "S";

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
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">Token da Consulta</p>
                {tokenLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : tokenData ? (
                  <div className="space-y-2">
                    <p className="text-3xl font-bold tracking-widest text-primary">
                      {tokenData.DS_TOKEN}
                    </p>
                    {isTokenValidated && (
                      <p className="text-xs text-green-600 font-medium">✓ Token validado</p>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyToken}
                      className="w-full"
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copiar Token
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum token disponível
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchToken}
                    disabled={tokenLoading}
                    className="w-full"
                  >
                    {tokenLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-2" />
                    )}
                    Atualizar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={generateToken}
                    disabled={generatingToken || tokenLoading || isTokenValidated}
                    className="w-full"
                    title={isTokenValidated ? "Token já validado" : hasExistingToken ? "Substituir token atual" : "Gerar novo token"}
                  >
                    {generatingToken ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-3 w-3 mr-2" />
                    )}
                    Gerar Token
                  </Button>
                </div>
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
