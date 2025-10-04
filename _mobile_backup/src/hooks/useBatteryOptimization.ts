import { useState, useEffect, useCallback } from 'react';
import { Device } from '@capacitor/device';
import { useNetworkAware } from './useNetworkAware';

interface BatteryOptimizationConfig {
  lowBatteryThreshold: number;
  criticalBatteryThreshold: number;
  enableAdaptiveSync: boolean;
  reducedFunctionality: boolean;
}

interface BatteryState {
  level: number;
  isCharging: boolean;
  isLowBattery: boolean;
  isCriticalBattery: boolean;
  optimizationMode: 'normal' | 'low' | 'critical';
}

const DEFAULT_CONFIG: BatteryOptimizationConfig = {
  lowBatteryThreshold: 0.20, // 20%
  criticalBatteryThreshold: 0.10, // 10%
  enableAdaptiveSync: true,
  reducedFunctionality: true
};

export const useBatteryOptimization = (config: Partial<BatteryOptimizationConfig> = {}) => {
  const { networkQuality, isOnline } = useNetworkAware();
  const optimizationConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [batteryState, setBatteryState] = useState<BatteryState>({
    level: 1,
    isCharging: false,
    isLowBattery: false,
    isCriticalBattery: false,
    optimizationMode: 'normal'
  });

  const updateBatteryInfo = useCallback(async () => {
    try {
      const batteryInfo = await Device.getBatteryInfo();
      const level = batteryInfo.batteryLevel || 1;
      const isCharging = batteryInfo.isCharging || false;
      
      const isLowBattery = level <= optimizationConfig.lowBatteryThreshold && !isCharging;
      const isCriticalBattery = level <= optimizationConfig.criticalBatteryThreshold && !isCharging;
      
      let optimizationMode: 'normal' | 'low' | 'critical' = 'normal';
      if (isCriticalBattery) {
        optimizationMode = 'critical';
      } else if (isLowBattery) {
        optimizationMode = 'low';
      }

      setBatteryState({
        level,
        isCharging,
        isLowBattery,
        isCriticalBattery,
        optimizationMode
      });
    } catch (error) {
      console.warn('Could not get battery info:', error);
    }
  }, [optimizationConfig.lowBatteryThreshold, optimizationConfig.criticalBatteryThreshold]);

  useEffect(() => {
    updateBatteryInfo();
    
    // Update battery info more frequently when not charging
    const interval = setInterval(updateBatteryInfo, batteryState.isCharging ? 60000 : 30000);
    
    return () => clearInterval(interval);
  }, [updateBatteryInfo, batteryState.isCharging]);

  const getSyncInterval = useCallback((baseSyncInterval: number): number => {
    if (!optimizationConfig.enableAdaptiveSync) {
      return baseSyncInterval;
    }

    // Adjust sync interval based on battery and network
    let multiplier = 1;

    switch (batteryState.optimizationMode) {
      case 'critical':
        multiplier = 10; // 10x longer interval
        break;
      case 'low':
        multiplier = 4; // 4x longer interval
        break;
      default:
        multiplier = 1;
    }

    // Further adjust based on network quality
    if (!isOnline) {
      multiplier *= 2;
    } else if (networkQuality === 'poor') {
      multiplier *= 1.5;
    }

    return Math.min(baseSyncInterval * multiplier, 300000); // Max 5 minutes
  }, [batteryState.optimizationMode, isOnline, networkQuality, optimizationConfig.enableAdaptiveSync]);

  const shouldReduceFunctionality = useCallback((): boolean => {
    if (!optimizationConfig.reducedFunctionality) {
      return false;
    }

    return batteryState.optimizationMode === 'critical' || 
           (batteryState.optimizationMode === 'low' && networkQuality === 'poor');
  }, [batteryState.optimizationMode, networkQuality, optimizationConfig.reducedFunctionality]);

  const getOptimizedSettings = useCallback(() => {
    const baseSettings = {
      syncEnabled: true,
      backgroundSync: true,
      pushNotifications: true,
      animationsEnabled: true,
      imageOptimization: false,
      preloadContent: true
    };

    switch (batteryState.optimizationMode) {
      case 'critical':
        return {
          ...baseSettings,
          backgroundSync: false,
          animationsEnabled: false,
          imageOptimization: true,
          preloadContent: false
        };
      case 'low':
        return {
          ...baseSettings,
          animationsEnabled: false,
          imageOptimization: true,
          preloadContent: false
        };
      default:
        return baseSettings;
    }
  }, [batteryState.optimizationMode]);

  return {
    batteryState,
    getSyncInterval,
    shouldReduceFunctionality,
    getOptimizedSettings,
    updateBatteryInfo,
    config: optimizationConfig
  };
};