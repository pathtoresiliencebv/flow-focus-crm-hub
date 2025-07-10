import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast({
        title: "App geïnstalleerd",
        description: "Flow Focus CRM is succesvol geïnstalleerd!",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast({
          title: "App wordt geïnstalleerd",
          description: "De app wordt nu geïnstalleerd op je apparaat",
        });
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  }, [deferredPrompt, toast]);

  const registerPushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({
        title: "Push notificaties niet ondersteund",
        description: "Je browser ondersteunt geen push notificaties",
        variant: "destructive"
      });
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: "Notificaties geweigerd",
          description: "Push notificaties zijn uitgeschakeld",
          variant: "destructive"
        });
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription first
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription with VAPID key
        const vapidPublicKey = 'BMqYHI_qfJkZbqKZ4XEXGhSz4F8_Qg8rQVDQ_5xZ4wJjJJd8YQzP0lKjJQKG7eHwXx2l5ZdQx0rJQJkXkG9vV2Q'; // Replace with actual VAPID public key
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Register subscription with backend
      const { error } = await supabase.functions.invoke('notification-processor', {
        body: {
          type: 'register_push_subscription',
          subscription: subscription.toJSON()
        }
      });

      if (error) {
        console.error('Error registering push subscription:', error);
        throw error;
      }

      toast({
        title: "Notificaties ingeschakeld",
        description: "Je ontvangt nu push notificaties voor nieuwe berichten",
      });

      return subscription;
    } catch (error) {
      console.error('Error registering push notifications:', error);
      toast({
        title: "Notificatie fout",
        description: "Kon push notificaties niet inschakelen",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const updateAvailable = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    registerPushNotifications,
    updateAvailable
  };
};