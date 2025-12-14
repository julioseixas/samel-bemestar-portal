import React, { useState } from "react";
import { Bell, BellOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationTestProps {
  idCliente?: string;
  onTestComplete?: (success: boolean) => void;
}

const NotificationTest: React.FC<NotificationTestProps> = ({ idCliente, onTestComplete }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  
  const pushNotifications = usePushNotifications(idCliente);
  const { subscribe, sendTestNotification } = pushNotifications;
  const permission = pushNotifications.permission;
  const isSubscribed = pushNotifications.isSubscribed;

  const handleRequestPermission = async () => {
    setIsTesting(true);
    try {
      await subscribe();
      setTestResult(true);
      onTestComplete?.(true);
    } catch (error) {
      setTestResult(false);
      onTestComplete?.(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await sendTestNotification();
      setTestResult(true);
      onTestComplete?.(true);
    } catch (error) {
      setTestResult(false);
      onTestComplete?.(false);
    } finally {
    setIsTesting(false);
    }
  };

  const isPermissionGranted = permission === "granted" && isSubscribed;

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPermissionGranted ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">Notificações</span>
        </div>
        {testResult !== null && (
          testResult ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {isPermissionGranted 
          ? "Você será notificado quando o médico entrar na sala."
          : "Ative as notificações para ser avisado quando o médico entrar."}
      </p>

      <div className="flex gap-2">
        {!isPermissionGranted ? (
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={handleRequestPermission}
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Ativar
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={handleTestNotification}
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Testar
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotificationTest;
