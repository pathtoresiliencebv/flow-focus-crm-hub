import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useNetworkAware } from './useNetworkAware';
import { useDevicePreferences } from './useDevicePreferences';

interface OfflineNotification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'sync';
  timestamp: number;
  data?: any;
  isRead: boolean;
  requiresAction?: boolean;
  actionType?: 'sync' | 'resolve_conflict' | 'retry';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export const useOfflineNotifications = () => {
  const { isOnline } = useNetworkAware();
  const { preferences } = useDevicePreferences();
  const [notifications, setNotifications] = useState<OfflineNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const STORAGE_KEY = 'offline_notifications';
  const MAX_NOTIFICATIONS = 100;

  // Initialize local notifications permissions
  const initializeNotifications = useCallback(async () => {
    try {
      const permission = await LocalNotifications.checkPermissions();
      
      if (permission.display !== 'granted') {
        const granted = await LocalNotifications.requestPermissions();
        if (granted.display !== 'granted') {
          console.warn('Local notifications permission not granted');
          return false;
        }
      }
      
      // Register notification action types
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'SYNC_ACTION',
            actions: [
              {
                id: 'sync',
                title: 'Synchroniseren',
              },
              {
                id: 'dismiss',
                title: 'Sluiten',
                destructive: true,
              },
            ],
          },
          {
            id: 'CONFLICT_ACTION',
            actions: [
              {
                id: 'resolve',
                title: 'Oplossen',
              },
              {
                id: 'later',
                title: 'Later',
              },
            ],
          },
        ],
      });
      
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }, []);

  // Load notifications from storage
  const loadNotifications = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        const stored = JSON.parse(value) as OfflineNotification[];
        // Clean up old notifications (older than 7 days)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const validNotifications = stored.filter(n => n.timestamp > weekAgo);
        setNotifications(validNotifications);
        
        if (validNotifications.length !== stored.length) {
          await saveNotifications(validNotifications);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Save notifications to storage
  const saveNotifications = useCallback(async (notifs: OfflineNotification[]) => {
    try {
      // Keep only the most recent notifications
      const toSave = notifs.slice(-MAX_NOTIFICATIONS);
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(toSave),
      });
      setNotifications(toSave);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, []);

  // Add offline notification
  const addNotification = useCallback(async (notification: Omit<OfflineNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: OfflineNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      isRead: false,
    };

    const updatedNotifications = [...notifications, newNotification];
    await saveNotifications(updatedNotifications);

    // Show native notification if preferences allow and app is in background
    if (preferences.pushNotifications && isInitialized) {
      try {
        await scheduleLocalNotification(newNotification);
      } catch (error) {
        console.error('Error scheduling local notification:', error);
      }
    }

    return newNotification.id;
  }, [notifications, preferences.pushNotifications, isInitialized, saveNotifications]);

  // Schedule local notification
  const scheduleLocalNotification = useCallback(async (notification: OfflineNotification) => {
    if (!isInitialized || !preferences.pushNotifications) return;

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const { start, end } = preferences.quietHours;
      
      if (currentTime >= start || currentTime <= end) {
        return; // Skip notification during quiet hours
      }
    }

    const iconMap = {
      info: 'information-circle',
      success: 'checkmark-circle',
      warning: 'warning',
      error: 'alert-circle',
      sync: 'refresh-circle',
    };

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(notification.id.replace(/\D/g, '').slice(-8) || '1'),
            title: notification.title,
            body: notification.body,
            iconColor: notification.type === 'error' ? '#ef4444' : '#3b82f6',
            sound: preferences.soundEnabled ? 'default' : undefined,
            extra: {
              notificationId: notification.id,
              type: notification.type,
              data: notification.data,
            },
            actionTypeId: notification.requiresAction ? 
              (notification.actionType === 'sync' ? 'SYNC_ACTION' : 'CONFLICT_ACTION') : 
              undefined,
          },
        ],
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }, [isInitialized, preferences]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    await saveNotifications(updatedNotifications);
  }, [notifications, saveNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    await saveNotifications(updatedNotifications);
  }, [notifications, saveNotifications]);

  // Remove notification
  const removeNotification = useCallback(async (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    await saveNotifications(updatedNotifications);
    
    // Cancel local notification if it exists
    try {
      const numId = parseInt(id.replace(/\D/g, '').slice(-8) || '1');
      await LocalNotifications.cancel({ notifications: [{ id: numId }] });
    } catch (error) {
      console.error('Error canceling local notification:', error);
    }
  }, [notifications, saveNotifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    await saveNotifications([]);
    
    // Cancel all local notifications
    try {
      await LocalNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Error clearing local notifications:', error);
    }
  }, [saveNotifications]);

  // Get notification stats
  const getNotificationStats = useCallback((): NotificationStats => {
    const unread = notifications.filter(n => !n.isRead);
    
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPriority = notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: notifications.length,
      unread: unread.length,
      byType,
      byPriority,
    };
  }, [notifications]);

  // Convenience methods for different notification types
  const notifySync = useCallback((message: string, data?: any) => {
    return addNotification({
      title: 'Synchronisatie',
      body: message,
      type: 'sync',
      priority: 'normal',
      data,
    });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string, data?: any) => {
    return addNotification({
      title,
      body: message,
      type: 'error',
      priority: 'high',
      data,
    });
  }, [addNotification]);

  const notifyConflict = useCallback((message: string, data?: any) => {
    return addNotification({
      title: 'Data Conflict',
      body: message,
      type: 'warning',
      priority: 'high',
      requiresAction: true,
      actionType: 'resolve_conflict',
      data,
    });
  }, [addNotification]);

  const notifySuccess = useCallback((message: string, data?: any) => {
    return addNotification({
      title: 'Succes',
      body: message,
      type: 'success',
      priority: 'normal',
      data,
    });
  }, [addNotification]);

  const notifyOfflineAction = useCallback((action: string, data?: any) => {
    return addNotification({
      title: 'Offline Actie',
      body: `${action} opgeslagen voor synchronisatie`,
      type: 'info',
      priority: 'low',
      data,
    });
  }, [addNotification]);

  // Handle notification actions
  useEffect(() => {
    if (!isInitialized) return;

    const handleNotificationAction = async (notification: any) => {
      const { actionId, notification: notif } = notification;
      const { notificationId } = notif.extra || {};
      
      if (actionId && notificationId) {
        await markAsRead(notificationId);
        
        // You can emit custom events here for the app to handle
        window.dispatchEvent(new CustomEvent('offlineNotificationAction', {
          detail: { actionId, notificationId, data: notif.extra.data }
        }));
      }
    };

    LocalNotifications.addListener('localNotificationActionPerformed', handleNotificationAction);
    
    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, [isInitialized, markAsRead]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await initializeNotifications();
      await loadNotifications();
    };
    
    init();
  }, [initializeNotifications, loadNotifications]);

  return {
    notifications,
    isInitialized,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getNotificationStats,
    // Convenience methods
    notifySync,
    notifyError,
    notifyConflict,
    notifySuccess,
    notifyOfflineAction,
  };
};
