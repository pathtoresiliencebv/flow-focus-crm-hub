import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useSecurityService } from './useSecurityService';
import { useToast } from '@/hooks/use-toast';

export interface MFAConfig {
  isEnabled: boolean;
  methods: ('sms' | 'email' | 'totp' | 'backup_codes')[];
  requiredFor: ('login' | 'sensitive_ops' | 'admin_ops')[];
  backupCodesGenerated: boolean;
  phoneNumber?: string;
  email?: string;
}

export interface MFAChallenge {
  id: string;
  method: 'sms' | 'email' | 'totp';
  expiresAt: string;
  attemptsRemaining: number;
}

export interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: string;
}

export const useMultiFactorAuth = () => {
  const { toast } = useToast();
  const { secureStore, secureRetrieve, encryptData, decryptData } = useSecurityService();
  
  const [mfaConfig, setMfaConfig] = useState<MFAConfig>({
    isEnabled: false,
    methods: [],
    requiredFor: [],
    backupCodesGenerated: false
  });
  const [currentChallenge, setCurrentChallenge] = useState<MFAChallenge | null>(null);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MFA
  const initializeMFA = useCallback(async () => {
    try {
      // Load MFA configuration
      const config = await secureRetrieve<MFAConfig>('mfa_config');
      if (config) {
        setMfaConfig(config);
      }

      // Load backup codes
      const codes = await secureRetrieve<BackupCode[]>('mfa_backup_codes');
      if (codes) {
        setBackupCodes(codes);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize MFA:', error);
      setIsInitialized(true);
    }
  }, [secureRetrieve]);

  // Enable/disable MFA
  const setMFAEnabled = useCallback(async (enabled: boolean, methods: MFAConfig['methods'] = []) => {
    try {
      const newConfig: MFAConfig = {
        ...mfaConfig,
        isEnabled: enabled,
        methods: enabled ? methods : [],
        requiredFor: enabled ? ['sensitive_ops'] : []
      };

      await secureStore('mfa_config', newConfig);
      setMfaConfig(newConfig);

      toast({
        title: enabled ? "MFA Enabled" : "MFA Disabled",
        description: enabled 
          ? "Multi-factor authentication has been enabled"
          : "Multi-factor authentication has been disabled"
      });

      return true;
    } catch (error) {
      console.error('Failed to set MFA:', error);
      toast({
        title: "MFA Error",
        description: "Failed to update MFA settings",
        variant: "destructive"
      });
      return false;
    }
  }, [mfaConfig, secureStore, toast]);

  // Generate backup codes
  const generateBackupCodes = useCallback(async (): Promise<string[]> => {
    try {
      const codes: BackupCode[] = [];
      const codeStrings: string[] = [];

      // Generate 10 backup codes
      for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substr(2, 8).toUpperCase();
        codes.push({ code, used: false });
        codeStrings.push(code);
      }

      await secureStore('mfa_backup_codes', codes);
      setBackupCodes(codes);

      // Update config
      const updatedConfig = { ...mfaConfig, backupCodesGenerated: true };
      await secureStore('mfa_config', updatedConfig);
      setMfaConfig(updatedConfig);

      toast({
        title: "Backup Codes Generated",
        description: "Please save these codes in a secure location"
      });

      return codeStrings;
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate backup codes",
        variant: "destructive"
      });
      return [];
    }
  }, [mfaConfig, secureStore, toast]);

  // Initiate MFA challenge
  const initiateMFAChallenge = useCallback(async (method: 'sms' | 'email' | 'totp', operation: string): Promise<MFAChallenge | null> => {
    try {
      const challenge: MFAChallenge = {
        id: Math.random().toString(36).substr(2, 16),
        method,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        attemptsRemaining: 3
      };

      setCurrentChallenge(challenge);

      // Simulate sending challenge (in real app, would call backend)
      if (method === 'sms') {
        toast({
          title: "SMS Sent",
          description: `Verification code sent to ${mfaConfig.phoneNumber || '***-***-1234'}`
        });
      } else if (method === 'email') {
        toast({
          title: "Email Sent",
          description: `Verification code sent to ${mfaConfig.email || 'your registered email'}`
        });
      } else if (method === 'totp') {
        toast({
          title: "TOTP Required",
          description: "Enter the code from your authenticator app"
        });
      }

      return challenge;
    } catch (error) {
      console.error('Failed to initiate MFA challenge:', error);
      toast({
        title: "Challenge Failed",
        description: "Failed to initiate MFA challenge",
        variant: "destructive"
      });
      return null;
    }
  }, [mfaConfig, toast]);

  // Verify MFA code
  const verifyMFACode = useCallback(async (code: string, challengeId?: string): Promise<boolean> => {
    try {
      if (!currentChallenge && !challengeId) {
        toast({
          title: "No Active Challenge",
          description: "No MFA challenge is currently active",
          variant: "destructive"
        });
        return false;
      }

      const challenge = currentChallenge;
      if (!challenge) return false;

      // Check if challenge is expired
      if (new Date() > new Date(challenge.expiresAt)) {
        setCurrentChallenge(null);
        toast({
          title: "Challenge Expired",
          description: "The MFA challenge has expired. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      // Check attempts remaining
      if (challenge.attemptsRemaining <= 0) {
        setCurrentChallenge(null);
        toast({
          title: "Too Many Attempts",
          description: "Maximum verification attempts exceeded",
          variant: "destructive"
        });
        return false;
      }

      // Simulate code verification (in real app, would verify with backend)
      let isValid = false;
      
      if (challenge.method === 'totp') {
        // For TOTP, accept any 6-digit code for demo
        isValid = /^\d{6}$/.test(code);
      } else {
        // For SMS/Email, simulate with fixed code for demo
        isValid = code === '123456';
      }

      if (isValid) {
        setCurrentChallenge(null);
        toast({
          title: "Verification Successful",
          description: "MFA verification completed"
        });
        return true;
      } else {
        // Reduce attempts
        const updatedChallenge = {
          ...challenge,
          attemptsRemaining: challenge.attemptsRemaining - 1
        };
        setCurrentChallenge(updatedChallenge);

        toast({
          title: "Invalid Code",
          description: `Invalid verification code. ${updatedChallenge.attemptsRemaining} attempts remaining.`,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to verify MFA code:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify MFA code",
        variant: "destructive"
      });
      return false;
    }
  }, [currentChallenge, toast]);

  // Verify backup code
  const verifyBackupCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const backupCode = backupCodes.find(bc => bc.code === code.toUpperCase() && !bc.used);
      
      if (!backupCode) {
        toast({
          title: "Invalid Backup Code",
          description: "The backup code is invalid or has already been used",
          variant: "destructive"
        });
        return false;
      }

      // Mark code as used
      const updatedCodes = backupCodes.map(bc => 
        bc.code === code.toUpperCase() 
          ? { ...bc, used: true, usedAt: new Date().toISOString() }
          : bc
      );

      await secureStore('mfa_backup_codes', updatedCodes);
      setBackupCodes(updatedCodes);
      setCurrentChallenge(null);

      toast({
        title: "Backup Code Accepted",
        description: "Authentication successful. Please generate new backup codes."
      });

      return true;
    } catch (error) {
      console.error('Failed to verify backup code:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify backup code",
        variant: "destructive"
      });
      return false;
    }
  }, [backupCodes, secureStore, toast]);

  // Check if MFA is required for operation
  const isMFARequired = useCallback((operation: 'login' | 'sensitive_ops' | 'admin_ops'): boolean => {
    return mfaConfig.isEnabled && mfaConfig.requiredFor.includes(operation);
  }, [mfaConfig]);

  // Get available MFA methods
  const getAvailableMethods = useCallback((): ('sms' | 'email' | 'totp')[] => {
    return mfaConfig.methods.filter(method => method !== 'backup_codes') as ('sms' | 'email' | 'totp')[];
  }, [mfaConfig.methods]);

  // Update MFA configuration
  const updateMFAConfig = useCallback(async (updates: Partial<MFAConfig>) => {
    try {
      const updatedConfig = { ...mfaConfig, ...updates };
      await secureStore('mfa_config', updatedConfig);
      setMfaConfig(updatedConfig);
      return true;
    } catch (error) {
      console.error('Failed to update MFA config:', error);
      return false;
    }
  }, [mfaConfig, secureStore]);

  // Get unused backup codes count
  const getUnusedBackupCodesCount = useCallback((): number => {
    return backupCodes.filter(code => !code.used).length;
  }, [backupCodes]);

  // Initialize on mount
  useEffect(() => {
    initializeMFA();
  }, [initializeMFA]);

  return {
    // State
    mfaConfig,
    currentChallenge,
    backupCodes: backupCodes.filter(code => !code.used), // Only return unused codes
    isInitialized,
    
    // Configuration
    setMFAEnabled,
    updateMFAConfig,
    
    // Backup Codes
    generateBackupCodes,
    verifyBackupCode,
    getUnusedBackupCodesCount,
    
    // Challenge Management
    initiateMFAChallenge,
    verifyMFACode,
    
    // Utilities
    isMFARequired,
    getAvailableMethods,
    isEnabled: mfaConfig.isEnabled,
    hasActiveMethods: mfaConfig.methods.length > 0,
    needsBackupCodes: mfaConfig.isEnabled && !mfaConfig.backupCodesGenerated
  };
};