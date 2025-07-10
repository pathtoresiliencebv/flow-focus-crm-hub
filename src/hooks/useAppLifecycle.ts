import { useState, useEffect } from 'react';
import { App, AppState } from '@capacitor/app';
import { Device } from '@capacitor/device';

interface AppLifecycleState {
  isActive: boolean;
  isVisible: boolean;
  batteryLevel: number;
  isLowBattery: boolean;
  isCharging: boolean;
  appState: AppState | null;
}

export const useAppLifecycle = () => {
  const [state, setState] = useState<AppLifecycleState>({
    isActive: true,
    isVisible: true,
    batteryLevel: 1,
    isLowBattery: false,
    isCharging: false,
    appState: null
  });

  useEffect(() => {
    let appStateListener: any = null;
    
    const setupAppStateListener = async () => {
      appStateListener = await App.addListener('appStateChange', (appState) => {
        setState(prev => ({
          ...prev,
          isActive: appState.isActive,
          appState
        }));
      });
    };

    setupAppStateListener();

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);

  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        const batteryInfo = await Device.getBatteryInfo();
        setState(prev => ({
          ...prev,
          batteryLevel: batteryInfo.batteryLevel || 1,
          isLowBattery: (batteryInfo.batteryLevel || 1) < 0.15,
          isCharging: batteryInfo.isCharging || false
        }));
      } catch (error) {
        console.warn('Could not get battery info:', error);
      }
    };

    getBatteryInfo();
    const interval = setInterval(getBatteryInfo, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const getAppInfo = async () => {
    try {
      return await App.getInfo();
    } catch (error) {
      console.error('Failed to get app info:', error);
      return null;
    }
  };

  const exitApp = async () => {
    try {
      await App.exitApp();
    } catch (error) {
      console.error('Failed to exit app:', error);
    }
  };

  return {
    ...state,
    getAppInfo,
    exitApp
  };
};