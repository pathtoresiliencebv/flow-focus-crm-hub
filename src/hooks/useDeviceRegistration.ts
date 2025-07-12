import { useState, useEffect, useCallback } from 'react';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { useSecurityService } from './useSecurityService';
import { useToast } from '@/hooks/use-toast';

export interface DeviceInfo {
  id: string;
  name: string;
  model: string;
  platform: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  webViewVersion?: string;
}

export interface DeviceTrustProfile {
  deviceId: string;
  trustLevel: 'new' | 'trusted' | 'suspicious' | 'blocked';
  registeredAt: string;
  lastSeenAt: string;
  loginCount: number;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  riskFactors: string[];
  deviceFingerprint: string;
}

export const useDeviceRegistration = () => {
  const { toast } = useToast();
  const { secureStore, secureRetrieve, encryptData } = useSecurityService();
  
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
  const [deviceTrust, setDeviceTrust] = useState<DeviceTrustProfile | null>(null);
  const [registeredDevices, setRegisteredDevices] = useState<DeviceTrustProfile[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate device fingerprint
  const generateDeviceFingerprint = useCallback((deviceInfo: DeviceInfo): string => {
    const fingerprintData = {
      model: deviceInfo.model,
      platform: deviceInfo.platform,
      manufacturer: deviceInfo.manufacturer,
      osVersion: deviceInfo.osVersion,
      isVirtual: deviceInfo.isVirtual,
      screenInfo: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      userAgent: navigator.userAgent.substring(0, 100) // Truncated for privacy
    };

    // Create a simple hash of the fingerprint data
    const fingerprintString = JSON.stringify(fingerprintData);
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36) + Date.now().toString(36);
  }, []);

  // Get current device information
  const getCurrentDeviceInfo = useCallback(async (): Promise<DeviceInfo> => {
    const deviceInfo = await Device.getInfo();
    const deviceId = await Device.getId();

    return {
      id: deviceId.identifier,
      name: deviceInfo.name || 'Unknown Device',
      model: deviceInfo.model || 'Unknown Model',
      platform: deviceInfo.platform || 'web',
      osVersion: deviceInfo.osVersion || 'Unknown',
      manufacturer: deviceInfo.manufacturer || 'Unknown',
      isVirtual: deviceInfo.isVirtual || false,
      webViewVersion: deviceInfo.webViewVersion
    };
  }, []);

  // Initialize device registration
  const initializeDeviceRegistration = useCallback(async () => {
    try {
      // Get current device info
      const deviceInfo = await getCurrentDeviceInfo();
      setCurrentDevice(deviceInfo);

      // Load existing device trust profiles
      const storedDevices = await secureRetrieve<DeviceTrustProfile[]>('registered_devices') || [];
      setRegisteredDevices(storedDevices);

      // Check if current device is already registered
      const existingDevice = storedDevices.find(d => d.deviceId === deviceInfo.id);
      
      if (existingDevice) {
        // Update last seen
        existingDevice.lastSeenAt = new Date().toISOString();
        existingDevice.loginCount += 1;
        setDeviceTrust(existingDevice);
        
        // Update stored devices
        const updatedDevices = storedDevices.map(d => 
          d.deviceId === deviceInfo.id ? existingDevice : d
        );
        await secureStore('registered_devices', updatedDevices);
        setRegisteredDevices(updatedDevices);
      } else {
        // Register new device
        await registerNewDevice(deviceInfo);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize device registration:', error);
      toast({
        title: "Device Registration Error",
        description: "Failed to initialize device security",
        variant: "destructive"
      });
      setIsInitialized(true);
    }
  }, [getCurrentDeviceInfo, secureRetrieve, secureStore, toast]);

  // Register a new device
  const registerNewDevice = useCallback(async (deviceInfo: DeviceInfo) => {
    try {
      const deviceFingerprint = generateDeviceFingerprint(deviceInfo);
      
      // Analyze risk factors
      const riskFactors: string[] = [];
      if (deviceInfo.isVirtual) riskFactors.push('virtual_device');
      if (deviceInfo.platform === 'web') riskFactors.push('web_platform');
      if (!deviceInfo.manufacturer || deviceInfo.manufacturer === 'Unknown') {
        riskFactors.push('unknown_manufacturer');
      }

      const trustProfile: DeviceTrustProfile = {
        deviceId: deviceInfo.id,
        trustLevel: riskFactors.length > 2 ? 'suspicious' : 'new',
        registeredAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        loginCount: 1,
        riskFactors,
        deviceFingerprint
      };

      setDeviceTrust(trustProfile);

      // Store device registration
      const updatedDevices = [...registeredDevices, trustProfile];
      await secureStore('registered_devices', updatedDevices);
      setRegisteredDevices(updatedDevices);

      // Notify about new device registration
      if (trustProfile.trustLevel === 'suspicious') {
        toast({
          title: "Suspicious Device Detected",
          description: "This device has been flagged for security review",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Device Registered",
          description: "New device has been registered successfully"
        });
      }
    } catch (error) {
      console.error('Failed to register device:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register this device",
        variant: "destructive"
      });
    }
  }, [generateDeviceFingerprint, registeredDevices, secureStore, toast]);

  // Update device trust level
  const updateDeviceTrust = useCallback(async (deviceId: string, trustLevel: DeviceTrustProfile['trustLevel']) => {
    try {
      const updatedDevices = registeredDevices.map(device => {
        if (device.deviceId === deviceId) {
          return { ...device, trustLevel };
        }
        return device;
      });

      await secureStore('registered_devices', updatedDevices);
      setRegisteredDevices(updatedDevices);

      if (deviceId === currentDevice?.id) {
        setDeviceTrust(prev => prev ? { ...prev, trustLevel } : null);
      }

      toast({
        title: "Trust Level Updated",
        description: `Device trust level changed to ${trustLevel}`
      });
    } catch (error) {
      console.error('Failed to update device trust:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update device trust level",
        variant: "destructive"
      });
    }
  }, [registeredDevices, currentDevice, secureStore, toast]);

  // Remove device registration
  const removeDevice = useCallback(async (deviceId: string) => {
    try {
      const updatedDevices = registeredDevices.filter(d => d.deviceId !== deviceId);
      await secureStore('registered_devices', updatedDevices);
      setRegisteredDevices(updatedDevices);

      if (deviceId === currentDevice?.id) {
        setDeviceTrust(null);
      }

      toast({
        title: "Device Removed",
        description: "Device has been removed from trusted devices"
      });
    } catch (error) {
      console.error('Failed to remove device:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove device",
        variant: "destructive"
      });
    }
  }, [registeredDevices, currentDevice, secureStore, toast]);

  // Check if device is trusted for operation
  const isDeviceTrustedFor = useCallback((operation: 'login' | 'sensitive' | 'admin'): boolean => {
    if (!deviceTrust) return false;

    switch (operation) {
      case 'login':
        return deviceTrust.trustLevel !== 'blocked';
      case 'sensitive':
        return ['trusted'].includes(deviceTrust.trustLevel);
      case 'admin':
        return deviceTrust.trustLevel === 'trusted' && deviceTrust.loginCount >= 5;
      default:
        return false;
    }
  }, [deviceTrust]);

  // Get security recommendations
  const getSecurityRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (!deviceTrust) return recommendations;

    if (deviceTrust.trustLevel === 'new') {
      recommendations.push("New device detected - consider additional verification");
    }

    if (deviceTrust.riskFactors.includes('virtual_device')) {
      recommendations.push("Virtual device detected - enhanced monitoring recommended");
    }

    if (deviceTrust.riskFactors.includes('web_platform')) {
      recommendations.push("Web platform access - consider using mobile app for enhanced security");
    }

    if (deviceTrust.loginCount < 3) {
      recommendations.push("Low usage device - verify authenticity");
    }

    return recommendations;
  }, [deviceTrust]);

  // Initialize on mount
  useEffect(() => {
    initializeDeviceRegistration();
  }, [initializeDeviceRegistration]);

  return {
    // State
    currentDevice,
    deviceTrust,
    registeredDevices,
    isInitialized,
    
    // Device Management
    registerNewDevice,
    updateDeviceTrust,
    removeDevice,
    
    // Security Checks
    isDeviceTrustedFor,
    getSecurityRecommendations,
    
    // Utilities
    initializeDeviceRegistration,
    getCurrentDeviceInfo,
    isTrustedDevice: deviceTrust?.trustLevel === 'trusted',
    isNewDevice: deviceTrust?.trustLevel === 'new',
    isSuspiciousDevice: deviceTrust?.trustLevel === 'suspicious',
    isBlockedDevice: deviceTrust?.trustLevel === 'blocked'
  };
};