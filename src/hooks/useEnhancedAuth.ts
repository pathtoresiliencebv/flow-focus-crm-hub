import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBiometricAuth } from './useBiometricAuth';
import { useDeviceRegistration } from './useDeviceRegistration';
import { useMultiFactorAuth } from './useMultiFactorAuth';
import { useSecurityService } from './useSecurityService';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedAuthState {
  isAuthenticated: boolean;
  isBiometricEnabled: boolean;
  isDeviceTrusted: boolean;
  isMFAEnabled: boolean;
  authLevel: 'none' | 'basic' | 'enhanced' | 'maximum';
  requiresReauth: boolean;
}

export interface AuthenticationContext {
  operation: string;
  requiredLevel: 'basic' | 'enhanced' | 'maximum';
  allowFallback: boolean;
}

export const useEnhancedAuth = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { 
    isAvailable: biometricAvailable, 
    isEnabled: biometricEnabled,
    authenticateWithBiometric,
    quickAuth 
  } = useBiometricAuth();
  const { 
    deviceTrust, 
    isTrustedDevice,
    isDeviceTrustedFor 
  } = useDeviceRegistration();
  const { 
    mfaConfig,
    isMFARequired,
    initiateMFAChallenge,
    verifyMFACode 
  } = useMultiFactorAuth();
  const { isSessionValid } = useSecurityService();

  const [authState, setAuthState] = useState<EnhancedAuthState>({
    isAuthenticated: false,
    isBiometricEnabled: false,
    isDeviceTrusted: false,
    isMFAEnabled: false,
    authLevel: 'none',
    requiresReauth: false
  });

  // Calculate current authentication level
  const calculateAuthLevel = useCallback((): EnhancedAuthState['authLevel'] => {
    if (!isAuthenticated) return 'none';
    
    let level: EnhancedAuthState['authLevel'] = 'basic';
    
    // Enhanced level: biometric + trusted device
    if (biometricEnabled && isTrustedDevice) {
      level = 'enhanced';
    }
    
    // Maximum level: enhanced + MFA
    if (level === 'enhanced' && mfaConfig.isEnabled) {
      level = 'maximum';
    }
    
    return level;
  }, [isAuthenticated, biometricEnabled, isTrustedDevice, mfaConfig.isEnabled]);

  // Update auth state
  const updateAuthState = useCallback(() => {
    const newState: EnhancedAuthState = {
      isAuthenticated,
      isBiometricEnabled: biometricEnabled,
      isDeviceTrusted: isTrustedDevice,
      isMFAEnabled: mfaConfig.isEnabled,
      authLevel: calculateAuthLevel(),
      requiresReauth: !isSessionValid()
    };
    
    setAuthState(newState);
  }, [
    isAuthenticated,
    biometricEnabled,
    isTrustedDevice,
    mfaConfig.isEnabled,
    calculateAuthLevel,
    isSessionValid
  ]);

  // Enhanced login with multiple authentication factors
  const enhancedLogin = useCallback(async (
    email: string, 
    password: string, 
    options?: {
      useBiometric?: boolean;
      requireMFA?: boolean;
    }
  ): Promise<boolean> => {
    try {
      // Step 1: Basic authentication
      await login(email, password);
      
      if (!isAuthenticated) {
        return false;
      }

      // Step 2: Biometric authentication (if enabled and requested)
      if (options?.useBiometric && biometricEnabled) {
        const biometricResult = await authenticateWithBiometric("Complete login with biometric");
        if (!biometricResult.success) {
          toast({
            title: "Biometric Authentication Failed",
            description: "Login completed without biometric verification",
            variant: "destructive"
          });
        }
      }

      // Step 3: MFA (if required)
      if (options?.requireMFA && mfaConfig.isEnabled) {
        const availableMethods = mfaConfig.methods.filter(m => m !== 'backup_codes');
        if (availableMethods.length > 0) {
          const method = availableMethods[0] as 'sms' | 'email' | 'totp';
          const challenge = await initiateMFAChallenge(method, 'login');
          
          if (!challenge) {
            toast({
              title: "MFA Setup Required",
              description: "Please complete MFA setup to continue",
              variant: "destructive"
            });
            return false;
          }
          
          // Note: In real implementation, would wait for user input
          // Here we'll just indicate MFA is required
          toast({
            title: "MFA Required",
            description: "Please complete MFA verification to continue"
          });
        }
      }

      updateAuthState();
      return true;
    } catch (error) {
      console.error('Enhanced login failed:', error);
      toast({
        title: "Login Failed",
        description: "Failed to complete enhanced authentication",
        variant: "destructive"
      });
      return false;
    }
  }, [
    login,
    isAuthenticated,
    biometricEnabled,
    authenticateWithBiometric,
    mfaConfig,
    initiateMFAChallenge,
    updateAuthState,
    toast
  ]);

  // Authenticate for specific operation
  const authenticateForOperation = useCallback(async (context: AuthenticationContext): Promise<boolean> => {
    try {
      // Check if already authenticated at required level
      if (authState.authLevel === 'maximum' && context.requiredLevel !== 'maximum') {
        return true;
      }

      // Check device trust for sensitive/admin operations
      if (['enhanced', 'maximum'].includes(context.requiredLevel)) {
        if (!isDeviceTrustedFor('sensitive')) {
          toast({
            title: "Device Not Trusted",
            description: "This device is not trusted for sensitive operations",
            variant: "destructive"
          });
          return false;
        }
      }

      // Biometric authentication for enhanced/maximum
      if (['enhanced', 'maximum'].includes(context.requiredLevel) && biometricEnabled) {
        const biometricResult = await quickAuth(context.operation);
        if (!biometricResult && !context.allowFallback) {
          return false;
        }
      }

      // MFA for maximum level
      if (context.requiredLevel === 'maximum' && isMFARequired('sensitive_ops')) {
        const availableMethods = mfaConfig.methods.filter(m => m !== 'backup_codes');
        if (availableMethods.length > 0) {
          const method = availableMethods[0] as 'sms' | 'email' | 'totp';
          const challenge = await initiateMFAChallenge(method, context.operation);
          
          if (!challenge) {
            return false;
          }
          
          // Note: In real implementation, would handle MFA flow
          toast({
            title: "MFA Required",
            description: `Please complete MFA for: ${context.operation}`
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Operation authentication failed:', error);
      toast({
        title: "Authentication Failed",
        description: `Failed to authenticate for: ${context.operation}`,
        variant: "destructive"
      });
      return false;
    }
  }, [
    authState.authLevel,
    isDeviceTrustedFor,
    biometricEnabled,
    quickAuth,
    isMFARequired,
    mfaConfig.methods,
    initiateMFAChallenge,
    toast
  ]);

  // Quick authentication for common operations
  const quickAuthenticate = useCallback(async (operation: string): Promise<boolean> => {
    return authenticateForOperation({
      operation,
      requiredLevel: 'enhanced',
      allowFallback: true
    });
  }, [authenticateForOperation]);

  // Maximum security authentication for critical operations
  const maxSecurityAuthenticate = useCallback(async (operation: string): Promise<boolean> => {
    return authenticateForOperation({
      operation,
      requiredLevel: 'maximum',
      allowFallback: false
    });
  }, [authenticateForOperation]);

  // Check if operation is allowed at current auth level
  const isOperationAllowed = useCallback((requiredLevel: 'basic' | 'enhanced' | 'maximum'): boolean => {
    const levels = ['none', 'basic', 'enhanced', 'maximum'];
    const currentIndex = levels.indexOf(authState.authLevel);
    const requiredIndex = levels.indexOf(requiredLevel);
    
    return currentIndex >= requiredIndex;
  }, [authState.authLevel]);

  // Get security recommendations
  const getSecurityRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (!biometricEnabled && biometricAvailable) {
      recommendations.push("Enable biometric authentication for enhanced security");
    }

    if (!mfaConfig.isEnabled) {
      recommendations.push("Enable multi-factor authentication for maximum security");
    }

    if (!isTrustedDevice) {
      recommendations.push("This device is not yet trusted - consider additional verification");
    }

    if (authState.requiresReauth) {
      recommendations.push("Session expired - please re-authenticate");
    }

    return recommendations;
  }, [biometricEnabled, biometricAvailable, mfaConfig.isEnabled, isTrustedDevice, authState.requiresReauth]);

  // Enhanced logout with cleanup
  const enhancedLogout = useCallback(async () => {
    try {
      await logout();
      setAuthState({
        isAuthenticated: false,
        isBiometricEnabled: false,
        isDeviceTrusted: false,
        isMFAEnabled: false,
        authLevel: 'none',
        requiresReauth: false
      });
    } catch (error) {
      console.error('Enhanced logout failed:', error);
    }
  }, [logout]);

  // Update auth state when dependencies change
  useEffect(() => {
    updateAuthState();
  }, [updateAuthState]);

  return {
    // State
    authState,
    user,
    
    // Authentication Methods
    enhancedLogin,
    enhancedLogout,
    
    // Operation Authentication
    authenticateForOperation,
    quickAuthenticate,
    maxSecurityAuthenticate,
    
    // Authorization
    isOperationAllowed,
    
    // Utilities
    getSecurityRecommendations,
    updateAuthState,
    
    // Quick Access
    canPerformSensitiveOps: isOperationAllowed('enhanced'),
    canPerformAdminOps: isOperationAllowed('maximum'),
    isMaxSecurity: authState.authLevel === 'maximum',
    needsReauth: authState.requiresReauth
  };
};