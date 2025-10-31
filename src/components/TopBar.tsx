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
    <header className="bg-card border-b border-border h-14 flex items-center justify-between px-6 shadow-soft">
      <nav className="flex items-center gap-6">
        <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
          <Home className="h-4 w-4 mr-2" />
          INÍCIO
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <User className="h-4 w-4 mr-2" />
          MEUS DADOS
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <FileText className="h-4 w-4 mr-2" />
          HISTÓRICO
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <MessageSquare className="h-4 w-4 mr-2" />
          FALE CONOSCO
        </Button>
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>(92) 2129-2200</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem key={notif.NR_SEQUENCIA} className="flex flex-col items-start p-4 cursor-pointer">
                  <div className="font-semibold text-sm mb-1">{notif.DS_TITULO}</div>
                  <div className="text-xs text-muted-foreground mb-2">{notif.DESCRICAO}</div>
                  <div className="text-xs text-muted-foreground">{notif.DATA_FORMATADA}</div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
};
