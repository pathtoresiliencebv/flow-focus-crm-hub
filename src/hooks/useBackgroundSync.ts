import { useState, useEffect, useCallback, useRef } from 'react';
import { App, AppState } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
// import { useOfflineChat } from './useOfflineChat'; // Removed - not needed for simple chat
import { useNetworkAware } from './useNetworkAware';

interface BackgroundSyncConfig {
  syncInterval: number;
  lowBatterySyncInterval: number;
  maxRetries: number;
  syncOnAppResume: boolean;
  prioritySync: boolean;
}

interface SyncStatus {
  isBackgroundSyncing: boolean;
  lastSyncTime: Date | null;
  syncErrors: string[];
  pendingOperations: number;
  batteryOptimized: boolean;
}

const DEFAULT_CONFIG: BackgroundSyncConfig = {
  syncInterval: 30000, // 30 seconds
  lowBatterySyncInterval: 120000, // 2 minutes
  maxRetries: 3,
  syncOnAppResume: true,
  prioritySync: false
};

export const useBackgroundSync = (config: Partial<BackgroundSyncConfig> = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // const { syncPendingMessages, getPendingCount } = useOfflineChat(); // Removed - not needed for simple chat
  const { isOnline, networkQuality } = useNetworkAware();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isBackgroundSyncing: false,
    lastSyncTime: null,
    syncErrors: [],
    pendingOperations: 0,
    batteryOptimized: false
  });
  
  const [batteryLevel, setBatteryLevel] = useState<number>(1);
  const [appState, setAppState] = useState<AppState | null>(null);
  
  const syncConfig = { ...DEFAULT_CONFIG, ...config };
  const backgroundTaskId = useRef<string | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef<number>(0);

  // Monitor battery level
  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        const info = await Device.getBatteryInfo();
        setBatteryLevel(info.batteryLevel || 1);
      } catch (error) {
        console.warn('Could not get battery info:', error);
      }
    };

    getBatteryInfo();
    const interval = setInterval(getBatteryInfo, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Monitor app state
  useEffect(() => {
    let listener: any = null;
    
    const setupListener = async () => {
      listener = await App.addListener('appStateChange', (state) => {
        setAppState(state);
        
        if (state.isActive && syncConfig.syncOnAppResume) {
          // App became active, trigger sync
          performSync();
        }
      });
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [syncConfig.syncOnAppResume]);

  // Update sync status based on battery and network
  useEffect(() => {
    const isLowBattery = batteryLevel < 0.15; // Below 15%
    const isPoorNetwork = !isOnline || networkQuality === 'poor';
    
    setSyncStatus(prev => ({
      ...prev,
      batteryOptimized: isLowBattery || isPoorNetwork
    }));
  }, [batteryLevel, isOnline, networkQuality]);

  const startBackgroundTask = useCallback(async (): Promise<string | null> => {
    try {
      // Use a simple task ID for now - background task functionality will be enhanced later
      const taskId = `sync-task-${Date.now()}`;
      backgroundTaskId.current = taskId;
      return taskId;
    } catch (error) {
      console.error('Failed to start background task:', error);
      return null;
    }
  }, []);

  const stopBackgroundTask = useCallback(async () => {
    if (backgroundTaskId.current) {
      try {
        // Clean up task ID
        backgroundTaskId.current = null;
      } catch (error) {
        console.error('Failed to stop background task:', error);
      }
    }
  }, []);

  const performSync = useCallback(async () => {
    if (!user || !isOnline || syncStatus.isBackgroundSyncing) {
      return;
    }

    const taskId = await startBackgroundTask();
    if (!taskId) return;

    setSyncStatus(prev => ({ ...prev, isBackgroundSyncing: true }));

    try {
      // Get pending operations count (simplified for new chat)
      const pendingCount = 0; // No offline messages in simple chat
      setSyncStatus(prev => ({ ...prev, pendingOperations: pendingCount }));

      // Perform sync (simplified for new chat)
      // await syncPendingMessages(); // Removed - not needed for simple chat

      // Update sync status
      setSyncStatus(prev => ({
        ...prev,
        isBackgroundSyncing: false,
        lastSyncTime: new Date(),
        syncErrors: [],
        pendingOperations: 0
      }));

      retryCountRef.current = 0;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      setSyncStatus(prev => ({
        ...prev,
        isBackgroundSyncing: false,
        syncErrors: [...prev.syncErrors.slice(-4), errorMessage] // Keep last 5 errors
      }));

      retryCountRef.current += 1;

      // Retry logic with exponential backoff
      if (retryCountRef.current < syncConfig.maxRetries) {
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
        setTimeout(performSync, retryDelay);
      } else {
        toast({
          title: "Synchronisatie fout",
          description: `Kon niet synchroniseren na ${syncConfig.maxRetries} pogingen`,
          variant: "destructive",
        });
      }
    } finally {
      await stopBackgroundTask();
    }
  }, [user, isOnline, syncStatus.isBackgroundSyncing, startBackgroundTask, stopBackgroundTask, syncConfig.maxRetries, toast]);

  const startPeriodicSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    const getSyncInterval = () => {
      // Use longer interval if battery is low or network is poor
      if (syncStatus.batteryOptimized) {
        return syncConfig.lowBatterySyncInterval;
      }
      return syncConfig.syncInterval;
    };

    const interval = getSyncInterval();
    
    syncIntervalRef.current = setInterval(() => {
      if (!appState?.isActive) {
        // Only sync in background if we have pending operations
        if (syncStatus.pendingOperations > 0) {
          performSync();
        }
      } else {
        performSync();
      }
    }, interval) as ReturnType<typeof setInterval>;
  }, [syncStatus.batteryOptimized, syncStatus.pendingOperations, syncConfig, appState, performSync]);

  const stopPeriodicSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  const forcSync = useCallback(async () => {
    retryCountRef.current = 0; // Reset retry count for manual sync
    await performSync();
  }, [performSync]);

  // Start/stop periodic sync based on user authentication
  useEffect(() => {
    if (user && isOnline) {
      startPeriodicSync();
    } else {
      stopPeriodicSync();
    }

    return () => {
      stopPeriodicSync();
      stopBackgroundTask();
    };
  }, [user, isOnline, startPeriodicSync, stopPeriodicSync, stopBackgroundTask]);

  return {
    syncStatus,
    batteryLevel,
    appState,
    performSync: forcSync,
    startPeriodicSync,
    stopPeriodicSync,
    config: syncConfig
  };
};