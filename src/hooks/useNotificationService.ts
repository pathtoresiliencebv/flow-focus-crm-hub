import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  type: 'chat_message' | 'project_update' | 'general';
  title: string;
  body: string;
  data?: any;
  sender_name?: string;
  channel_id?: string;
  message_id?: string;
  project_id?: string;
}

export const useNotificationService = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle navigation messages from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, url, notificationData, messageId, channelId } = event.data;

      switch (type) {
        case 'NAVIGATE_TO_URL':
          if (url && url !== window.location.pathname) {
            window.history.pushState({}, '', url);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
          break;
          
        case 'MARK_MESSAGE_READ':
          if (messageId && channelId) {
            markMessageAsRead(messageId, channelId);
          }
          break;
          
        case 'GET_AUTH_TOKEN':
          // Respond with auth token for service worker
          if (event.ports && event.ports[0]) {
            const token = localStorage.getItem('supabase.auth.token');
            event.ports[0].postMessage({ token });
          }
          break;
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string, channelId: string) => {
    if (!user?.id) return;

    try {
      // Get current message to update read_by field
      const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('read_by')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        console.error('Error fetching message:', fetchError);
        return;
      }

      // Update read_by field to include current user
      const currentReadBy = (message?.read_by as Record<string, boolean>) || {};
      const updatedReadBy = {
        ...currentReadBy,
        [user.id]: true
      };

      const { error } = await supabase
        .from('chat_messages')
        .update({
          read_by: updatedReadBy
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [user?.id]);

  const sendPushNotification = useCallback(async (payload: NotificationPayload) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.functions.invoke('notification-processor', {
        body: {
          type: 'push_notification',
          payload,
          user_id: user.id
        }
      });

      if (error) {
        console.error('Error sending push notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }, [user?.id]);

  const triggerChatNotification = useCallback(async (
    channelId: string,
    message: string,
    senderName: string,
    messageId: string
  ) => {
    return sendPushNotification({
      type: 'chat_message',
      title: `Nieuw bericht van ${senderName}`,
      body: message,
      sender_name: senderName,
      channel_id: channelId,
      message_id: messageId,
      data: {
        url: `/chat?channel=${channelId}`,
        type: 'chat_message',
        channel_id: channelId,
        message_id: messageId
      }
    });
  }, [sendPushNotification]);

  const triggerProjectNotification = useCallback(async (
    projectId: string,
    title: string,
    message: string
  ) => {
    return sendPushNotification({
      type: 'project_update',
      title,
      body: message,
      project_id: projectId,
      data: {
        url: `/projects/${projectId}`,
        type: 'project_update',
        project_id: projectId
      }
    });
  }, [sendPushNotification]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notificaties niet ondersteund",
        description: "Je browser ondersteunt geen notificaties",
        variant: "destructive"
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: "Notificaties geblokkeerd",
        description: "Notificaties zijn uitgeschakeld in je browser instellingen",
        variant: "destructive"
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast({
        title: "Notificaties ingeschakeld",
        description: "Je ontvangt nu meldingen voor nieuwe berichten",
      });
      return true;
    } else {
      toast({
        title: "Notificaties geweigerd",
        description: "Je ontvangt geen meldingen voor nieuwe berichten",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    triggerChatNotification,
    triggerProjectNotification,
    requestNotificationPermission,
    markMessageAsRead
  };
};