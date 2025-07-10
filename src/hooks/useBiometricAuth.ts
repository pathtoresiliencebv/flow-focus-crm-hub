import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { useNativeCapabilities } from './useNativeCapabilities';
import { useSecurityService } from './useSecurityService';
import { useToast } from './use-toast';

export interface BiometricCapabilities {
  isAvailable: boolean;
  supportedTypes: ('fingerprint' | 'face' | 'voice')[];
  isEnrolled: boolean;
  deviceSecure: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  fallbackToPin?: boolean;
}

export const useBiometricAuth = () => {
  const { toast } = useToast();
  const { isNativeApp, hapticFeedback } = useNativeCapabilities();
  const { secureStore, secureRetrieve, recordFailedAttempt, clearFailedAttempts } = useSecurityService();
  
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    supportedTypes: [],
    isEnrolled: false,
    deviceSecure: false
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize biometric capabilities
  const initializeBiometrics = useCallback(async () => {
    try {
      if (!isNativeApp) {
        setCapabilities({
          isAvailable: false,
          supportedTypes: [],
          isEnrolled: false,
          deviceSecure: false
        });
        setIsInitialized(true);
        return;
      }

      // Check device info and capabilities
      const deviceInfo = await Device.getInfo();
      
      // For now, simulate biometric capabilities based on platform
      // In real implementation, you'd use @capacitor-community/biometric or similar
      const mockCapabilities: BiometricCapabilities = {
        isAvailable: deviceInfo.platform === 'ios' || deviceInfo.platform === 'android',
        supportedTypes: deviceInfo.platform === 'ios' ? ['face', 'fingerprint'] : ['fingerprint'],
        isEnrolled: true, // Simulated - would check actual enrollment
        deviceSecure: true // Simulated - would check device security
      };

      setCapabilities(mockCapabilities);

      // Load biometric settings
      const { value: settingsData } = await Preferences.get({ key: 'biometric_settings' });
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        setIsEnabled(settings.enabled && mockCapabilities.isAvailable);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize biometrics:', error);
      setIsInitialized(true);
    }
  }, [isNativeApp]);

  // Enable/disable biometric authentication
  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    try {
      if (enabled && !capabilities.isAvailable) {
        toast({
          title: "Biometric Not Available",
          description: "Biometric authentication is not available on this device",
          variant: "destructive"
        });
        return false;
      }

      if (enabled && !capabilities.isEnrolled) {
        toast({
          title: "Biometric Not Enrolled",
          description: "Please enroll your biometric data in device settings first",
          variant: "destructive"
        });
        return false;
      }

      const settings = {
        enabled,
        enrolledAt: enabled ? new Date().toISOString() : null,
        supportedTypes: capabilities.supportedTypes
      };

      await Preferences.set({
        key: 'biometric_settings',
        value: JSON.stringify(settings)
      });

      // Store in secure storage
      await secureStore('biometric_config', settings);

      setIsEnabled(enabled);

      toast({
        title: enabled ? "Biometric Enabled" : "Biometric Disabled",
        description: enabled 
          ? "Biometric authentication has been enabled"
          : "Biometric authentication has been disabled"
      });

      return true;
    } catch (error) {
      console.error('Failed to set biometric setting:', error);
      toast({
        title: "Settings Error",
        description: "Failed to update biometric settings",
        variant: "destructive"
      });
      return false;
    }
  }, [capabilities, secureStore, toast]);

  // Authenticate with biometrics
  const authenticateWithBiometric = useCallback(async (reason: string = "Authenticate to continue"): Promise<BiometricAuthResult> => {
    try {
      if (!isEnabled || !capabilities.isAvailable) {
        return {
          success: false,
          error: "Biometric authentication not available",
          fallbackToPin: true
        };
      }

      // Haptic feedback
      if (isNativeApp) {
        await hapticFeedback();
      }

      // Simulate biometric authentication
      // In real implementation, you'd use the biometric plugin
      const mockSuccess = Math.random() > 0.1; // 90% success rate for demo

      if (mockSuccess) {
        await clearFailedAttempts();
        
        toast({
          title: "Authentication Successful",
          description: "Biometric authentication completed"
        });

        return { success: true };
      } else {
        await recordFailedAttempt();
        
        return {
          success: false,
          error: "Biometric authentication failed",
          fallbackToPin: true
        };
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      await recordFailedAttempt();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
        fallbackToPin: true
      };
    }
  }, [isEnabled, capabilities, isNativeApp, hapticFeedback, clearFailedAttempts, recordFailedAttempt, toast]);

  // Quick authentication for sensitive operations
  const quickAuth = useCallback(async (operation: string): Promise<boolean> => {
    const result = await authenticateWithBiometric(`Authenticate to ${operation}`);
    
    if (!result.success && result.fallbackToPin) {
      // Could implement PIN fallback here
      toast({
        title: "Authentication Required",
        description: "Please use alternative authentication method",
        variant: "destructive"
      });
    }

    return result.success;
  }, [authenticateWithBiometric, toast]);

  // Verify biometric availability for critical operations
  const verifyForCriticalOperation = useCallback(async (operation: string): Promise<boolean> => {
    if (!capabilities.deviceSecure) {
      toast({
        title: "Device Not Secure",
        description: "Please secure your device with a PIN or password first",
        variant: "destructive"
      });
      return false;
    }

    return await quickAuth(operation);
  }, [capabilities.deviceSecure, quickAuth, toast]);

  // Initialize on mount
  useEffect(() => {
    initializeBiometrics();
  }, [initializeBiometrics]);

  return {
    // State
    capabilities,
    isEnabled,
    isInitialized,
    
    // Configuration
    setBiometricEnabled,
    initializeBiometrics,
    
    // Authentication
    authenticateWithBiometric,
    quickAuth,
    verifyForCriticalOperation,
    
    // Utilities
    isAvailable: capabilities.isAvailable && isEnabled,
    supportedTypes: capabilities.supportedTypes
  };
};