import { useState, useEffect, useCallback, useRef } from 'react';
import { useNativeCapabilities } from './useNativeCapabilities';
import { useToast } from './use-toast';

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';
export type SyncPriority = 'high' | 'medium' | 'low';

interface QueuedAction {
  id: string;
  type: 'message' | 'file_upload' | 'api_call';
  priority: SyncPriority;
  payload: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface NetworkMetrics {
  downloadSpeed: number; // Mbps
  uploadSpeed: number;   // Mbps
  latency: number;       // ms
  jitter: number;        // ms
  quality: NetworkQuality;
}

export const useNetworkAware = () => {
  const { networkStatus, isOnline, connectionType } = useNativeCapabilities();
  const { toast } = useToast();
  
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('good');
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>({
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: 0,
    jitter: 0,
    quality: 'good'
  });
  const [offlineQueue, setOfflineQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [adaptiveSettings, setAdaptiveSettings] = useState({
    imageQuality: 90,
    videoQuality: 'high',
    autoDownload: true,
    backgroundSync: true
  });

  const speedTestRef = useRef<{
    startTime: number;
    endTime: number;
    bytesTransferred: number;
  } | null>(null);

  // Network quality assessment
  const assessNetworkQuality = useCallback(async (): Promise<NetworkQuality> => {
    if (!isOnline) return 'offline';

    try {
      // Perform speed test with small image
      const testStart = performance.now();
      const response = await fetch('/icon-192.png', { 
        cache: 'no-cache',
        method: 'GET'
      });
      const testEnd = performance.now();
      
      if (!response.ok) return 'poor';
      
      const latency = testEnd - testStart;
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const downloadSpeed = contentLength / ((testEnd - testStart) / 1000) / 1024; // KB/s
      
      // Update metrics
      setNetworkMetrics(prev => ({
        ...prev,
        latency,
        downloadSpeed: downloadSpeed / 1024, // Convert to Mbps
        quality: latency < 100 && downloadSpeed > 500 ? 'excellent' :
                latency < 300 && downloadSpeed > 100 ? 'good' : 'poor'
      }));

      // Determine quality based on latency and speed
      if (latency < 100 && downloadSpeed > 500) return 'excellent';
      if (latency < 300 && downloadSpeed > 100) return 'good';
      return 'poor';
      
    } catch (error) {
      console.error('Network assessment failed:', error);
      return 'poor';
    }
  }, [isOnline]);

  // Adaptive settings based on network quality
  const updateAdaptiveSettings = useCallback((quality: NetworkQuality) => {
    setAdaptiveSettings(prev => {
      switch (quality) {
        case 'excellent':
          return {
            ...prev,
            imageQuality: 95,
            videoQuality: 'high',
            autoDownload: true,
            backgroundSync: true
          };
        case 'good':
          return {
            ...prev,
            imageQuality: 85,
            videoQuality: 'medium',
            autoDownload: true,
            backgroundSync: true
          };
        case 'poor':
          return {
            ...prev,
            imageQuality: 60,
            videoQuality: 'low',
            autoDownload: false,
            backgroundSync: false
          };
        case 'offline':
          return {
            ...prev,
            autoDownload: false,
            backgroundSync: false
          };
        default:
          return prev;
      }
    });
  }, []);

  // Queue management
  const addToQueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    };

    setOfflineQueue(prev => {
      const updated = [...prev, queuedAction];
      // Sort by priority and timestamp
      return updated.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
    });

    return queuedAction.id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setOfflineQueue(prev => prev.filter(action => action.id !== id));
  }, []);

  // Smart sync with priority handling
  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncing || offlineQueue.length === 0) return;

    setIsSyncing(true);
    const batchSize = networkQuality === 'excellent' ? 5 : networkQuality === 'good' ? 3 : 1;
    const batch = offlineQueue.slice(0, batchSize);

    for (const action of batch) {
      try {
        // Process based on action type
        switch (action.type) {
          case 'message':
            await processMessageAction(action);
            break;
          case 'file_upload':
            await processFileUploadAction(action);
            break;
          case 'api_call':
            await processApiCallAction(action);
            break;
        }
        
        removeFromQueue(action.id);
        
      } catch (error) {
        console.error(`Failed to process action ${action.id}:`, error);
        
        // Retry logic
        if (action.retries < action.maxRetries) {
          setOfflineQueue(prev => 
            prev.map(a => 
              a.id === action.id 
                ? { ...a, retries: a.retries + 1 }
                : a
            )
          );
        } else {
          removeFromQueue(action.id);
          toast({
            title: "Sync Failed",
            description: `Failed to sync ${action.type} after ${action.maxRetries} retries`,
            variant: "destructive"
          });
        }
      }
    }

    setIsSyncing(false);
  }, [isOnline, isSyncing, offlineQueue, networkQuality, removeFromQueue, toast]);

  // Action processors
  const processMessageAction = async (action: QueuedAction) => {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.payload)
    });
    
    if (!response.ok) throw new Error('Message sync failed');
  };

  const processFileUploadAction = async (action: QueuedAction) => {
    const formData = new FormData();
    Object.keys(action.payload).forEach(key => {
      formData.append(key, action.payload[key]);
    });
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('File upload failed');
  };

  const processApiCallAction = async (action: QueuedAction) => {
    const { url, method, body, headers } = action.payload;
    const response = await fetch(url, { method, body, headers });
    
    if (!response.ok) throw new Error('API call failed');
  };

  // Smart file download with adaptive quality
  const downloadFile = useCallback(async (url: string, filename: string) => {
    if (networkQuality === 'offline') {
      toast({
        title: "Offline",
        description: "File will be downloaded when connection is restored",
        variant: "default"
      });
      
      addToQueue({
        type: 'api_call',
        priority: 'medium',
        payload: { url, method: 'GET' },
        maxRetries: 3
      });
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "File will be retried when connection improves",
        variant: "destructive"
      });
    }
  }, [networkQuality, addToQueue, toast]);

  // Initialize network monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startMonitoring = async () => {
      // Initial assessment
      const quality = await assessNetworkQuality();
      setNetworkQuality(quality);
      updateAdaptiveSettings(quality);

      // Periodic assessment
      interval = setInterval(async () => {
        const newQuality = await assessNetworkQuality();
        if (newQuality !== networkQuality) {
          setNetworkQuality(newQuality);
          updateAdaptiveSettings(newQuality);
          
          // Show network change notification
          toast({
            title: `Network: ${newQuality}`,
            description: `Connection quality changed to ${newQuality}`,
            variant: newQuality === 'poor' ? "destructive" : "default"
          });
        }
      }, 30000); // Check every 30 seconds
    };

    if (isOnline) {
      startMonitoring();
    } else {
      setNetworkQuality('offline');
      updateAdaptiveSettings('offline');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline, networkQuality, assessNetworkQuality, updateAdaptiveSettings, toast]);

  // Auto-process queue when online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      const timer = setTimeout(processQueue, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineQueue.length, processQueue]);

  return {
    // Network state
    networkStatus,
    networkQuality,
    networkMetrics,
    isOnline,
    connectionType,
    
    // Adaptive settings
    adaptiveSettings,
    
    // Queue management
    offlineQueue,
    isSyncing,
    addToQueue,
    removeFromQueue,
    processQueue,
    
    // Utilities
    downloadFile,
    assessNetworkQuality
  };
};