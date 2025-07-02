import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface SendNotificationParams {
  userId: string;
  templateName: string;
  variables: Record<string, any>;
  recipientEmail?: string;
  recipientName?: string;
  scheduleFor?: string;
}

export const useNotificationService = () => {
  const { toast } = useToast();

  const sendNotification = useCallback(async (params: SendNotificationParams) => {
    try {
      console.log('Sending notification:', params);

      const { data, error } = await supabase.functions.invoke('notification-processor', {
        body: params
      });

      if (error) {
        throw error;
      }

      console.log('Notification sent successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast({
        title: "Notificatie fout",
        description: "Kon notificatie niet verzenden",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Helper methods for common notification types
  const notifyProjectStatusChange = useCallback(async (
    userId: string,
    projectTitle: string,
    newStatus: string,
    customerName: string,
    recipientEmail?: string
  ) => {
    return sendNotification({
      userId,
      templateName: 'project_status_change',
      variables: {
        project_title: projectTitle,
        new_status: newStatus,
        customer_name: customerName,
        reference_type: 'project'
      },
      recipientEmail
    });
  }, [sendNotification]);

  const notifyProjectAssignment = useCallback(async (
    userId: string,
    projectTitle: string,
    customerName: string,
    dueDate?: string,
    recipientEmail?: string
  ) => {
    return sendNotification({
      userId,
      templateName: 'new_project_assigned',
      variables: {
        project_title: projectTitle,
        customer_name: customerName,
        due_date: dueDate,
        reference_type: 'project'
      },
      recipientEmail
    });
  }, [sendNotification]);

  const notifyQuoteApproval = useCallback(async (
    userId: string,
    quoteNumber: string,
    projectTitle: string,
    customerName: string,
    totalAmount: number,
    recipientEmail?: string
  ) => {
    return sendNotification({
      userId,
      templateName: 'quote_approved',
      variables: {
        quote_number: quoteNumber,
        project_title: projectTitle,
        customer_name: customerName,
        total_amount: new Intl.NumberFormat('nl-NL', {
          style: 'currency',
          currency: 'EUR'
        }).format(totalAmount),
        reference_type: 'quote'
      },
      recipientEmail
    });
  }, [sendNotification]);

  const notifyNewChatMessage = useCallback(async (
    userIds: string[],
    senderName: string,
    projectTitle: string,
    messagePreview: string
  ) => {
    const notifications = userIds.map(userId => 
      sendNotification({
        userId,
        templateName: 'new_chat_message',
        variables: {
          sender_name: senderName,
          project_title: projectTitle,
          message_preview: messagePreview,
          reference_type: 'chat'
        }
      })
    );

    return Promise.all(notifications);
  }, [sendNotification]);

  const notifySystemMaintenance = useCallback(async (
    userIds: string[],
    maintenanceDate: string,
    duration: string
  ) => {
    const notifications = userIds.map(userId => 
      sendNotification({
        userId,
        templateName: 'system_maintenance',
        variables: {
          maintenance_date: maintenanceDate,
          duration: duration,
          reference_type: 'system'
        }
      })
    );

    return Promise.all(notifications);
  }, [sendNotification]);

  // Browser push notification (if permission granted)
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const showBrowserNotification = useCallback(async (
    title: string,
    message: string,
    icon?: string
  ) => {
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      body: message,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'app-notification',
      requireInteraction: true
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }, [requestNotificationPermission]);

  return {
    sendNotification,
    notifyProjectStatusChange,
    notifyProjectAssignment,
    notifyQuoteApproval,
    notifyNewChatMessage,
    notifySystemMaintenance,
    requestNotificationPermission,
    showBrowserNotification
  };
};