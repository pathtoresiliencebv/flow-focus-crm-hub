import { useState, useCallback } from 'react';

// Define all possible loading states
export type LoadingState = 
  | { status: 'initializing' }
  | { status: 'authenticating', hasCache: boolean }
  | { status: 'validating-cache' }
  | { status: 'loading-profile', userId: string }
  | { status: 'loading-permissions', userId: string }
  | { status: 'initializing-data', isAdmin: boolean }
  | { status: 'loading-section', section: DataSection, operation?: string }
  | { status: 'ready', user: UserInfo }
  | { status: 'error', error: AppError, previousState: string }
  | { status: 'unauthenticated' };

export type DataSection = 
  | 'customers' | 'projects' | 'planning' 
  | 'timeRegistration' | 'receipts' | 'quotes'
  | 'personnel' | 'users' | 'settings' 
  | 'email' | 'chat';

export interface AppError {
  code: string;
  message: string;
  canRetry: boolean;
  timestamp: Date;
}

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

export const useLoadingMachine = () => {
  const [state, setState] = useState<LoadingState>({ 
    status: 'initializing' 
  });

  // Track state history for debugging (keep last 20 transitions)
  const [stateHistory, setStateHistory] = useState<Array<{ status: string; timestamp: number }>>([]);

  const transition = useCallback((newState: LoadingState) => {
    setState(prevState => {
      const from = prevState.status;
      const to = newState.status;
      
      console.log('🔄 LOADING STATE MACHINE:', {
        from,
        to,
        details: newState
      });
      
      // Add to history with timestamp
      setStateHistory(prev => {
        const newHistory = [...prev, { status: from, timestamp: Date.now() }];
        // Keep only last 20 transitions
        return newHistory.slice(-20);
      });
      
      return newState;
    });
  }, []); // ✅ No dependencies - stable reference

  // Helper functions for common transitions
  const startAuthenticating = useCallback((hasCache: boolean) => {
    transition({ status: 'authenticating', hasCache });
  }, [transition]);

  const startValidatingCache = useCallback(() => {
    transition({ status: 'validating-cache' });
  }, [transition]);

  const startLoadingProfile = useCallback((userId: string) => {
    transition({ status: 'loading-profile', userId });
  }, [transition]);

  const startLoadingPermissions = useCallback((userId: string) => {
    transition({ status: 'loading-permissions', userId });
  }, [transition]);

  const startInitializingData = useCallback((isAdmin: boolean) => {
    transition({ status: 'initializing-data', isAdmin });
  }, [transition]);

  const startLoadingSection = useCallback((section: DataSection, operation?: string) => {
    transition({ status: 'loading-section', section, operation });
  }, [transition]);

  const setReady = useCallback((user: UserInfo) => {
    console.log('✅ LOADING STATE MACHINE: App ready', { user });
    transition({ status: 'ready', user });
  }, [transition]);

  const setError = useCallback((error: AppError) => {
    console.error('❌ LOADING STATE MACHINE: Error occurred', error);
    transition({ 
      status: 'error', 
      error, 
      previousState: state.status 
    });
  }, [transition, state.status]);

  const setUnauthenticated = useCallback(() => {
    console.log('🔐 LOADING STATE MACHINE: Unauthenticated');
    transition({ status: 'unauthenticated' });
  }, [transition]);

  // Computed properties
  const isLoading = state.status !== 'ready' && state.status !== 'unauthenticated' && state.status !== 'error';
  const isError = state.status === 'error';
  const isReady = state.status === 'ready';
  const isAuthenticated = state.status !== 'unauthenticated' && state.status !== 'initializing';

  return {
    state,
    stateHistory,
    isLoading,
    isError,
    isReady,
    isAuthenticated,
    // Transition functions
    startAuthenticating,
    startValidatingCache,
    startLoadingProfile,
    startLoadingPermissions,
    startInitializingData,
    startLoadingSection,
    setReady,
    setError,
    setUnauthenticated,
  };
};

