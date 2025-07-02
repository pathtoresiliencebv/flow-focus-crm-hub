import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

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
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // You would need to generate VAPID keys for production
        applicationServerKey: null
      });

      toast({
        title: "Notificaties ingeschakeld",
        description: "Je ontvangt nu push notificaties",
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