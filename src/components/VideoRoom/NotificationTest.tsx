import React, { useState } from "react";
import { Bell, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationTestProps {
  idCliente?: string;
}

const NotificationTest: React.FC<NotificationTestProps> = ({ idCliente }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  
  const { triggerAndroidNotification } = usePushNotifications(idCliente);

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
    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Bell className="h-4 w-4" />
        Teste de Notificação
      </h3>

      {/* Notification Test */}
      <div className="flex items-center justify-between p-3 bg-background rounded-lg">
        <div className="flex items-center gap-3">
          {testSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">Notificações</p>
            <p className="text-xs text-muted-foreground">
              {testSuccess ? "Notificação enviada" : "Clique para testar"}
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant={testSuccess ? "outline" : "default"}
          onClick={handleTest}
          disabled={isTesting}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {testSuccess ? "Testar novamente" : "Testar"}
        </Button>
      </div>

      {/* Status summary */}
      {testSuccess && (
        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Pronto para receber alertas!
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationTest;
