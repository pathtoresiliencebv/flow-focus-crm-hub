interface NotificationConfig {
  sound: string;
  vibrationPattern: number[];
  showPreview: boolean;
  groupByConversation: boolean;
  markAsReadOnOpen: boolean;
}

interface ChatNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  data: {
    conversationId: string;
    messageId: string;
    senderId: string;
    type: 'message' | 'mention' | 'file' | 'voice';
  };
}

class ChatNotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';
  private config: NotificationConfig;
  private activeNotifications: Map<string, Notification> = new Map();

  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    
    this.config = {
      sound: '/notification.mp3',
      vibrationPattern: [200, 100, 200],
      showPreview: true,
      groupByConversation: true,
      markAsReadOnOpen: true
    };
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async scheduleNotification(notification: ChatNotification): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    try {
      // Close existing notification for the same conversation if grouping is enabled
      if (this.config.groupByConversation) {
        const existingKey = `conv_${notification.data.conversationId}`;
        const existing = this.activeNotifications.get(existingKey);
        if (existing) {
          existing.close();
        }
      }

      const notificationOptions: NotificationOptions = {
        body: this.config.showPreview ? notification.body : 'New message',
        icon: notification.icon || '/icon-192.png',
        badge: notification.badge ? `/badge-${notification.badge}.png` : '/icon-192.png',
        tag: this.config.groupByConversation ? `conv_${notification.data.conversationId}` : notification.id,
        requireInteraction: notification.data.type === 'mention',
        data: notification.data
      };

      const browserNotification = new Notification(notification.title, notificationOptions);
      
      // Store reference
      const key = this.config.groupByConversation 
        ? `conv_${notification.data.conversationId}` 
        : notification.id;
      this.activeNotifications.set(key, browserNotification);

      // Handle notification click
      browserNotification.onclick = () => {
        this.handleNotificationClick(notification.data);
        browserNotification.close();
      };

      // Clean up when notification is closed
      browserNotification.onclose = () => {
        this.activeNotifications.delete(key);
      };

      // Auto-close after 10 seconds for non-critical notifications
      if (notification.data.type !== 'mention') {
        setTimeout(() => {
          if (this.activeNotifications.has(key)) {
            browserNotification.close();
          }
        }, 10000);
      }

      // Play sound and vibrate
      this.playNotificationSound();
      this.vibrate();

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async cancelNotification(id: string): Promise<void> {
    const notification = this.activeNotifications.get(id);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(id);
    }
  }

  async updateBadgeCount(count: number): Promise<void> {
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          await (navigator as any).setAppBadge(count);
        } else {
          await (navigator as any).clearAppBadge();
        }
      } catch (error) {
        console.error('Error updating app badge:', error);
      }
    }
  }

  async handleNotificationClick(data: any): Promise<void> {
    try {
      // Focus the window
      if (window.parent) {
        window.parent.focus();
      }
      window.focus();

      // Navigate to the conversation
      const event = new CustomEvent('notification-click', {
        detail: {
          conversationId: data.conversationId,
          messageId: data.messageId,
          senderId: data.senderId,
          type: data.type
        }
      });
      
      window.dispatchEvent(event);

      // Mark as read if configured
      if (this.config.markAsReadOnOpen) {
        const markReadEvent = new CustomEvent('mark-message-read', {
          detail: { messageId: data.messageId }
        });
        window.dispatchEvent(markReadEvent);
      }

    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio(this.config.sound);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.debug('Could not play notification sound:', error);
      });
    } catch (error) {
      console.debug('Notification sound not available:', error);
    }
  }

  private vibrate(): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(this.config.vibrationPattern);
      } catch (error) {
        console.debug('Vibration not available:', error);
      }
    }
  }

  // Configuration methods
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Clear all active notifications
  clearAllNotifications(): void {
    this.activeNotifications.forEach(notification => {
      notification.close();
    });
    this.activeNotifications.clear();
  }

  // Get notification status
  getStatus(): { supported: boolean; permission: NotificationPermission; active: number } {
    return {
      supported: this.isSupported,
      permission: this.permission,
      active: this.activeNotifications.size
    };
  }
}

// Create singleton instance
export const chatNotificationService = new ChatNotificationService();

// Initialize service worker for notification handling if available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'notification-action') {
      chatNotificationService.handleNotificationClick(event.data.data);
    }
  });
}

export default chatNotificationService;