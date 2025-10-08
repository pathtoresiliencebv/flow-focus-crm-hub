import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { 
  initializePushNotifications, 
  setupPushNotificationListeners, 
  handleNotificationTap 
} from '@/utils/pushNotifications';

/**
 * Custom hook for managing push notifications
 * 
 * Automatically initializes push notifications when user is logged in
 * Sets up listeners and handles navigation
 * 
 * Usage:
 * ```tsx
 * function App() {
 *   usePushNotifications();
 *   
 *   return <YourApp />
 * }
 * ```
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Only initialize if user is logged in
    if (!user) {
      return;
    }

    console.log('🚀 Initializing push notifications for user:', user.id);

    // Initialize push notifications
    initializePushNotifications(user.id);

    // Setup listeners
    const cleanup = setupPushNotificationListeners(
      // On notification received (foreground)
      (notification) => {
        console.log('📬 Foreground notification:', notification);
        // Toast is shown automatically in setupPushNotificationListeners
      },
      // On notification tapped (background/closed)
      (action) => {
        console.log('👆 Notification tapped:', action);
        handleNotificationTap(action, navigate);
      }
    );

    // Cleanup listeners on unmount
    return cleanup;

  }, [user, navigate]);
}

/**
 * Hook for sending push notifications
 * 
 * Usage:
 * ```tsx
 * const { sendPush, sending, error } = useSendPushNotification();
 * 
 * await sendPush({
 *   userId: 'abc-123',
 *   type: 'project_assigned',
 *   title: 'Nieuw Project',
 *   body: 'Kozijn installatie Kerkstraat 123',
 *   data: { projectId: 'project-123' }
 * });
 * ```
 */
export function useSendPushNotification() {
  const { supabase } = useAuth();

  const sendPush = async (params: {
    userId?: string
    userIds?: string[]
    type: 'project_assigned' | 'chat_message' | 'receipt_status' | 'planning_change' | 'werkbon_ready'
    title: string
    body: string
    data?: any
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: params
      });

      if (error) throw error;

      console.log('✅ Push notification sent:', data);
      return data;

    } catch (error: any) {
      console.error('❌ Failed to send push notification:', error);
      throw error;
    }
  };

  return { sendPush };
}

