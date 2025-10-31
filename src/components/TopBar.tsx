import { Bell, Phone, LogOut, Home, User, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const TopBar = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const notifData = localStorage.getItem("notifications");
    if (notifData) {
      try {
        const parsed = JSON.parse(notifData);
        setNotifications(parsed);
        // Count unread notifications (those without DT_VISUALIZADO)
        const unread = parsed.filter((n: any) => !n.DT_VISUALIZADO).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="bg-card border-b border-border/50 h-16 flex items-center justify-between px-8 shadow-sm backdrop-blur-sm">
      <nav className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-foreground hover:text-primary hover:bg-primary/5 font-medium transition-all duration-200"
        >
          <Home className="h-4 w-4 mr-2" />
          INÍCIO
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium transition-all duration-200"
        >
          <User className="h-4 w-4 mr-2" />
          MEUS DADOS
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium transition-all duration-200"
        >
          <FileText className="h-4 w-4 mr-2" />
          HISTÓRICO
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium transition-all duration-200"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          FALE CONOSCO
        </Button>
      </nav>

      <div className="flex items-center gap-6">
        {/* Phone number */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
          <div className="p-1.5 rounded-lg bg-primary/5">
            <Phone className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">(92) 2129-2200</span>
        </div>

        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-primary/5 transition-all duration-200"
            >
              <Bell className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold animate-pulse"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-h-[32rem] overflow-y-auto shadow-xl border border-border/50 rounded-xl">
            <div className="p-4 border-b border-border/50 bg-muted/30">
              <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unreadCount} {unreadCount === 1 ? 'nova notificação' : 'novas notificações'}
                </p>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((notif) => (
                  <DropdownMenuItem 
                    key={notif.NR_SEQUENCIA} 
                    className="flex flex-col items-start p-4 cursor-pointer hover:bg-primary/5 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between w-full gap-2 mb-2">
                      <div className="font-semibold text-sm text-foreground">{notif.DS_TITULO}</div>
                      {!notif.DT_VISUALIZADO && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed mb-2">{notif.DESCRICAO}</div>
                    <div className="text-xs text-primary font-medium">{notif.DATA_FORMATADA}</div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-medium transition-all duration-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
};
