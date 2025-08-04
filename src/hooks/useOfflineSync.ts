import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Storage } from '@capacitor/storage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  userId: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: number;
  lastSyncTime?: number;
  syncError?: string;
}

const OFFLINE_QUEUE_KEY = 'offline_sync_queue';
const LAST_SYNC_KEY = 'last_sync_time';
const MAX_RETRY_ATTEMPTS = 3;
const SYNC_RETRY_DELAY = 5000; // 5 seconds

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingActions: 0,
  });
  
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    initializeOfflineSync();
    setupNetworkListener();
    loadOfflineQueue();
  }, []);

  useEffect(() => {
    if (syncStatus.isOnline && offlineQueue.length > 0 && !syncStatus.isSyncing) {
      processSyncQueue();
    }
  }, [syncStatus.isOnline, offlineQueue.length]);

  const initializeOfflineSync = async () => {
    if (Capacitor.isNativePlatform()) {
      const status = await Network.getStatus();
      setSyncStatus(prev => ({ ...prev, isOnline: status.connected }));
    }
  };

  const setupNetworkListener = () => {
    if (Capacitor.isNativePlatform()) {
      Network.addListener('networkStatusChange', (status) => {
        const wasOffline = !syncStatus.isOnline;
        const isNowOnline = status.connected;
        
        setSyncStatus(prev => ({ ...prev, isOnline: isNowOnline }));

        if (wasOffline && isNowOnline) {
          toast({
            title: "Verbinding hersteld",
            description: "Data synchronisatie wordt gestart...",
          });
          processSyncQueue();
        } else if (!isNowOnline) {
          toast({
            title: "Offline modus",
            description: "Wijzigingen worden lokaal opgeslagen.",
          });
        }
      });
    }
  };

  const loadOfflineQueue = async () => {
    try {
      const { value } = await Storage.get({ key: OFFLINE_QUEUE_KEY });
      if (value) {
        const queue = JSON.parse(value) as OfflineAction[];
        setOfflineQueue(queue);
        setSyncStatus(prev => ({ ...prev, pendingActions: queue.length }));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  };

  const saveOfflineQueue = async (queue: OfflineAction[]) => {
    try {
      await Storage.set({
        key: OFFLINE_QUEUE_KEY,
        value: JSON.stringify(queue)
      });
      setSyncStatus(prev => ({ ...prev, pendingActions: queue.length }));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  };

  const addToOfflineQueue = async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'userId' | 'retryCount' | 'status'>) => {
    if (!user) return;

    const offlineAction: OfflineAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId: user.id,
      retryCount: 0,
      status: 'pending',
      ...action,
    };

    const newQueue = [...offlineQueue, offlineAction];
    setOfflineQueue(newQueue);
    await saveOfflineQueue(newQueue);

    if (syncStatus.isOnline) {
      // Try to sync immediately if online
      processSyncQueue();
    }
  };

  const processSyncQueue = async () => {
    if (syncStatus.isSyncing || offlineQueue.length === 0) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: undefined }));

    const pendingActions = offlineQueue.filter(action => 
      action.status === 'pending' && action.retryCount < action.maxRetries
    );

    for (const action of pendingActions) {
      try {
        await syncAction(action);
        
        // Mark as synced
        const updatedQueue = offlineQueue.map(item =>
          item.id === action.id ? { ...item, status: 'synced' as const } : item
        );
        setOfflineQueue(updatedQueue);
        
      } catch (error) {
        console.error(`Error syncing action ${action.id}:`, error);
        
        // Increment retry count
        const updatedQueue = offlineQueue.map(item =>
          item.id === action.id 
            ? { 
                ...item, 
                retryCount: item.retryCount + 1,
                status: item.retryCount + 1 >= item.maxRetries ? 'failed' as const : 'pending' as const
              } 
            : item
        );
        setOfflineQueue(updatedQueue);
      }
    }

    // Remove synced actions from queue
    const remainingQueue = offlineQueue.filter(action => action.status !== 'synced');
    setOfflineQueue(remainingQueue);
    await saveOfflineQueue(remainingQueue);

    // Update last sync time
    const lastSyncTime = Date.now();
    await Storage.set({ key: LAST_SYNC_KEY, value: lastSyncTime.toString() });

    setSyncStatus(prev => ({ 
      ...prev, 
      isSyncing: false, 
      pendingActions: remainingQueue.length,
      lastSyncTime 
    }));

    const failedActions = remainingQueue.filter(action => action.status === 'failed');
    if (failedActions.length > 0) {
      toast({
        title: "Synchronisatie problemen",
        description: `${failedActions.length} actie(s) konden niet worden gesynchroniseerd.`,
        variant: "destructive",
      });
    } else if (pendingActions.length > 0) {
      toast({
        title: "Synchronisatie voltooid",
        description: `${pendingActions.length} actie(s) succesvol gesynchroniseerd.`,
      });
    }
  };

  const syncAction = async (action: OfflineAction): Promise<void> => {
    const { table, type, data } = action;

    switch (type) {
      case 'create':
        const { error: createError } = await supabase
          .from(table)
          .insert(data);
        if (createError) throw createError;
        break;

      case 'update':
        const { id, ...updateData } = data;
        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  };

  // Wrapper functions for common database operations
  const createOffline = async (table: string, data: any, maxRetries: number = MAX_RETRY_ATTEMPTS) => {
    if (syncStatus.isOnline) {
      // Try to create immediately if online
      try {
        const { error } = await supabase.from(table).insert(data);
        if (error) throw error;
        return;
      } catch (error) {
        // If failed, add to offline queue
        console.log('Online create failed, adding to offline queue:', error);
      }
    }

    await addToOfflineQueue({
      type: 'create',
      table,
      data,
      maxRetries,
    });
  };

  const updateOffline = async (table: string, id: string, data: any, maxRetries: number = MAX_RETRY_ATTEMPTS) => {
    if (syncStatus.isOnline) {
      try {
        const { error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id);
        if (error) throw error;
        return;
      } catch (error) {
        console.log('Online update failed, adding to offline queue:', error);
      }
    }

    await addToOfflineQueue({
      type: 'update',
      table,
      data: { id, ...data },
      maxRetries,
    });
  };

  const deleteOffline = async (table: string, id: string, maxRetries: number = MAX_RETRY_ATTEMPTS) => {
    if (syncStatus.isOnline) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (error) throw error;
        return;
      } catch (error) {
        console.log('Online delete failed, adding to offline queue:', error);
      }
    }

    await addToOfflineQueue({
      type: 'delete',
      table,
      data: { id },
      maxRetries,
    });
  };

  const retrySyncQueue = async () => {
    // Reset failed actions to pending
    const resetQueue = offlineQueue.map(action =>
      action.status === 'failed' 
        ? { ...action, status: 'pending' as const, retryCount: 0 }
        : action
    );
    
    setOfflineQueue(resetQueue);
    await saveOfflineQueue(resetQueue);
    
    if (syncStatus.isOnline) {
      processSyncQueue();
    }
  };

  const clearSyncQueue = async () => {
    setOfflineQueue([]);
    await saveOfflineQueue([]);
    setSyncStatus(prev => ({ ...prev, pendingActions: 0 }));
  };

  const getOfflineStorageInfo = async () => {
    try {
      const { value: queueValue } = await Storage.get({ key: OFFLINE_QUEUE_KEY });
      const { value: lastSyncValue } = await Storage.get({ key: LAST_SYNC_KEY });
      
      return {
        queueSize: queueValue ? JSON.parse(queueValue).length : 0,
        lastSyncTime: lastSyncValue ? parseInt(lastSyncValue) : null,
      };
    } catch (error) {
      console.error('Error getting offline storage info:', error);
      return { queueSize: 0, lastSyncTime: null };
    }
  };

  return {
    syncStatus,
    offlineQueue,
    createOffline,
    updateOffline,
    deleteOffline,
    processSyncQueue,
    retrySyncQueue,
    clearSyncQueue,
    getOfflineStorageInfo,
  };
};