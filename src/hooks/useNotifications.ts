import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  chat_notifications: boolean;
  project_notifications: boolean;
  quote_notifications: boolean;
  browser_notifications: boolean;
  email_digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  quiet_hours_start: string;
  quiet_hours_end: string;
  weekend_notifications: boolean;
  notification_sound: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: 'email' | 'push' | 'system';
  subject_template?: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description?: string;
  rule_type: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  target_users: string[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load user notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedNotifications: UserNotification[] = (data || []).map(notification => ({
        ...notification,
        type: notification.type as 'info' | 'warning' | 'error' | 'success'
      }));

      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user]);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences if they don't exist
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            email_notifications: true,
            push_notifications: true,
            chat_notifications: true,
            project_notifications: true,
            quote_notifications: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data as NotificationPreferences);
      toast({
        title: "Voorkeuren opgeslagen",
        description: "Je notificatie voorkeuren zijn bijgewerkt",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Fout",
        description: "Kon voorkeuren niet opslaan",
        variant: "destructive",
      });
    }
  }, [user, preferences, toast]);

  // Create notification (for system use)
  const createNotification = useCallback(async (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    referenceType?: string,
    referenceId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          reference_type: referenceType,
          reference_id: referenceId,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const notificationSubscription = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as UserNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification if preferences allow
          if (preferences?.push_notifications) {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'error' ? 'destructive' : 'default',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as UserNotification;
          setNotifications(prev =>
            prev.map(notification =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [user, preferences, toast]);

  // Load initial data
  useEffect(() => {
    if (user) {
      Promise.all([loadNotifications(), loadPreferences()])
        .finally(() => setLoading(false));
    }
  }, [user, loadNotifications, loadPreferences]);

  return {
    notifications,
    preferences,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    createNotification,
    loadNotifications,
  };
};