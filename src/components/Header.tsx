import { User, KeyRound, UserCircle, LogOut, Moon, Sun, Bell, Phone, Mail, Copy, BookOpen, Shield, HelpCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getApiHeaders } from "@/lib/api-headers";
import { clearAuthCookies } from "@/lib/cookie-storage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { TermsOfUseModal } from "@/components/TermsOfUseModal";
import samelLogo from "@/assets/samel-logo.png";

interface Notification {
  NR_SEQUENCIA: number;
  NR_ATENDIMENTO?: number;
  CD_USUARIO: number;
  CD_PESSOA_FISICA: number;
  DATA_FORMATADA: string;
  DESCRICAO: string;
  DS_TITULO: string;
  DT_ENTRADA: string;
  DT_VISUALIZADO: string | null;
  IE_BADGE: string | null;
  URL_LINK: string;
}

interface HeaderProps {
  patientName?: string;
  profilePhoto?: string;
}

export const Header = ({ patientName = "Maria Silva", profilePhoto }: HeaderProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationListDialog, setShowNotificationListDialog] = useState(false);
  const [showNotificationDetailDialog, setShowNotificationDetailDialog] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  const loadNotifications = () => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        // Trata tanto array direto quanto objeto com chave 'dados'
        // Se 'dados' for um objeto vazio, usa array vazio
        let notifList = [];
        if (Array.isArray(parsed)) {
          notifList = parsed;
        } else if (parsed.dados && Array.isArray(parsed.dados)) {
          notifList = parsed.dados;
        }
        
        setNotifications(notifList);
        
        const unread = notifList.filter((n: Notification) => !n.DT_VISUALIZADO).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const patientDataRaw = localStorage.getItem('patientData');
      if (!patientDataRaw) {
        console.error("patientData não encontrado no localStorage");
        return;
      }

      let patientData;
      try {
        patientData = JSON.parse(patientDataRaw);
      } catch (parseError) {
        console.error("Erro ao fazer parse do patientData:", parseError);
        return;
      }

      const idCliente = patientData.cd_pessoa_fisica || patientData.id;
      
      if (!idCliente) {
        console.error("idCliente não encontrado em patientData");
        return;
      }
      
      const response = await fetch(
        'https://api-portalpaciente-web.samel.com.br/api/notificacao/ObterNotificacoesCliente',
        {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ idCliente }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Se 'dados' for um objeto vazio, trata como array vazio
        const notifList = Array.isArray(data.dados) ? data.dados : [];
        
        // Salva apenas o array de notificações
        localStorage.setItem('notifications', JSON.stringify(notifList));
        setNotifications(notifList);
        
        const unread = notifList.filter((n: Notification) => !n.DT_VISUALIZADO).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleOpenNotifications = async () => {
    setShowNotificationListDialog(true);
    await fetchNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Se for notificação de Pesquisa de Satisfação, redireciona para avaliação com nr_atendimento
    if (notification.DS_TITULO === "Pesquisa e Satisfação") {
      setShowNotificationListDialog(false);
      const nrAtendimento = notification.NR_ATENDIMENTO;
      navigate(`/rate-appointments${nrAtendimento ? `?nr_atendimento=${nrAtendimento}` : ''}`);
      return;
    }
    
    setSelectedNotification(notification);
    setShowNotificationListDialog(false);
    setShowNotificationDetailDialog(true);
  };

  const handleMarkAsRead = async (notification?: Notification) => {
    const notificationToMark = notification || selectedNotification;
    if (!notificationToMark || isMarkingAsRead) return;
    
    setIsMarkingAsRead(true);
    
    try {
      const patientDataRaw = localStorage.getItem('patientData');
      if (!patientDataRaw) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Dados do paciente não encontrados.",
        });
        return;
      }

      const patientData = JSON.parse(patientDataRaw);
      const idCliente = patientData.cd_pessoa_fisica || patientData.id;

      const response = await fetch(
        'https://appv2-back.samel.com.br/api/notificacao/NotificacaoVisualizada',
        {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            idCliente: idCliente.toString(),
            idNotificacao: notificationToMark.NR_SEQUENCIA
          }),
        }
      );

      const data = await response.json();

      if (!data.sucesso) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.mensagem || "Não foi possível marcar a notificação como lida.",
        });
        return;
      }

      // Se estiver no modal de detalhes, voltar para a lista
      if (selectedNotification) {
        setShowNotificationDetailDialog(false);
        setShowNotificationListDialog(true);
      }
      
      // Recarregar notificações
      await fetchNotifications();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao marcar notificação como lida.",
      });
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.DT_VISUALIZADO);
    
    if (unreadNotifications.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há notificações não lidas.",
      });
      return;
    }

    setIsMarkingAllAsRead(true);

    try {
      const patientDataRaw = localStorage.getItem('patientData');
      if (!patientDataRaw) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Dados do paciente não encontrados.",
        });
        return;
      }

      const patientData = JSON.parse(patientDataRaw);
      const idCliente = patientData.cd_pessoa_fisica || patientData.id;

      // Loop para marcar todas as notificações não lidas
      for (const notification of unreadNotifications) {
        await fetch(
          'https://appv2-back.samel.com.br/api/notificacao/NotificacaoVisualizada',
          {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
              idCliente: idCliente.toString(),
              idNotificacao: notification.NR_SEQUENCIA
            }),
          }
        );
      }

      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas.",
      });

      // Recarregar notificações
      await fetchNotifications();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao marcar todas as notificações como lidas.",
      });
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  const handleLogout = () => {
    // Remove todos os dados do paciente do localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('titular');
    localStorage.removeItem('listToSchedule');
    localStorage.removeItem('selectedPatient');
    localStorage.removeItem('patientData');
    localStorage.removeItem('profilePhoto');
    localStorage.removeItem('notifications');
    localStorage.removeItem('rating');
    
    // Limpa qualquer outro dado remanescente
    localStorage.clear();
    
    // Limpa cookies de autenticação
    clearAuthCookies();
    
    // Redireciona para a página de login
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm backdrop-blur-sm bg-card/95">
      <div className="container mx-auto flex h-14 sm:h-16 md:h-20 items-center justify-between px-3 sm:px-6 md:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-xl overflow-hidden">
            <img src={samelLogo} alt="Hospital Samel" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-primary leading-tight md:text-lg">Portal do Paciente</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs sm:text-sm text-muted-foreground">Olá,</p>
            <p className="text-sm sm:text-base font-semibold text-foreground leading-tight">{patientName}</p>
          </div>
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 sm:h-11 sm:w-11 border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity order-2 sm:order-1">
                  {profilePhoto ? (
                    <AvatarImage src={`data:image/jpeg;base64,${profilePhoto}`} alt={patientName} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Atualizar senha</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/personal-data")}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Ver dados pessoais</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setShowContactDialog(true)}>
                  <Phone className="mr-2 h-4 w-4" />
                  <span>Contato</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.open("https://cartilha.samel.com.br", "_blank")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Cartilha Samel</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.open("https://www.samel.com.br/politica-de-privacidade/", "_blank")}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Política de Privacidade</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setShowTermsDialog(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Termos de Uso</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.open("https://www.samel.com.br/sobre-nos/faq/", "_blank")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>FAQ</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer" 
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "light" ? (
                    <Moon className="mr-2 h-4 w-4" />
                  ) : (
                    <Sun className="mr-2 h-4 w-4" />
                  )}
                  <span>{theme === "light" ? "Modo escuro" : "Modo claro"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button 
              className="relative p-1.5 sm:p-2 hover:bg-accent rounded-full transition-colors order-1 sm:order-2"
              onClick={handleOpenNotifications}
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs font-bold"
                >
                  {unreadCount > 99 ? '9+' : unreadCount}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Modal de Lista de Notificações */}
        <Dialog open={showNotificationListDialog} onOpenChange={setShowNotificationListDialog}>
          <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-3xl h-[75vh] sm:h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b space-y-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl sm:text-2xl">Notificações</DialogTitle>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-4 sm:px-6">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Bell className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  {notifications.map((notification, index) => (
                    <div key={notification.NR_SEQUENCIA}>
                      <div 
                        className={`p-4 rounded-lg transition-all relative ${
                          !notification.DT_VISUALIZADO ? 'bg-primary/5 border-l-4 border-primary' : ''
                        }`}
                      >
                        <div
                          onClick={() => handleNotificationClick(notification)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="font-semibold text-sm sm:text-base line-clamp-2 flex-1">
                              {notification.DS_TITULO}
                            </h4>
                            {!notification.DT_VISUALIZADO && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-2 leading-relaxed">
                            {notification.DESCRICAO}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.DATA_FORMATADA}
                          </p>
                        </div>
                        {!notification.DT_VISUALIZADO && (
                          <div className="mt-3 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification);
                              }}
                              disabled={isMarkingAsRead}
                              className="w-full sm:w-auto text-xs"
                            >
                              {isMarkingAsRead ? "Marcando..." : "Marcar como lida"}
                            </Button>
                          </div>
                        )}
                      </div>
                      {index < notifications.length - 1 && <Separator className="my-1" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="flex-col sm:flex-row gap-2 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 border-t">
              {unreadCount > 0 && (
                <Button 
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllAsRead}
                  className="w-full sm:w-auto order-1"
                >
                  {isMarkingAllAsRead ? "Marcando..." : "Marcar todas como lidas"}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowNotificationListDialog(false)}
                className="w-full sm:w-auto order-2"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes da Notificação */}
        <Dialog open={showNotificationDetailDialog} onOpenChange={setShowNotificationDetailDialog}>
          <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[75vh] sm:max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b">
              <DialogTitle className="text-lg sm:text-xl pr-8 leading-tight">
                {selectedNotification?.DS_TITULO}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-4 sm:px-6 py-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedNotification?.DATA_FORMATADA}</span>
                  {!selectedNotification?.DT_VISUALIZADO && (
                    <Badge variant="secondary" className="text-xs">Não lida</Badge>
                  )}
                </div>
                
                <Separator />
                
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedNotification?.DESCRICAO}
                  </p>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="flex-col sm:flex-row gap-2 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNotificationDetailDialog(false);
                  setShowNotificationListDialog(true);
                }}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Voltar
              </Button>
              {!selectedNotification?.DT_VISUALIZADO && (
                <Button 
                  onClick={() => handleMarkAsRead(selectedNotification)}
                  disabled={isMarkingAsRead}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {isMarkingAsRead ? "Marcando..." : "Marcar como lida"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Contato */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md max-h-[calc(100vh-1.5rem)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Contato</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Central de Atendimento */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Central de Atendimento</h4>
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <a href="tel:+559221292200" className="font-medium text-foreground hover:text-primary transition-colors">
                        (92) 2129-2200
                      </a>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText("(92) 2129-2200");
                            toast({ title: "Copiado!", description: "Telefone copiado para a área de transferência." });
                          }}
                          className="h-9 w-9"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copiar telefone</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Suporte ao Aplicativo */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Suporte ao Aplicativo</h4>
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <a href="tel:+559295040866" className="font-medium text-foreground hover:text-primary transition-colors">
                        (92) 9504-0866
                      </a>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText("(92) 9504-0866");
                            toast({ title: "Copiado!", description: "Telefone copiado para a área de transferência." });
                          }}
                          className="h-9 w-9"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copiar telefone</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Ouvidoria */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Ouvidoria</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <a href="tel:+5592994168385" className="font-medium text-foreground hover:text-primary transition-colors">
                          (92) 99416-8385
                        </a>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText("(92) 99416-8385");
                              toast({ title: "Copiado!", description: "Telefone copiado para a área de transferência." });
                            }}
                            className="h-9 w-9"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar telefone</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <a href="mailto:ouvidoria@samel.com.br" className="font-medium text-foreground hover:text-primary transition-colors text-sm sm:text-base break-all">
                          ouvidoria@samel.com.br
                        </a>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText("ouvidoria@samel.com.br");
                              toast({ title: "Copiado!", description: "E-mail copiado para a área de transferência." });
                            }}
                            className="h-9 w-9"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar e-mail</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowContactDialog(false)} className="w-full sm:w-auto">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Termos de Uso */}
        <TermsOfUseModal open={showTermsDialog} onOpenChange={setShowTermsDialog} />
      </header>
    );
  };
