import { useState, useCallback, useMemo } from 'react';

// Define all possible loading states
export type LoadingState = 
  | { status: 'initializing' }
  | { status: 'authenticating', hasCache: boolean }
  | { status: 'validating-cache' }
  | { status: 'loading-profile', userId: string }
  | { status: 'loading-permissions', userId: string }
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

  const startLoadingSection = useCallback((section: DataSection, operation?: string) => {
    transition({ status: 'loading-section', section, operation });
  }, [transition]);

  const setReady = useCallback((user: UserInfo) => {
    console.log('✅ LOADING STATE MACHINE: App ready', { user });
    transition({ status: 'ready', user });
  }, [transition]);

  const setError = useCallback((error: AppError) => {
    console.error('❌ LOADING STATE MACHINE: Error occurred', error);
    // ✅ Use functional setState to get current state without dependency
    setState(prevState => {
      const newState: LoadingState = { 
        status: 'error', 
        error, 
        previousState: prevState.status 
      };
      
      console.log('🔄 LOADING STATE MACHINE:', {
        from: prevState.status,
        to: 'error',
        details: newState
      });
      
      // Add to history
      setStateHistory(prev => {
        const newHistory = [...prev, { status: prevState.status, timestamp: Date.now() }];
        return newHistory.slice(-20);
      });
      
      return newState;
    });
  }, []);

  const setUnauthenticated = useCallback(() => {
    console.log('🔐 LOADING STATE MACHINE: Unauthenticated');
    transition({ status: 'unauthenticated' });
  }, [transition]);

  // ✅ Memoize computed properties to prevent unnecessary re-computations
  const isLoading = useMemo(() => 
    state.status !== 'ready' && state.status !== 'unauthenticated' && state.status !== 'error',
    [state.status]
  );
  
  const isError = useMemo(() => 
    state.status === 'error',
    [state.status]
  );
  
  const isReady = useMemo(() => 
    state.status === 'ready',
    [state.status]
  );
  
  const isAuthenticated = useMemo(() => 
    state.status !== 'unauthenticated' && state.status !== 'initializing',
    [state.status]
  );

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
    startLoadingSection,
    setReady,
    setError,
    setUnauthenticated,
  };
};

