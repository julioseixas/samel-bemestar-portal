import { User, KeyRound, UserCircle, LogOut, Moon, Sun, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        const notifList = parsed.dados || [];
        setNotifications(notifList);
        
        const unread = notifList.filter((n: Notification) => !n.DT_VISUALIZADO).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      }
    }
  }, []);

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
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity">
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
            
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 hover:bg-accent rounded-full transition-colors">
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
              </PopoverTrigger>
              
              <PopoverContent className="w-80 sm:w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-lg">Notificações</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</Badge>
                  )}
                </div>
                
                <ScrollArea className="h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mb-2 opacity-20" />
                      <p>Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.NR_SEQUENCIA}
                          className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                            !notification.DT_VISUALIZADO ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm line-clamp-1">
                              {notification.DS_TITULO}
                            </h4>
                            {!notification.DT_VISUALIZADO && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {notification.DESCRICAO}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.DATA_FORMATADA}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
    );
  };
