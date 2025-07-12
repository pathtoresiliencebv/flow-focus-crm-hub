import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
      setLoading(false);
    };

    checkSupport();
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }, [isSupported]);

  // Get existing push subscription
  const getExistingSubscription = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
        return existingSubscription;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting existing subscription:', error);
      return null;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!isSupported || !user) {
      toast({
        title: "Niet ondersteund",
        description: "Push notificaties worden niet ondersteund",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Toestemming geweigerd",
          description: "Push notificaties zijn uitgeschakeld",
          variant: "destructive"
        });
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Service worker registration failed');
      }

      // Create push subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BNJzMGp-Q9FzOgfPKKPBvVP7LcG-C3f7Y2C1YwLX-Vl5N1_OKJ_z4C2S1F3O7G8D9E0F1A2B'
      });

      // Store subscription in database
      const subscriptionData: PushSubscriptionData = {
        endpoint: newSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(newSubscription.getKey('p256dh')!)))),
          auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(newSubscription.getKey('auth')!))))
        }
      };

      const { error } = await supabase.functions.invoke('notification-processor', {
        body: {
          type: 'register_push_subscription',
          subscription: subscriptionData,
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      setSubscription(newSubscription);
      setIsSubscribed(true);

      toast({
        title: "Push notificaties ingeschakeld",
        description: "Je ontvangt nu push notificaties",
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Fout",
        description: "Kon push notificaties niet inschakelen",
        variant: "destructive"
      });
      return false;
    }
  }, [isSupported, user, registerServiceWorker, toast]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription || !user) return false;

    try {
      await subscription.unsubscribe();
      
      // Remove subscription from database
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      setSubscription(null);
      setIsSubscribed(false);

      toast({
        title: "Push notificaties uitgeschakeld",
        description: "Je ontvangt geen push notificaties meer",
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: "Fout",
        description: "Kon push notificaties niet uitschakelen",
        variant: "destructive"
      });
      return false;
    }
  }, [subscription, user, toast]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!user || !isSubscribed) return false;

    try {
      const { error } = await supabase.functions.invoke('notification-processor', {
        body: {
          type: 'push_notification',
          payload: {
            type: 'general',
            title: 'Test Notificatie',
            body: 'Dit is een test notificatie vanuit de FlowFocus CRM app',
            data: {
              url: window.location.pathname,
              type: 'test'
            }
          },
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test notificatie verzonden",
        description: "Controleer je notificaties",
      });

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Fout",
        description: "Kon test notificatie niet verzenden",
        variant: "destructive"
      });
      return false;
    }
  }, [user, isSubscribed, toast]);

  // Check existing subscription on mount
  useEffect(() => {
    if (user && isSupported) {
      getExistingSubscription();
    }
  }, [user, isSupported, getExistingSubscription]);

  return {
    isSupported,
    isSubscribed,
    subscription,
    loading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  };
};