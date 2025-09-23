import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// Capacitor imports (fallback for web)
let Capacitor: any = null;
let Camera: any = null;
let Geolocation: any = null;
let Device: any = null;
let Preferences: any = null;
let Haptics: any = null;

// Expo imports (for native)
let ExpoCamera: any = null;
let ExpoLocation: any = null;
let ExpoDevice: any = null;
let AsyncStorage: any = null;

try {
  if (Platform.OS === 'web') {
    // Use Capacitor on web
    Capacitor = require('@capacitor/core').Capacitor;
    Camera = require('@capacitor/camera').Camera;
    Geolocation = require('@capacitor/geolocation').Geolocation;
    Device = require('@capacitor/device').Device;
    Preferences = require('@capacitor/preferences').Preferences;
    Haptics = require('@capacitor/haptics').Haptics;
  } else {
    // Use Expo on native
    ExpoCamera = require('expo-camera');
    ExpoLocation = require('expo-location');
    ExpoDevice = require('expo-device');
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch (error) {
  console.warn('Platform capabilities not available:', error);
}

export interface PlatformCapabilities {
  isNative: boolean;
  platform: 'web' | 'ios' | 'android';
  takePicture: (options?: any) => Promise<any>;
  getCurrentLocation: (options?: any) => Promise<any>;
  getDeviceInfo: () => Promise<any>;
  setStorage: (key: string, value: string) => Promise<void>;
  getStorage: (key: string) => Promise<string | null>;
  hapticFeedback: () => Promise<void>;
}

export const useNativePlatform = (): PlatformCapabilities => {
  const [isNative] = useState(Platform.OS !== 'web');
  const [platform] = useState<'web' | 'ios' | 'android'>(
    Platform.OS === 'web' ? 'web' : Platform.OS as 'ios' | 'android'
  );

  const takePicture = async (options?: any) => {
    try {
      if (Platform.OS === 'web' && Camera) {
        return await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'dataUrl',
          source: 'camera',
          ...options,
        });
      } else if (ExpoCamera) {
        const { status } = await ExpoCamera.Camera.requestCameraPermissionsAsync();
        if (status === 'granted') {
          // Implementation would require camera component
          console.log('Expo camera functionality requires camera component');
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to take picture:', error);
      return null;
    }
  };

  const getCurrentLocation = async (options?: any) => {
    try {
      if (Platform.OS === 'web' && Geolocation) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          ...options,
        });
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
      } else if (ExpoLocation) {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.High,
            ...options,
          });
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    }
  };

  const getDeviceInfo = async () => {
    try {
      if (Platform.OS === 'web' && Device) {
        return await Device.getInfo();
      } else if (ExpoDevice) {
        return {
          model: ExpoDevice.modelName,
          platform: Platform.OS,
          osVersion: ExpoDevice.osVersion,
          manufacturer: ExpoDevice.manufacturer,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  };

  const setStorage = async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web' && Preferences) {
        await Preferences.set({ key, value });
      } else if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Failed to set storage:', error);
    }
  };

  const getStorage = async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web' && Preferences) {
        const result = await Preferences.get({ key });
        return result.value;
      } else if (AsyncStorage) {
        return await AsyncStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error('Failed to get storage:', error);
      return null;
    }
  };

  const hapticFeedback = async () => {
    try {
      if (Platform.OS === 'web' && Haptics) {
        await Haptics.impact({ style: 'medium' });
      } else if (Platform.OS !== 'web') {
        // Expo haptics would be implemented here
        console.log('Haptic feedback triggered');
      }
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  };

  return {
    isNative,
    platform,
    takePicture,
    getCurrentLocation,
    getDeviceInfo,
    setStorage,
    getStorage,
    hapticFeedback,
  };
};