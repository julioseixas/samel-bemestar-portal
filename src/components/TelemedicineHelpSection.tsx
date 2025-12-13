import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Camera, 
  Mail, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff,
  MessageSquare,
  Users,
  Key,
  PhoneOff,
  ListOrdered,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PictureInPicture2,
  Bell,
  Hash,
  Copy,
  Volume2
} from "lucide-react";

interface TelemedicineHelpProps {
  variant?: "full" | "compact";
}

export const TelemedicineHelpSection = ({ variant = "full" }: TelemedicineHelpProps) => {
  if (variant === "full") {
    return (
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
            Como usar a Telemedicina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="checkin">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Passo 1: Realizar o Check-in
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <p>Antes de entrar na consulta, você precisa fazer o check-in para confirmar sua presença:</p>
                <div className="space-y-2 pl-4">
                  <div className="flex items-start gap-2">
                    <Camera className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Opção 1: Reconhecimento Facial</p>
                      <p>Clique em "Câmera" e posicione seu rosto na frente da câmera. O sistema validará sua identidade automaticamente.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Opção 2: Código por Email</p>
                      <p>Clique em "Email" para receber um código de validação no seu email cadastrado. Digite o código recebido para confirmar.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg border border-warning/20">
                  <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                  <p className="text-xs">Você tem até 15 minutos antes do horário agendado para fazer o check-in.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notifications">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Passo 2: Ativar Notificações
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <p>Ative as notificações para ser avisado quando o médico entrar na sala:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Clique em "Ativar notificações" quando solicitado</li>
                  <li>Permita as notificações no seu navegador</li>
                  <li>Use o botão "Testar" para verificar se está funcionando</li>
                  <li>Você receberá um alerta sonoro e visual quando o médico entrar</li>
                </ul>
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                  <Volume2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-xs">Mantenha o som do dispositivo ligado para ouvir os alertas.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="enter">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Passo 3: Entrar na Sala de Consulta
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <p>Após realizar o check-in, o botão "Entrar na Sala de Consulta" ficará disponível:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Clique no botão para entrar na videochamada</li>
                  <li>Permita o acesso à câmera e microfone quando solicitado</li>
                  <li>Aguarde o profissional de saúde entrar na sala</li>
                </ul>
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-xs">Recomendamos entrar alguns minutos antes do horário agendado.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="queue">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-primary" />
                  Verificar Fila de Atendimento
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <p>Depois do check-in, você pode acompanhar sua posição na fila:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Clique em "Ver Fila de Atendimento" para ver sua posição</li>
                  <li>Durante a chamada, a fila aparece em uma janela sem sair da consulta</li>
                  <li>Acompanhe o status do seu atendimento em tempo real</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tips">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Dicas para uma boa consulta
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Internet:</strong> Use uma conexão Wi-Fi estável para melhor qualidade de vídeo</li>
                  <li><strong>Ambiente:</strong> Escolha um local silencioso e bem iluminado</li>
                  <li><strong>Dispositivo:</strong> Verifique se câmera e microfone estão funcionando</li>
                  <li><strong>Documentos:</strong> Tenha em mãos exames e receitas anteriores, se necessário</li>
                  <li><strong>Privacidade:</strong> Certifique-se de estar em um ambiente privado</li>
                  <li><strong>Fones:</strong> Use fones de ouvido para melhor qualidade de áudio</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  }

  return null;
};

// Componente de ajuda para dentro da videochamada
interface VideoCallHelpDialogProps {
  className?: string;
  fullWidth?: boolean;
}

export const VideoCallHelpDialog = ({ className, fullWidth }: VideoCallHelpDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={fullWidth ? "default" : "icon"}
          className={className || "h-10 w-10 sm:h-11 sm:w-11"}
          title="Ajuda"
        >
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          {fullWidth && <span className="ml-2">Ajuda</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Ajuda - Controles da Videochamada
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Microfone</p>
                <p className="text-muted-foreground text-xs">Clique para ligar/desligar o microfone. Use a seta para escolher outro dispositivo de áudio.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Câmera</p>
                <p className="text-muted-foreground text-xs">Clique para ligar/desligar a câmera. Use a seta para escolher outra câmera (disponível apenas em desktop).</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Fundo Virtual</p>
                <p className="text-muted-foreground text-xs">Aplique efeitos de desfoque (leve ou forte) ou escolha uma imagem de fundo para sua câmera. Disponível no menu em dispositivos móveis.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Chat</p>
                <p className="text-muted-foreground text-xs">Abra o chat para enviar mensagens de texto durante a consulta. Um indicador vermelho mostra mensagens não lidas e você ouvirá um som ao receber novas mensagens.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Participantes</p>
                <p className="text-muted-foreground text-xs">Veja a lista de pessoas na chamada. Um som será tocado quando alguém entrar ou sair.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <PictureInPicture2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Picture-in-Picture</p>
                <p className="text-muted-foreground text-xs">Clique no ícone no canto superior para ver o vídeo em uma janela flutuante enquanto usa outros aplicativos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <ListOrdered className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Fila de Atendimento</p>
                <p className="text-muted-foreground text-xs">Clique para ver sua posição na fila. A fila aparece em uma janela sem sair da consulta.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Token</p>
                <p className="text-muted-foreground text-xs">Gere um token de 4 dígitos se solicitado pelo profissional. O token será enviado automaticamente no chat.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary">
                <Hash className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">ID da Sala</p>
                <p className="text-muted-foreground text-xs">No menu de opções, você pode copiar o ID da sala para compartilhar com o suporte técnico se necessário.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive">
                <PhoneOff className="h-4 w-4 text-destructive-foreground" />
              </div>
              <div>
                <p className="font-medium">Sair</p>
                <p className="text-muted-foreground text-xs">Clique para encerrar a videochamada e sair da consulta.</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="font-medium text-primary mb-1">Dicas importantes:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Mantenha o microfone desligado quando não estiver falando para reduzir ruídos</li>
              <li>Posicione a câmera na altura dos olhos para melhor contato visual</li>
              <li>Use fones de ouvido para melhor qualidade de áudio</li>
              <li>Se tiver problemas de conexão, tente desligar a câmera temporariamente</li>
              <li>Use o fundo virtual para maior privacidade em ambientes movimentados</li>
              <li>Ative as notificações para ser avisado quando o médico entrar</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelemedicineHelpSection;
