import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useChatStore } from './useChatStore';
import { useNetworkAware } from './useNetworkAware';
import { useToast } from '@/hooks/use-toast';

interface OptimizationConfig {
  enableMessageBatching?: boolean;
  batchSize?: number;
  enableMemoryCleanup?: boolean;
  maxCachedMessages?: number;
  enableNetworkOptimization?: boolean;
  retryAttempts?: number;
}

interface PerformanceStats {
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
  memoryUsage: number;
  networkRetries: number;
  lastOptimization: Date | null;
}

export const useChatOptimizations = (config: OptimizationConfig = {}) => {
  const {
    enableMessageBatching = true,
    batchSize = 10,
    enableMemoryCleanup = true,
    maxCachedMessages = 500,
    enableNetworkOptimization = true,
    retryAttempts = 3
  } = config;

  const store = useChatStore();
  const { isOnline, networkQuality } = useNetworkAware();
  const { toast } = useToast();

  const performanceStats = useRef<PerformanceStats>({
    messagesSent: 0,
    messagesReceived: 0,
    averageLatency: 0,
    memoryUsage: 0,
    networkRetries: 0,
    lastOptimization: null
  });

  const latencyHistory = useRef<number[]>([]);
  const messageQueue = useRef<Array<{ id: string; timestamp: number; data: any }>>([]);
  const retryQueue = useRef<Array<{ attempt: number; data: any; callback: () => Promise<void> }>>([]);

  // Message batching optimization
  const batchedOperations = useMemo(() => {
    if (!enableMessageBatching) return null;

    let batchTimeout: NodeJS.Timeout | null = null;
    const pendingOperations: Array<() => void> = [];

    const processBatch = () => {
      if (pendingOperations.length === 0) return;
      
      // Execute all batched operations
      const operations = [...pendingOperations];
      pendingOperations.length = 0;
      
      operations.forEach(op => op());
      batchTimeout = null;
    };

    const addToBatch = (operation: () => void) => {
      pendingOperations.push(operation);
      
      if (pendingOperations.length >= batchSize) {
        // Process immediately if batch is full
        if (batchTimeout) clearTimeout(batchTimeout);
        processBatch();
      } else if (!batchTimeout) {
        // Schedule batch processing
        batchTimeout = setTimeout(processBatch, 100);
      }
    };

    return { addToBatch, processBatch };
  }, [enableMessageBatching, batchSize]);

  // Memory cleanup optimization
  const cleanupMemory = useCallback(() => {
    if (!enableMemoryCleanup) return;

    const currentMessages = store.unifiedMessages;
    const totalMessages = Object.values(currentMessages).reduce(
      (total, messages) => total + messages.length, 
      0
    );

    if (totalMessages > maxCachedMessages) {
      // Keep only recent messages per conversation
      const cleanedMessages: typeof currentMessages = {};
      
      Object.entries(currentMessages).forEach(([conversationId, messages]) => {
        // Keep latest messages only
        const sortedMessages = messages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        cleanedMessages[conversationId] = sortedMessages.slice(0, Math.floor(maxCachedMessages / Object.keys(currentMessages).length));
      });

      // Update store with cleaned messages
      Object.entries(cleanedMessages).forEach(([conversationId, messages]) => {
        if (conversationId.startsWith('direct_')) {
          store.setDirectMessages(conversationId, messages as any);
        } else {
          store.setChannelMessages(conversationId, messages as any);
        }
      });

      store.generateUnifiedMessages();

      performanceStats.current.lastOptimization = new Date();
      
      toast({
        title: "Memory Optimized",
        description: `Cleaned up ${totalMessages - Object.values(cleanedMessages).reduce((t, m) => t + m.length, 0)} old messages`,
      });
    }
  }, [enableMemoryCleanup, maxCachedMessages, store, toast]);

  // Network-aware retry mechanism
  const retryFailedOperation = useCallback(async (
    operation: () => Promise<void>,
    attempt: number = 1
  ): Promise<void> => {
    if (!enableNetworkOptimization) {
      return operation();
    }

    try {
      const startTime = performance.now();
      await operation();
      const endTime = performance.now();
      
      // Track latency
      const latency = endTime - startTime;
      latencyHistory.current.push(latency);
      if (latencyHistory.current.length > 10) {
        latencyHistory.current.shift();
      }
      
      // Update average latency
      performanceStats.current.averageLatency = 
        latencyHistory.current.reduce((sum, l) => sum + l, 0) / latencyHistory.current.length;
      
    } catch (error) {
      performanceStats.current.networkRetries++;
      
      if (attempt < retryAttempts && isOnline) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryFailedOperation(operation, attempt + 1);
      } else {
        // Add to retry queue for when network improves
        retryQueue.current.push({
          attempt,
          data: operation,
          callback: operation
        });
        throw error;
      }
    }
  }, [enableNetworkOptimization, retryAttempts, isOnline]);

  // Process retry queue when network comes back online
  useEffect(() => {
    if (isOnline && retryQueue.current.length > 0) {
      const queue = [...retryQueue.current];
      retryQueue.current = [];
      
      queue.forEach(async ({ callback }) => {
        try {
          await callback();
        } catch (error) {
          console.warn('Retry operation failed:', error);
        }
      });
      
      if (queue.length > 0) {
        toast({
          title: "Network Restored",
          description: `Processed ${queue.length} queued operations`,
        });
      }
    }
  }, [isOnline, toast]);

  // Adaptive performance based on network quality
  const getOptimizedConfig = useMemo(() => {
    const baseConfig = {
      messageLoadLimit: 50,
      realtimeUpdates: true,
      imageCompression: false,
      audioQuality: 'high' as const
    };

    if (!enableNetworkOptimization) return baseConfig;

    if (networkQuality === 'poor') {
      return {
        ...baseConfig,
        messageLoadLimit: 20,
        realtimeUpdates: false,
        imageCompression: true,
        audioQuality: 'low' as const
      };
    }
    if (networkQuality === 'excellent') {
      return {
        ...baseConfig,
        messageLoadLimit: 100,
        realtimeUpdates: true,
        imageCompression: false,
        audioQuality: 'high' as const
      };
    }
    return baseConfig;
  }, [networkQuality, enableNetworkOptimization]);

  // Periodic cleanup
  useEffect(() => {
    if (!enableMemoryCleanup) return;

    const cleanupInterval = setInterval(cleanupMemory, 300000); // 5 minutes
    return () => clearInterval(cleanupInterval);
  }, [cleanupMemory, enableMemoryCleanup]);

  // Performance monitoring
  const getPerformanceReport = useCallback(() => {
    const currentTime = Date.now();
    const memoryUsage = Object.values(store.unifiedMessages).reduce(
      (total, messages) => total + messages.length,
      0
    );

    performanceStats.current.memoryUsage = memoryUsage;

    return {
      stats: { ...performanceStats.current },
      recommendations: [
        memoryUsage > maxCachedMessages ? 'Consider running memory cleanup' : null,
        performanceStats.current.averageLatency > 1000 ? 'High latency detected - check network' : null,
        performanceStats.current.networkRetries > 10 ? 'Frequent network issues - enable retry queue' : null,
        !isOnline ? 'Offline mode - some features may be limited' : null
      ].filter(Boolean),
      networkInfo: {
        isOnline,
        quality: networkQuality,
        optimizedConfig: getOptimizedConfig
      }
    };
  }, [store.unifiedMessages, maxCachedMessages, isOnline, networkQuality, getOptimizedConfig]);

  // Optimized message operations
  const optimizedOperations = useMemo(() => ({
    addMessage: (conversationId: string, message: any, type: 'channel' | 'direct') => {
      const operation = () => {
        if (type === 'channel') {
          store.addChannelMessage(conversationId, message);
        } else {
          store.addDirectMessage(conversationId, message);
        }
        performanceStats.current.messagesReceived++;
      };

      if (batchedOperations) {
        batchedOperations.addToBatch(operation);
      } else {
        operation();
      }
    },

    updateUnreadCount: (conversationId: string, count: number) => {
      const operation = () => store.setUnreadCount(conversationId, count);
      
      if (batchedOperations) {
        batchedOperations.addToBatch(operation);
      } else {
        operation();
      }
    },

    cleanupOldMessages: cleanupMemory,

    performNetworkOperation: retryFailedOperation
  }), [batchedOperations, store, cleanupMemory, retryFailedOperation]);

  return {
    optimizedOperations,
    getPerformanceReport,
    performanceStats: performanceStats.current,
    networkConfig: getOptimizedConfig,
    isOptimized: true,
    cleanupMemory
  };
};
