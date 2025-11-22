import { User, KeyRound, UserCircle, LogOut, Moon, Sun, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getApiHeaders } from "@/lib/api-headers";
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
import samelLogo from "@/assets/samel-logo.png";

interface Notification {
  NR_SEQUENCIA: number;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationListDialog, setShowNotificationListDialog] = useState(false);
  const [showNotificationDetailDialog, setShowNotificationDetailDialog] = useState(false);

  const loadNotifications = () => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        // Trata tanto array direto quanto objeto com chave 'dados'
        const notifList = Array.isArray(parsed) ? parsed : (parsed.dados || []);
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
        if (data.sucesso && Array.isArray(data.dados)) {
          // Salva apenas o array de notificações
          localStorage.setItem('notifications', JSON.stringify(data.dados));
          setNotifications(data.dados);
          
          const unread = data.dados.filter((n: Notification) => !n.DT_VISUALIZADO).length;
          setUnreadCount(unread);
        }
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
    setSelectedNotification(notification);
    setShowNotificationListDialog(false);
    setShowNotificationDetailDialog(true);
  };

  const handleMarkAsRead = async () => {
    if (!selectedNotification) return;
    
    // TODO: Implementar chamada à API para marcar como lida
    // const response = await fetch('URL_DA_API', {
    //   method: 'POST',
    //   headers: getApiHeaders(),
    //   body: JSON.stringify({ notificationId: selectedNotification.NR_SEQUENCIA })
    // });
    
    // Após marcar como lida, atualizar o estado local
    setShowNotificationDetailDialog(false);
    setShowNotificationListDialog(true);
    // Recarregar notificações
    await fetchNotifications();
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
    
    // Redireciona para a página de login
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-soft">
      <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl overflow-hidden">
            <img src={samelLogo} alt="Hospital Samel" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-primary md:text-2xl">Portal do Paciente</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-muted-foreground">Olá,</p>
            <p className="text-base font-semibold text-foreground md:text-lg">{patientName}</p>
          </div>
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity order-2 sm:order-1">
                  {profilePhoto ? (
                    <AvatarImage src={`data:image/jpeg;base64,${profilePhoto}`} alt={patientName} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-5 w-5 sm:h-6 sm:w-6" />
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
              className="relative p-2 hover:bg-accent rounded-full transition-colors order-1 sm:order-2"
              onClick={handleOpenNotifications}
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Modal de Lista de Notificações */}
        <Dialog open={showNotificationListDialog} onOpenChange={setShowNotificationListDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
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
                <div className="space-y-1 py-2">
                  {notifications.map((notification, index) => (
                    <div key={notification.NR_SEQUENCIA}>
                      <div 
                        className={`p-4 rounded-lg hover:bg-accent/70 transition-all cursor-pointer ${
                          !notification.DT_VISUALIZADO ? 'bg-primary/5 border-l-4 border-primary' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
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
                      {index < notifications.length - 1 && <Separator className="my-1" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowNotificationListDialog(false)}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes da Notificação */}
        <Dialog open={showNotificationDetailDialog} onOpenChange={setShowNotificationDetailDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
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
                  onClick={handleMarkAsRead}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  Marcar como lida
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
    );
  };
