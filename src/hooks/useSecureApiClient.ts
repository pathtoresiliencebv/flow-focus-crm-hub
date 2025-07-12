import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityService } from './useSecurityService';
import { useNetworkAware } from './useNetworkAware';
import { useToast } from '@/hooks/use-toast';

interface ApiRequestConfig {
  retries?: number;
  timeout?: number;
  requireAuth?: boolean;
  encrypt?: boolean;
  sensitive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  encrypted?: boolean;
}

interface RequestLog {
  id: string;
  url: string;
  method: string;
  timestamp: Date;
  status: 'success' | 'error' | 'timeout';
  encrypted: boolean;
  sensitiveData: boolean;
}

export const useSecureApiClient = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkAware();
  const { 
    isSecurityInitialized, 
    encryptData, 
    decryptData, 
    secureStore, 
    secureRetrieve,
    securityConfig
  } = useSecurityService();

  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize secure API client
  const initializeClient = useCallback(async () => {
    if (!isSecurityInitialized) return;

    try {
      // Load request logs
      const logs = await secureRetrieve<RequestLog[]>('api_request_logs') || [];
      setRequestLogs(logs);
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize secure API client:', error);
    }
  }, [isSecurityInitialized, secureRetrieve]);

  // Log API request
  const logRequest = useCallback(async (log: Omit<RequestLog, 'id' | 'timestamp'>) => {
    const newLog: RequestLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    const updatedLogs = [newLog, ...requestLogs.slice(0, 99)]; // Keep last 100 logs
    setRequestLogs(updatedLogs);
    
    // Store logs securely
    await secureStore('api_request_logs', updatedLogs);
  }, [requestLogs, secureStore]);

  // Secure Supabase query
  const secureQuery = useCallback(async <T>(
    tableName: string,
    query: any,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> => {
    if (!isOnline && !config.requireAuth) {
      return {
        success: false,
        error: 'No internet connection'
      };
    }

    const {
      retries = 3,
      timeout = 10000,
      encrypt = false,
      sensitive = false
    } = config;

    let attempt = 0;
    
    while (attempt < retries) {
      try {
        // Add timeout to request
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );

        const queryPromise = query;
        const result = await Promise.race([queryPromise, timeoutPromise]);

        if (result.error) {
          throw new Error(result.error.message);
        }

        let responseData = result.data;

        // Decrypt response if needed
        if (encrypt && responseData) {
          try {
            responseData = decryptData(responseData);
          } catch (decryptError) {
            console.warn('Failed to decrypt response:', decryptError);
          }
        }

        // Log successful request
        await logRequest({
          url: tableName,
          method: 'SELECT',
          status: 'success',
          encrypted: encrypt,
          sensitiveData: sensitive
        });

        return {
          success: true,
          data: responseData,
          encrypted: encrypt
        };

      } catch (error: any) {
        attempt++;
        
        if (attempt >= retries) {
          // Log failed request
          await logRequest({
            url: tableName,
            method: 'SELECT',
            status: error.message.includes('timeout') ? 'timeout' : 'error',
            encrypted: encrypt,
            sensitiveData: sensitive
          });

          return {
            success: false,
            error: error.message || 'Request failed'
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      success: false,
      error: 'Maximum retries exceeded'
    };
  }, [isOnline, decryptData, logRequest]);

  // Secure Supabase mutation
  const secureMutation = useCallback(async <T>(
    tableName: string,
    operation: 'insert' | 'update' | 'upsert' | 'delete',
    data?: any,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> => {
    if (!isOnline) {
      return {
        success: false,
        error: 'No internet connection'
      };
    }

    const {
      retries = 3,
      timeout = 15000,
      encrypt = false,
      sensitive = false
    } = config;

    let processedData = data;

    // Encrypt data if required
    if (encrypt && data && securityConfig.encryptionEnabled) {
      try {
        processedData = encryptData(data);
      } catch (encryptError) {
        return {
          success: false,
          error: 'Failed to encrypt request data'
        };
      }
    }

    let attempt = 0;
    
    while (attempt < retries) {
      try {
        let query;
        
        switch (operation) {
          case 'insert':
            query = (supabase as any).from(tableName).insert(processedData);
            break;
          case 'update':
            query = (supabase as any).from(tableName).update(processedData);
            break;
          case 'upsert':
            query = (supabase as any).from(tableName).upsert(processedData);
            break;
          case 'delete':
            query = (supabase as any).from(tableName).delete();
            break;
          default:
            throw new Error('Invalid operation');
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );

        const result = await Promise.race([query, timeoutPromise]);

        if (result.error) {
          throw new Error(result.error.message);
        }

        // Log successful mutation
        await logRequest({
          url: tableName,
          method: operation.toUpperCase(),
          status: 'success',
          encrypted: encrypt,
          sensitiveData: sensitive
        });

        return {
          success: true,
          data: result.data,
          encrypted: encrypt
        };

      } catch (error: any) {
        attempt++;
        
        if (attempt >= retries) {
          // Log failed mutation
          await logRequest({
            url: tableName,
            method: operation.toUpperCase(),
            status: error.message.includes('timeout') ? 'timeout' : 'error',
            encrypted: encrypt,
            sensitiveData: sensitive
          });

          return {
            success: false,
            error: error.message || 'Request failed'
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      success: false,
      error: 'Maximum retries exceeded'
    };
  }, [isOnline, encryptData, securityConfig.encryptionEnabled, logRequest]);

  // Get security headers for requests
  const getSecurityHeaders = useCallback(() => {
    return {
      'X-Client-Version': '1.0.0',
      'X-Security-Level': 'high',
      'X-Request-ID': crypto.randomUUID(),
      'X-Timestamp': Date.now().toString()
    };
  }, []);

  // Validate response integrity
  const validateResponse = useCallback((response: any, expectedHash?: string): boolean => {
    if (!expectedHash) return true;
    
    try {
      const responseString = JSON.stringify(response);
      // Simple hash validation - in production, use proper HMAC
      return btoa(responseString).slice(0, 16) === expectedHash;
    } catch {
      return false;
    }
  }, []);

  // Clear request logs
  const clearLogs = useCallback(async () => {
    setRequestLogs([]);
    await secureStore('api_request_logs', []);
  }, [secureStore]);

  // Get security metrics
  const getSecurityMetrics = useCallback(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = requestLogs.filter(log => log.timestamp >= last24h);
    
    return {
      totalRequests: recentLogs.length,
      successfulRequests: recentLogs.filter(log => log.status === 'success').length,
      failedRequests: recentLogs.filter(log => log.status === 'error').length,
      timeoutRequests: recentLogs.filter(log => log.status === 'timeout').length,
      encryptedRequests: recentLogs.filter(log => log.encrypted).length,
      sensitiveRequests: recentLogs.filter(log => log.sensitiveData).length,
      successRate: recentLogs.length > 0 
        ? (recentLogs.filter(log => log.status === 'success').length / recentLogs.length) * 100 
        : 0
    };
  }, [requestLogs]);

  // Initialize on mount
  useEffect(() => {
    initializeClient();
  }, [initializeClient]);

  return {
    // State
    isInitialized,
    requestLogs,
    
    // API Methods
    secureQuery,
    secureMutation,
    
    // Utils
    getSecurityHeaders,
    validateResponse,
    clearLogs,
    getSecurityMetrics,
    
    // Re-initialization
    initializeClient
  };
};