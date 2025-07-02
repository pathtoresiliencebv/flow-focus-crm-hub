import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface OfflineMessage {
  temp_id: string;
  channel_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  file_url?: string;
  file_name?: string;
  created_at: string;
  synced: boolean;
}

interface OfflineChatDB {
  getMessages(channelId: string): Promise<OfflineMessage[]>;
  addMessage(message: OfflineMessage): Promise<void>;
  updateMessage(tempId: string, updates: Partial<OfflineMessage>): Promise<void>;
  deleteMessage(tempId: string): Promise<void>;
  getPendingMessages(): Promise<OfflineMessage[]>;
  markAsSynced(tempId: string): Promise<void>;
}

class OfflineChatDatabase implements OfflineChatDB {
  private dbName = 'offline-chat';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('messages')) {
          const store = db.createObjectStore('messages', { keyPath: 'temp_id' });
          store.createIndex('channel_id', 'channel_id', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  async getMessages(channelId: string): Promise<OfflineMessage[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('channel_id');
      const request = index.getAll(channelId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        resolve(messages);
      };
    });
  }

  async addMessage(message: OfflineMessage): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.add(message);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateMessage(tempId: string, updates: Partial<OfflineMessage>): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const getRequest = store.get(tempId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (message) {
          const updatedMessage = { ...message, ...updates };
          const putRequest = store.put(updatedMessage);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  async deleteMessage(tempId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.delete(tempId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPendingMessages(): Promise<OfflineMessage[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allMessages = request.result;
        const pendingMessages = allMessages.filter(msg => !msg.synced);
        resolve(pendingMessages);
      };
    });
  }

  async markAsSynced(tempId: string): Promise<void> {
    return this.updateMessage(tempId, { synced: true });
  }
}

export const useOfflineChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [db] = useState(() => new OfflineChatDatabase());
  const [pendingSync, setPendingSync] = useState(false);

  // Initialize database
  useEffect(() => {
    db.init().catch(console.error);
  }, [db]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && user) {
      syncPendingMessages();
    }
  }, [isOnline, user]);

  const addOfflineMessage = useCallback(async (
    channelId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineMessage: OfflineMessage = {
      temp_id: tempId,
      channel_id: channelId,
      content,
      message_type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      created_at: new Date().toISOString(),
      synced: false
    };

    try {
      await db.addMessage(offlineMessage);
      
      if (isOnline) {
        // Try to sync immediately if online
        await syncSingleMessage(offlineMessage);
      }
      
      return tempId;
    } catch (error) {
      console.error('Error adding offline message:', error);
      throw error;
    }
  }, [db, isOnline]);

  const syncSingleMessage = useCallback(async (message: OfflineMessage) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('message-sync', {
        body: { messages: [message] }
      });

      if (error) throw error;

      if (data.success && data.results[0]?.success) {
        await db.markAsSynced(message.temp_id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error syncing single message:', error);
      return false;
    }
  }, [user, db]);

  const syncPendingMessages = useCallback(async () => {
    if (!user || !isOnline || pendingSync) return;

    setPendingSync(true);
    
    try {
      const pendingMessages = await db.getPendingMessages();
      
      if (pendingMessages.length === 0) {
        setPendingSync(false);
        return;
      }

      console.log(`Syncing ${pendingMessages.length} pending messages`);

      const { data, error } = await supabase.functions.invoke('message-sync', {
        body: { messages: pendingMessages }
      });

      if (error) throw error;

      // Update local database based on sync results
      for (const result of data.results) {
        if (result.success) {
          await db.markAsSynced(result.temp_id);
        }
      }

      if (data.synced_count > 0) {
        toast({
          title: "Berichten gesynchroniseerd",
          description: `${data.synced_count} berichten succesvol gesynchroniseerd`,
        });
      }

      if (data.failed_count > 0) {
        toast({
          title: "Synchronisatie fout",
          description: `${data.failed_count} berichten konden niet worden gesynchroniseerd`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error syncing pending messages:', error);
      toast({
        title: "Synchronisatie fout",
        description: "Kon berichten niet synchroniseren",
        variant: "destructive",
      });
    } finally {
      setPendingSync(false);
    }
  }, [user, isOnline, pendingSync, db, toast]);

  const getOfflineMessages = useCallback(async (channelId: string) => {
    try {
      return await db.getMessages(channelId);
    } catch (error) {
      console.error('Error getting offline messages:', error);
      return [];
    }
  }, [db]);

  const getPendingCount = useCallback(async () => {
    try {
      const pending = await db.getPendingMessages();
      return pending.length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }, [db]);

  return {
    isOnline,
    pendingSync,
    addOfflineMessage,
    syncPendingMessages,
    getOfflineMessages,
    getPendingCount,
    db
  };
};