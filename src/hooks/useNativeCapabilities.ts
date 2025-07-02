import { useState, useEffect, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { useToast } from './use-toast';

export const useNativeCapabilities = () => {
  const { toast } = useToast();
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus | null>(null);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    setIsNativeApp(Capacitor.isNativePlatform());

    // Monitor network status
    const initNetwork = async () => {
      try {
        const status = await Network.getStatus();
        setNetworkStatus(status);

        Network.addListener('networkStatusChange', (status) => {
          setNetworkStatus(status);
        });
      } catch (error) {
        console.log('Network monitoring not available:', error);
      }
    };

    initNetwork();
  }, []);

  const takePicture = useCallback(async (options?: {
    source?: CameraSource;
    allowEditing?: boolean;
  }) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: options?.allowEditing ?? true,
        resultType: CameraResultType.Uri,
        source: options?.source ?? CameraSource.Prompt,
      });

      return {
        webPath: image.webPath,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`,
        format: image.format
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      toast({
        title: "Camera fout",
        description: "Kon geen foto maken",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  const getCurrentLocation = useCallback(async (enableHighAccuracy = true) => {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout: 10000
      });

      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        timestamp: coordinates.timestamp
      };
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Locatie fout",
        description: "Kon locatie niet ophalen",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  const hapticFeedback = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    try {
      if (isNativeApp) {
        await Haptics.impact({ style });
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  }, [isNativeApp]);

  const setPreference = useCallback(async (key: string, value: string) => {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error('Error setting preference:', error);
    }
  }, []);

  const getPreference = useCallback(async (key: string): Promise<string | null> => {
    try {
      const result = await Preferences.get({ key });
      return result.value;
    } catch (error) {
      console.error('Error getting preference:', error);
      return null;
    }
  }, []);

  const removePreference = useCallback(async (key: string) => {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error('Error removing preference:', error);
    }
  }, []);

  return {
    isNativeApp,
    networkStatus,
    isOnline: networkStatus?.connected ?? true,
    connectionType: networkStatus?.connectionType,
    takePicture,
    getCurrentLocation,
    hapticFeedback,
    setPreference,
    getPreference,
    removePreference
  };
};