/**
 * Push Notifications Utility
 * Handles Firebase Cloud Messaging (FCM) integration via Capacitor
 */

import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PushNotificationPayload {
  type: 'project_assigned' | 'chat_message' | 'receipt_status' | 'planning_change' | 'werkbon_ready';
  title: string;
  body: string;
  data?: {
    projectId?: string;
    chatId?: string;
    receiptId?: string;
    planningId?: string;
    completionId?: string;
    [key: string]: any;
  };
}

/**
 * Initialize push notifications
 * Must be called after user login on mobile devices
 */
export async function initializePushNotifications(userId: string): Promise<boolean> {
  // Only initialize on mobile platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('📱 Push notifications only available on mobile platforms');
    return false;
  }

  try {
    console.log('🔔 Initializing push notifications...');

    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive !== 'granted') {
      console.warn('⚠️ Push notification permission denied');
      toast({
        title: "Meldingen uitgeschakeld",
        description: "Schakel meldingen in via instellingen voor updates",
        variant: "default"
      });
      return false;
    }

    console.log('✅ Push notification permission granted');

    // Register with FCM
    await PushNotifications.register();
    
    console.log('✅ Push notifications initialized successfully');
    return true;

  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
    return false;
  }
}

/**
 * Register device token with backend
 */
export async function registerDeviceToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
  try {
    console.log('📝 Registering device token:', { userId, platform, token: token.substring(0, 20) + '...' });

    const { error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: userId,
        token: token,
        platform: platform,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      });

    if (error) {
      console.error('Error saving device token:', error);
      throw error;
    }

    console.log('✅ Device token registered successfully');

  } catch (error) {
    console.error('❌ Failed to register device token:', error);
    throw error;
  }
}

/**
 * Setup push notification listeners
 * Call this once on app initialization
 */
export function setupPushNotificationListeners(
  onNotificationReceived?: (notification: PushNotificationSchema) => void,
  onNotificationAction?: (action: ActionPerformed) => void
) {
  if (!Capacitor.isNativePlatform()) {
    return () => {}; // Return cleanup function
  }

  console.log('👂 Setting up push notification listeners...');

  // Listener: Registration success
  const registrationListener = PushNotifications.addListener('registration', async (token: Token) => {
    console.log('✅ FCM Registration success:', token.value.substring(0, 20) + '...');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const platform = Capacitor.getPlatform() as 'ios' | 'android';
        await registerDeviceToken(user.id, token.value, platform);
      }
    } catch (error) {
      console.error('Error in registration listener:', error);
    }
  });

  // Listener: Registration error
  const registrationErrorListener = PushNotifications.addListener('registrationError', (error: any) => {
    console.error('❌ FCM Registration error:', error);
  });

  // Listener: Notification received (foreground)
  const notificationListener = PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      console.log('📬 Push notification received (foreground):', notification);
      
      // Show toast for foreground notifications
      toast({
        title: notification.title || 'Nieuwe melding',
        description: notification.body || '',
      });

      // Call custom handler
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener: Notification action (user tapped notification)
  const actionListener = PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: ActionPerformed) => {
      console.log('👆 Push notification action:', action);

      // Call custom handler for navigation
      if (onNotificationAction) {
        onNotificationAction(action);
      }
    }
  );

  // Return cleanup function
  return () => {
    registrationListener.remove();
    registrationErrorListener.remove();
    notificationListener.remove();
    actionListener.remove();
    console.log('🧹 Push notification listeners cleaned up');
  };
}

/**
 * Handle notification tap - navigate to appropriate screen
 */
export function handleNotificationTap(action: ActionPerformed, navigate: (path: string) => void) {
  const notification = action.notification;
  const data = notification.data;

  console.log('🎯 Handling notification tap:', data);

  // Navigate based on notification type
  switch (data.type) {
    case 'project_assigned':
      if (data.projectId) {
        navigate(`/mobile/project/${data.projectId}`);
      }
      break;

    case 'chat_message':
      if (data.chatId) {
        navigate(`/chat/${data.chatId}`);
      }
      break;

    case 'receipt_status':
      if (data.receiptId) {
        navigate('/mobile/receipts');
      }
      break;

    case 'planning_change':
      if (data.planningId) {
        navigate('/mobile/planning');
      }
      break;

    case 'werkbon_ready':
      if (data.completionId) {
        navigate(`/mobile/project/${data.projectId}`);
      }
      break;

    default:
      navigate('/mobile/dashboard');
  }
}

/**
 * Get delivered notifications (iOS only)
 */
export async function getDeliveredNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }

  try {
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  } catch (error) {
    console.error('Error getting delivered notifications:', error);
    return [];
  }
}

/**
 * Remove delivered notifications
 */
export async function removeDeliveredNotifications(identifiers: string[]) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await PushNotifications.removeDeliveredNotifications({ notifications: identifiers.map(id => ({ id })) });
    console.log('✅ Removed delivered notifications:', identifiers);
  } catch (error) {
    console.error('Error removing notifications:', error);
  }
}

/**
 * Remove all delivered notifications
 */
export async function removeAllDeliveredNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await PushNotifications.removeAllDeliveredNotifications();
    console.log('✅ Removed all delivered notifications');
  } catch (error) {
    console.error('Error removing all notifications:', error);
  }
}

/**
 * Example usage:
 * 
 * // In App.tsx or mobile entry point:
 * useEffect(() => {
 *   if (user && Capacitor.isNativePlatform()) {
 *     initializePushNotifications(user.id);
 *     
 *     const cleanup = setupPushNotificationListeners(
 *       (notification) => {
 *         console.log('Received:', notification);
 *       },
 *       (action) => {
 *         handleNotificationTap(action, navigate);
 *       }
 *     );
 * 
 *     return cleanup;
 *   }
 * }, [user]);
 */

