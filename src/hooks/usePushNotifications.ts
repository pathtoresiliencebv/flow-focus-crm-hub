import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: 'chat' | 'project' | 'planning' | 'invoice' | 'general';
  actionUrl?: string;
  priority?: 'high' | 'normal' | 'low';
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    initializePushNotifications();
  }, [user]);

  const initializePushNotifications = async () => {
    // Check if push notifications are supported
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications are only supported on native platforms');
      return;
    }

    setIsSupported(true);

    try {
      // Check current permission status
      const permission = await PushNotifications.checkPermissions();
      setPermissionStatus(permission.receive);

      if (permission.receive === 'granted') {
        await registerForPushNotifications();
      }

      // Set up listeners
      setupNotificationListeners();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Called when registration is successful
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      setRegistrationToken(token.value);
      
      if (user) {
        await savePushToken(token.value);
      }
    });

    // Called when registration fails
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error: ', error);
      toast({
        title: "Meldingen inschakelen mislukt",
        description: "Er is een fout opgetreden bij het inschakelen van push meldingen.",
        variant: "destructive",
      });
    });

    // Called when a notification is received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received: ', notification);
      
      // Show local notification when app is in foreground
      showLocalNotification({
        title: notification.title || 'Nieuwe melding',
        body: notification.body || '',
        data: notification.data,
      });
    });

    // Called when a notification is tapped
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ', notification);
      
      // Handle notification tap
      handleNotificationTap(notification.notification);
    });
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const permission = await PushNotifications.requestPermissions();
      setPermissionStatus(permission.receive);
      
      if (permission.receive === 'granted') {
        await registerForPushNotifications();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  const registerForPushNotifications = async () => {
    if (isRegistering) return;
    
    setIsRegistering(true);
    
    try {
      await PushNotifications.register();
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const savePushToken = async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: Capacitor.getPlatform(),
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error saving push token to database:', error);
    }
  };

  const showLocalNotification = async (payload: NotificationPayload) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: payload.title,
            body: payload.body,
            id: Date.now(),
            extra: payload.data,
            iconColor: '#3b82f6',
            sound: 'default',
          }
        ]
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  };

  const handleNotificationTap = (notification: PushNotificationSchema) => {
    const data = notification.data;
    
    if (!data) return;

    // Handle different notification types
    switch (data.type) {
      case 'chat':
        // Navigate to chat channel
        if (data.channelId) {
          // Router navigation would go here
          console.log('Navigate to chat:', data.channelId);
        }
        break;
        
      case 'project':
        // Navigate to project details
        if (data.projectId) {
          console.log('Navigate to project:', data.projectId);
        }
        break;
        
      case 'planning':
        // Navigate to planning item
        if (data.planningId) {
          console.log('Navigate to planning:', data.planningId);
        }
        break;
        
      case 'invoice':
        // Navigate to invoice
        if (data.invoiceId) {
          console.log('Navigate to invoice:', data.invoiceId);
        }
        break;
        
      default:
        // Handle generic notifications
        if (data.actionUrl) {
          console.log('Navigate to URL:', data.actionUrl);
        }
        break;
    }
  };

  const sendTestNotification = async () => {
    if (!registrationToken || !user) return;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: [user.id],
          notification: {
            title: 'Test melding',
            body: 'Dit is een test melding van het CRM systeem.',
            type: 'general',
            data: {
              test: true,
              timestamp: new Date().toISOString()
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test melding verzonden",
        description: "Je zou een test melding moeten ontvangen.",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij verzenden test melding",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const disablePushNotifications = async () => {
    if (!user) return;

    try {
      // Mark token as inactive in database
      const { error } = await supabase
        .from('user_push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setRegistrationToken(null);
      
      toast({
        title: "Meldingen uitgeschakeld",
        description: "Push meldingen zijn uitgeschakeld voor dit apparaat.",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij uitschakelen meldingen",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    isSupported,
    permissionStatus,
    registrationToken,
    isRegistering,
    requestPermission,
    sendTestNotification,
    disablePushNotifications,
    showLocalNotification,
  };
};