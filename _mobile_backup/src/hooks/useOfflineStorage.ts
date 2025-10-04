import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useNetworkAware } from './useNetworkAware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OfflineStorageConfig {
  tableName: string;
  syncKey: string;
  maxItems?: number;
  ttl?: number; // Time to live in minutes
}

interface OfflineItem<T = any> {
  id: string;
  data: T;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  lastModified: number;
  action: 'create' | 'update' | 'delete';
  retryCount: number;
}

interface SyncResult {
  success: number;
  failed: number;
  conflicts: number;
}

export const useOfflineStorage = <T = any>(config: OfflineStorageConfig) => {
  const { isOnline } = useNetworkAware();
  const [offlineItems, setOfflineItems] = useState<OfflineItem<T>[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const storageKey = `offline_${config.tableName}_${config.syncKey}`;
  const metaKey = `offline_meta_${config.tableName}`;

  // Load offline items from storage
  const loadOfflineItems = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: storageKey });
      if (value) {
        const items = JSON.parse(value) as OfflineItem<T>[];
        
        // Filter out expired items if TTL is set
        const validItems = config.ttl 
          ? items.filter(item => Date.now() - item.timestamp < config.ttl! * 60 * 1000)
          : items;
          
        setOfflineItems(validItems);
        
        // Clean up expired items
        if (validItems.length !== items.length) {
          await saveOfflineItems(validItems);
        }
      }
    } catch (error) {
      console.error('Error loading offline items:', error);
    }
  }, [storageKey, config.ttl]);

  // Save offline items to storage
  const saveOfflineItems = useCallback(async (items: OfflineItem<T>[]) => {
    try {
      // Limit items if maxItems is set
      const itemsToSave = config.maxItems && items.length > config.maxItems
        ? items.slice(-config.maxItems)
        : items;
        
      await Preferences.set({
        key: storageKey,
        value: JSON.stringify(itemsToSave),
      });
      
      // Save metadata
      await Preferences.set({
        key: metaKey,
        value: JSON.stringify({
          lastUpdated: Date.now(),
          itemCount: itemsToSave.length,
        }),
      });
      
      setOfflineItems(itemsToSave);
    } catch (error) {
      console.error('Error saving offline items:', error);
    }
  }, [storageKey, metaKey, config.maxItems]);

  // Add item for offline sync
  const addOfflineItem = useCallback(async (
    data: T, 
    action: 'create' | 'update' | 'delete',
    id?: string
  ) => {
    const newItem: OfflineItem<T> = {
      id: id || crypto.randomUUID(),
      data,
      timestamp: Date.now(),
      syncStatus: 'pending',
      lastModified: Date.now(),
      action,
      retryCount: 0,
    };

    const updatedItems = [...offlineItems, newItem];
    await saveOfflineItems(updatedItems);
    
    // Try immediate sync if online
    if (isOnline) {
      setTimeout(() => syncOfflineItems(), 100);
    }
    
    return newItem.id;
  }, [offlineItems, saveOfflineItems, isOnline]);

  // Update offline item
  const updateOfflineItem = useCallback(async (id: string, updates: Partial<OfflineItem<T>>) => {
    const updatedItems = offlineItems.map(item =>
      item.id === id
        ? { ...item, ...updates, lastModified: Date.now() }
        : item
    );
    await saveOfflineItems(updatedItems);
  }, [offlineItems, saveOfflineItems]);

  // Remove offline item
  const removeOfflineItem = useCallback(async (id: string) => {
    const updatedItems = offlineItems.filter(item => item.id !== id);
    await saveOfflineItems(updatedItems);
  }, [offlineItems, saveOfflineItems]);

  // Sync offline items with server
  const syncOfflineItems = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline || isSyncing) {
      return { success: 0, failed: 0, conflicts: 0 };
    }

    setIsSyncing(true);
    const result: SyncResult = { success: 0, failed: 0, conflicts: 0 };

    try {
      const pendingItems = offlineItems.filter(item => 
        item.syncStatus === 'pending' || item.syncStatus === 'error'
      );

      for (const item of pendingItems) {
        try {
          let syncSuccess = false;
          
          switch (item.action) {
            case 'create':
              const { error: createError } = await supabase
                .from(config.tableName as any)
                .insert(item.data);
              syncSuccess = !createError;
              if (createError) throw createError;
              break;
              
            case 'update':
              const { error: updateError } = await supabase
                .from(config.tableName as any)
                .update(item.data)
                .eq('id', item.id);
              syncSuccess = !updateError;
              if (updateError) throw updateError;
              break;
              
            case 'delete':
              const { error: deleteError } = await supabase
                .from(config.tableName as any)
                .delete()
                .eq('id', item.id);
              syncSuccess = !deleteError;
              if (deleteError) throw deleteError;
              break;
          }
          
          if (syncSuccess) {
            await updateOfflineItem(item.id, { syncStatus: 'synced' });
            result.success++;
          }
          
        } catch (error: any) {
          console.error(`Sync error for item ${item.id}:`, error);
          
          // Check for conflicts (409 status or specific error codes)
          const isConflict = error.code === '23505' || // Unique constraint violation
                           error.message?.includes('conflict') ||
                           error.message?.includes('duplicate');
          
          if (isConflict) {
            await updateOfflineItem(item.id, { 
              syncStatus: 'conflict',
              retryCount: item.retryCount + 1 
            });
            result.conflicts++;
          } else {
            // Increment retry count and mark as error if max retries reached
            const newRetryCount = item.retryCount + 1;
            const maxRetries = 3;
            
            await updateOfflineItem(item.id, { 
              syncStatus: newRetryCount >= maxRetries ? 'error' : 'pending',
              retryCount: newRetryCount 
            });
            result.failed++;
          }
        }
      }
      
      // Clean up successfully synced items after a delay
      setTimeout(async () => {
        const remainingItems = offlineItems.filter(item => item.syncStatus !== 'synced');
        if (remainingItems.length !== offlineItems.length) {
          await saveOfflineItems(remainingItems);
        }
      }, 5000);
      
      setLastSyncTime(new Date());
      
    } catch (error) {
      console.error('Sync process error:', error);
    } finally {
      setIsSyncing(false);
    }

    return result;
  }, [isOnline, isSyncing, offlineItems, config.tableName, updateOfflineItem, saveOfflineItems]);

  // Get conflict resolution suggestions
  const getConflictResolution = useCallback(async (itemId: string) => {
    const item = offlineItems.find(i => i.id === itemId);
    if (!item || item.syncStatus !== 'conflict') return null;

    try {
      // Fetch current server data
      const { data: serverData, error } = await supabase
        .from(config.tableName as any)
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !serverData) return null;

      return {
        local: item.data,
        server: serverData,
        suggestions: {
          useLocal: 'Use your local changes',
          useServer: 'Use server version',
          merge: 'Merge both versions (manual)',
        }
      };
    } catch (error) {
      console.error('Error fetching conflict data:', error);
      return null;
    }
  }, [offlineItems, config.tableName]);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    itemId: string, 
    resolution: 'local' | 'server' | 'merged',
    mergedData?: T
  ) => {
    const item = offlineItems.find(i => i.id === itemId);
    if (!item) return false;

    try {
      switch (resolution) {
        case 'local':
          // Force update with local data
          const { error: localError } = await supabase
            .from(config.tableName as any)
            .update(item.data)
            .eq('id', itemId);
          
          if (!localError) {
            await updateOfflineItem(itemId, { syncStatus: 'synced' });
            return true;
          }
          break;
          
        case 'server':
          // Mark as synced (accept server version)
          await updateOfflineItem(itemId, { syncStatus: 'synced' });
          return true;
          
        case 'merged':
          if (!mergedData) return false;
          
          const { error: mergeError } = await supabase
            .from(config.tableName as any)
            .update(mergedData)
            .eq('id', itemId);
          
          if (!mergeError) {
            await updateOfflineItem(itemId, { 
              syncStatus: 'synced',
              data: mergedData 
            });
            return true;
          }
          break;
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
    
    return false;
  }, [offlineItems, config.tableName, updateOfflineItem]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    await Preferences.remove({ key: storageKey });
    await Preferences.remove({ key: metaKey });
    setOfflineItems([]);
  }, [storageKey, metaKey]);

  // Get storage stats
  const getStorageStats = useCallback(async () => {
    const pendingCount = offlineItems.filter(item => item.syncStatus === 'pending').length;
    const errorCount = offlineItems.filter(item => item.syncStatus === 'error').length;
    const conflictCount = offlineItems.filter(item => item.syncStatus === 'conflict').length;
    
    return {
      total: offlineItems.length,
      pending: pendingCount,
      errors: errorCount,
      conflicts: conflictCount,
      synced: offlineItems.length - pendingCount - errorCount - conflictCount,
      lastSync: lastSyncTime,
    };
  }, [offlineItems, lastSyncTime]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && offlineItems.some(item => item.syncStatus === 'pending')) {
      const timer = setTimeout(() => {
        syncOfflineItems();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineItems, syncOfflineItems]);

  // Load items on mount
  useEffect(() => {
    loadOfflineItems();
  }, [loadOfflineItems]);

  return {
    offlineItems,
    isSyncing,
    lastSyncTime,
    addOfflineItem,
    updateOfflineItem,
    removeOfflineItem,
    syncOfflineItems,
    getConflictResolution,
    resolveConflict,
    clearOfflineData,
    getStorageStats,
  };
};