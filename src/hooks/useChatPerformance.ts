import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNetworkAware } from './useNetworkAware';

interface PerformanceOptimizations {
  virtualizedMessages: boolean;
  lazyLoadMedia: boolean; 
  messageCompression: boolean;
  offlineSync: boolean;
  bandwidthAdaptation: boolean;
}

interface PerformanceMetrics {
  messageCount: number;
  averageRenderTime: number;
  memoryUsage: number;
  networkLatency: number;
}

interface UseChatPerformanceReturn {
  optimizations: PerformanceOptimizations;
  metrics: PerformanceMetrics;
  shouldVirtualize: boolean;
  getOptimizedImageQuality: () => number;
  compressMessage: (message: string) => string;
  decompressMessage: (compressed: string) => string;
  trackRenderTime: (messageId: string, startTime: number) => void;
}

export const useChatPerformance = (
  messageCount: number = 0,
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline' = 'good'
): UseChatPerformanceReturn => {
  const { networkQuality, adaptiveSettings } = useNetworkAware();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    messageCount: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    networkLatency: 0
  });
  
  const [renderTimes, setRenderTimes] = useState<number[]>([]);

  // Dynamic optimization settings based on performance and network
  const optimizations = useMemo((): PerformanceOptimizations => {
    const highMessageCount = messageCount > 1000;
    const lowBandwidth = networkQuality === 'poor' || networkQuality === 'offline';
    
    return {
      virtualizedMessages: highMessageCount || lowBandwidth,
      lazyLoadMedia: highMessageCount || lowBandwidth,
      messageCompression: lowBandwidth,
      offlineSync: networkQuality === 'offline',
      bandwidthAdaptation: true
    };
  }, [messageCount, networkQuality]);

  // Should use virtualization for large message lists
  const shouldVirtualize = useMemo(() => {
    return messageCount > 500 || optimizations.virtualizedMessages;
  }, [messageCount, optimizations.virtualizedMessages]);

  // Get optimized image quality based on network conditions
  const getOptimizedImageQuality = useCallback((): number => {
    switch (networkQuality) {
      case 'excellent':
        return 95;
      case 'good':
        return 80;
      case 'poor':
        return 60;
      case 'offline':
        return 40;
      default:
        return adaptiveSettings.imageQuality || 80;
    }
  }, [networkQuality, adaptiveSettings.imageQuality]);

  // Simple message compression for low bandwidth
  const compressMessage = useCallback((message: string): string => {
    if (!optimizations.messageCompression) return message;
    
    // Simple compression - remove extra whitespace and common words
    return message
      .replace(/\s+/g, ' ')
      .trim();
  }, [optimizations.messageCompression]);

  const decompressMessage = useCallback((compressed: string): string => {
    // In a real implementation, this would reverse the compression
    return compressed;
  }, []);

  // Track rendering performance
  const trackRenderTime = useCallback((messageId: string, startTime: number) => {
    const renderTime = Date.now() - startTime;
    
    setRenderTimes(prev => {
      const newTimes = [...prev.slice(-99), renderTime]; // Keep last 100 render times
      return newTimes;
    });
  }, []);

  // Update metrics when render times change
  useEffect(() => {
    if (renderTimes.length > 0) {
      const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      
      setMetrics(prev => ({
        ...prev,
        messageCount,
        averageRenderTime,
        memoryUsage: (performance as any)?.memory?.usedJSHeapSize || 0,
      }));
    }
  }, [renderTimes, messageCount]);

  // Monitor network latency
  useEffect(() => {
    const measureLatency = async () => {
      const start = Date.now();
      try {
        await fetch('/ping', { method: 'HEAD' });
        const latency = Date.now() - start;
        setMetrics(prev => ({ ...prev, networkLatency: latency }));
      } catch (error) {
        // Network unavailable
        setMetrics(prev => ({ ...prev, networkLatency: -1 }));
      }
    };

    const interval = setInterval(measureLatency, 30000); // Every 30 seconds
    measureLatency(); // Initial measurement

    return () => clearInterval(interval);
  }, []);

  return {
    optimizations,
    metrics,
    shouldVirtualize,
    getOptimizedImageQuality,
    compressMessage,
    decompressMessage,
    trackRenderTime
  };
};