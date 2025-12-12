import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PushNotificationState {
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = (idCliente?: string) => {
  const [state, setState] = useState<PushNotificationState>({
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    isSubscribed: false,
    isLoading: false,
    error: null
  });

  // Check if push is supported
  const isPushSupported = useCallback(() => {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      console.log('[Push] Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[Push] Service Worker registered:', registration.scope);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker ready');
      
      return registration;
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Get VAPID public key from edge function
  const getVapidPublicKey = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
      
      if (error) {
        console.error('[Push] Error fetching VAPID key:', error);
        return null;
      }
      
      return data?.publicKey || null;
    } catch (error) {
      console.error('[Push] Error fetching VAPID key:', error);
      return null;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.log('[Push] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      toast.error('Notificações bloqueadas. Por favor, habilite nas configurações do navegador.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast.success('Notificações habilitadas!');
      } else if (permission === 'denied') {
        toast.error('Notificações foram bloqueadas.');
      }
      
      return permission;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!idCliente) {
      console.error('[Push] No idCliente provided');
      return false;
    }

    if (!isPushSupported()) {
      toast.error('Push notifications não são suportadas neste navegador.');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Request permission
      const permission = await requestPermission();
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // 2. Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Failed to register service worker');
      }

      // 3. Get VAPID public key
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        throw new Error('Failed to get VAPID public key');
      }

      // 4. Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      console.log('[Push] Push subscription created:', subscription);

      // 5. Send subscription to server
      const { error } = await supabase.functions.invoke('register-push', {
        body: {
          idCliente,
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to register subscription');
      }

      setState(prev => ({ ...prev, isSubscribed: true, isLoading: false }));
      console.log('[Push] Subscription registered successfully');
      return true;

    } catch (error) {
      console.error('[Push] Subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error('Erro ao ativar notificações. Tente novamente.');
      return false;
    }
  }, [idCliente, isPushSupported, requestPermission, registerServiceWorker, getVapidPublicKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('[Push] Unsubscribed successfully');
      }
      
      setState(prev => ({ ...prev, isSubscribed: false }));
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      return false;
    }
  }, []);

  // Send push notification to another user
  const sendNotification = useCallback(async (
    recipientIdCliente: string,
    title: string,
    body: string,
    options?: {
      nrAtendimento?: string;
      tag?: string;
      data?: Record<string, unknown>;
    }
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          idCliente: recipientIdCliente,
          senderIdCliente: idCliente,
          title,
          body,
          nrAtendimento: options?.nrAtendimento,
          tag: options?.tag,
          data: options?.data
        }
      });

      if (error) {
        console.error('[Push] Error sending notification:', error);
        return false;
      }

      console.log('[Push] Notification sent:', data);
      return data?.success || false;
    } catch (error) {
      console.error('[Push] Error sending notification:', error);
      return false;
    }
  }, [idCliente]);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isPushSupported()) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState(prev => ({ ...prev, isSubscribed: !!subscription }));
      } catch (error) {
        console.log('[Push] Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [isPushSupported]);

  return {
    ...state,
    isPushSupported: isPushSupported(),
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification
  };
};
