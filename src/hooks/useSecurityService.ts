import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useNativeCapabilities } from './useNativeCapabilities';
import { encryptionService } from '@/services/encryptionService';
import { useToast } from '@/hooks/use-toast';

interface SecurityConfig {
  encryptionEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number; // minutes
  maxFailedAttempts: number;
  requirePinForSensitiveData: boolean;
}

interface SecurityMetrics {
  lastActivity: Date | null;
  failedAttempts: number;
  securityLevel: 'low' | 'medium' | 'high';
  encryptionStatus: 'active' | 'inactive';
}

export const useSecurityService = () => {
  const { toast } = useToast();
  const { isNativeApp, hapticFeedback } = useNativeCapabilities();
  
  const [isSecurityInitialized, setIsSecurityInitialized] = useState(false);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    encryptionEnabled: true,
    biometricEnabled: false,
    sessionTimeout: 30,
    maxFailedAttempts: 5,
    requirePinForSensitiveData: true
  });
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    lastActivity: null,
    failedAttempts: 0,
    securityLevel: 'medium',
    encryptionStatus: 'inactive'
  });

  // Initialize security service
  const initializeSecurity = useCallback(async () => {
    try {
      // Load security configuration
      const { value: configData } = await Preferences.get({ key: 'security_config' });
      if (configData) {
        setSecurityConfig(JSON.parse(configData));
      }

      // Initialize encryption service
      await encryptionService.initializeMasterKey();
      
      // Load security metrics
      const { value: metricsData } = await Preferences.get({ key: 'security_metrics' });
      if (metricsData) {
        const metrics = JSON.parse(metricsData);
        setSecurityMetrics({
          ...metrics,
          lastActivity: metrics.lastActivity ? new Date(metrics.lastActivity) : null
        });
      }

      setIsSecurityInitialized(true);
      
      // Update security status
      setSecurityMetrics(prev => ({
        ...prev,
        encryptionStatus: 'active',
        lastActivity: new Date()
      }));

    } catch (error) {
      console.error('Security initialization failed:', error);
      toast({
        title: "Security Error",
        description: "Failed to initialize security features",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Update security configuration
  const updateSecurityConfig = useCallback(async (updates: Partial<SecurityConfig>) => {
    try {
      const newConfig = { ...securityConfig, ...updates };
      await Preferences.set({
        key: 'security_config',
        value: JSON.stringify(newConfig)
      });
      setSecurityConfig(newConfig);
      
      toast({
        title: "Security Updated",
        description: "Security configuration has been updated",
      });
    } catch (error) {
      console.error('Failed to update security config:', error);
      toast({
        title: "Security Error",
        description: "Failed to update security settings",
        variant: "destructive"
      });
    }
  }, [securityConfig, toast]);

  // Encrypt sensitive data before storage
  const encryptData = useCallback((data: any): string => {
    if (!securityConfig.encryptionEnabled) {
      return JSON.stringify(data);
    }
    
    try {
      return encryptionService.encryptObject(data);
    } catch (error) {
      console.error('Data encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }, [securityConfig.encryptionEnabled]);

  // Decrypt sensitive data after retrieval
  const decryptData = useCallback(<T>(encryptedData: string): T => {
    if (!securityConfig.encryptionEnabled) {
      return JSON.parse(encryptedData);
    }
    
    try {
      return encryptionService.decryptObject<T>(encryptedData);
    } catch (error) {
      console.error('Data decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }, [securityConfig.encryptionEnabled]);

  // Secure data storage
  const secureStore = useCallback(async (key: string, data: any) => {
    try {
      const encryptedData = encryptData(data);
      const hash = encryptionService.generateHash(encryptedData);
      
      await Preferences.set({
        key: `secure_${key}`,
        value: JSON.stringify({
          data: encryptedData,
          hash,
          timestamp: Date.now()
        })
      });
      
      // Update activity
      setSecurityMetrics(prev => ({
        ...prev,
        lastActivity: new Date()
      }));
      
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to securely store data');
    }
  }, [encryptData]);

  // Secure data retrieval
  const secureRetrieve = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      const { value } = await Preferences.get({ key: `secure_${key}` });
      if (!value) return null;

      const stored = JSON.parse(value);
      
      // Verify data integrity
      if (!encryptionService.verifyHash(stored.data, stored.hash)) {
        console.warn('Data integrity check failed for key:', key);
        await Preferences.remove({ key: `secure_${key}` });
        return null;
      }

      const decryptedData = decryptData<T>(stored.data);
      
      // Update activity
      setSecurityMetrics(prev => ({
        ...prev,
        lastActivity: new Date()
      }));
      
      return decryptedData;
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }, [decryptData]);

  // Check session validity
  const isSessionValid = useCallback((): boolean => {
    if (!securityMetrics.lastActivity) return false;
    
    const timeoutMs = securityConfig.sessionTimeout * 60 * 1000;
    const elapsed = Date.now() - securityMetrics.lastActivity.getTime();
    
    return elapsed < timeoutMs;
  }, [securityMetrics.lastActivity, securityConfig.sessionTimeout]);

  // Record failed authentication attempt
  const recordFailedAttempt = useCallback(async () => {
    const newFailedAttempts = securityMetrics.failedAttempts + 1;
    
    const newMetrics = {
      ...securityMetrics,
      failedAttempts: newFailedAttempts,
      securityLevel: newFailedAttempts >= securityConfig.maxFailedAttempts ? 'high' : 'medium'
    } as SecurityMetrics;
    
    setSecurityMetrics(newMetrics);
    
    await Preferences.set({
      key: 'security_metrics',
      value: JSON.stringify(newMetrics)
    });

    if (isNativeApp) {
      await hapticFeedback();
    }

    if (newFailedAttempts >= securityConfig.maxFailedAttempts) {
      toast({
        title: "Security Alert",
        description: "Too many failed attempts. Access temporarily restricted.",
        variant: "destructive"
      });
    }
  }, [securityMetrics, securityConfig, isNativeApp, hapticFeedback, toast]);

  // Clear failed attempts on successful authentication
  const clearFailedAttempts = useCallback(async () => {
    const newMetrics = {
      ...securityMetrics,
      failedAttempts: 0,
      securityLevel: 'medium' as const,
      lastActivity: new Date()
    };
    
    setSecurityMetrics(newMetrics);
    
    await Preferences.set({
      key: 'security_metrics',
      value: JSON.stringify(newMetrics)
    });
  }, [securityMetrics]);

  // Mask sensitive data for display
  const maskSensitiveData = useCallback((data: string, type: 'email' | 'phone' | 'card' | 'generic' = 'generic'): string => {
    switch (type) {
      case 'email':
        const [username, domain] = data.split('@');
        return `${username.charAt(0)}${'*'.repeat(username.length - 1)}@${domain}`;
      case 'phone':
        return data.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
      case 'card':
        return data.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2');
      default:
        return encryptionService.maskSensitiveData(data);
    }
  }, []);

  // Wipe sensitive data (security breach response)
  const wipeSensitiveData = useCallback(async () => {
    try {
      // Get all keys
      const { keys } = await Preferences.keys();
      
      // Remove all secure data
      const secureKeys = keys.filter(key => key.startsWith('secure_'));
      for (const key of secureKeys) {
        await Preferences.remove({ key });
      }
      
      // Clear encryption keys
      encryptionService.clearKeys();
      await Preferences.remove({ key: 'encryption_master_key' });
      
      // Reset metrics
      await Preferences.remove({ key: 'security_metrics' });
      
      toast({
        title: "Security Wipe Complete",
        description: "All sensitive data has been securely removed",
      });
      
    } catch (error) {
      console.error('Data wipe failed:', error);
      toast({
        title: "Security Error",
        description: "Failed to complete security wipe",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Initialize on mount
  useEffect(() => {
    initializeSecurity();
  }, [initializeSecurity]);

  // Auto-save metrics periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (securityMetrics.lastActivity) {
        await Preferences.set({
          key: 'security_metrics',
          value: JSON.stringify(securityMetrics)
        });
      }
    }, 60000); // Save every minute

    return () => clearInterval(interval);
  }, [securityMetrics]);

  return {
    // State
    isSecurityInitialized,
    securityConfig,
    securityMetrics,
    
    // Configuration
    updateSecurityConfig,
    
    // Data Protection
    encryptData,
    decryptData,
    secureStore,
    secureRetrieve,
    maskSensitiveData,
    
    // Session Management
    isSessionValid,
    
    // Authentication
    recordFailedAttempt,
    clearFailedAttempts,
    
    // Emergency
    wipeSensitiveData,
    
    // Utils
    initializeSecurity
  };
};