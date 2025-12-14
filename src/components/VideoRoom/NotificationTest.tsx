import React, { useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationTestProps {
  idCliente?: string;
}

const NotificationTest: React.FC<NotificationTestProps> = ({ idCliente }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  
  const { sendTestNotification, triggerAndroidNotification } = usePushNotifications(idCliente);

  const handleTest = async () => {
    setIsTesting(true);
    setTestSuccess(false);
    
    try {
      // Try Android bridge first
      if (window.AndroidNotificationBridge) {
        window.AndroidNotificationBridge.triggerTestNotification(
          "Notificações Ativas",
          "Você receberá alertas quando o médico entrar na consulta."
        );
        setTestSuccess(true);
      } else if ("Notification" in window) {
        // Request permission if needed
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
        
        if (Notification.permission === "granted") {
          new Notification("Notificações Ativas", {
            body: "Você receberá alertas quando o médico entrar na consulta.",
            icon: "/favicon.png",
            tag: "notification-test",
          });
          setTestSuccess(true);
        }
      }
    } catch (error) {
      console.error("Error testing notification:", error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">Notificações</span>
        </div>
        {testSuccess && (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Teste as notificações para garantir que você será avisado quando o médico entrar.
      </p>

      <Button 
        size="sm" 
        variant="outline" 
        className="w-full"
        onClick={handleTest}
        disabled={isTesting}
      >
        {isTesting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Bell className="h-4 w-4 mr-2" />
        )}
        Testar Notificação
      </Button>
    </div>
  );
};

export default NotificationTest;
