import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLoadingMachine, LoadingState, DataSection, AppError, UserInfo } from '@/hooks/useLoadingMachine';

interface LoadingStateContextType {
  state: LoadingState;
  stateHistory: Array<{ status: string; timestamp: number }>;
  isLoading: boolean;
  isError: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  // Transition functions
  startAuthenticating: (hasCache: boolean) => void;
  startValidatingCache: () => void;
  startLoadingProfile: (userId: string) => void;
  startLoadingPermissions: (userId: string) => void;
  startInitializingData: (isAdmin: boolean) => void;
  startLoadingSection: (section: DataSection, operation?: string) => void;
  setReady: (user: UserInfo) => void;
  setError: (error: AppError) => void;
  setUnauthenticated: () => void;
}

const LoadingStateContext = createContext<LoadingStateContextType | undefined>(undefined);

export const useLoadingState = () => {
  const context = useContext(LoadingStateContext);
  if (!context) {
    throw new Error('useLoadingState must be used within LoadingStateProvider');
  }
  return context;
};

interface LoadingStateProviderProps {
  children: ReactNode;
}

export const LoadingStateProvider = ({ children }: LoadingStateProviderProps) => {
  const {
    state,
    stateHistory,
    isLoading,
    isError,
    isReady,
    isAuthenticated,
    startAuthenticating,
    startValidatingCache,
    startLoadingProfile,
    startLoadingPermissions,
    startInitializingData,
    startLoadingSection,
    setReady,
    setError,
    setUnauthenticated,
  } = useLoadingMachine();

  // ✅ Memoize context value with stable callbacks
  // Since all callbacks are now stable (useCallback with stable deps),
  // the context value only changes when state/computed properties change
  const contextValue = useMemo(() => ({
    state,
    stateHistory,
    isLoading,
    isError,
    isReady,
    isAuthenticated,
    startAuthenticating,
    startValidatingCache,
    startLoadingProfile,
    startLoadingPermissions,
    startInitializingData,
    startLoadingSection,
    setReady,
    setError,
    setUnauthenticated,
  }), [
    state,
    stateHistory,
    isLoading,
    isError,
    isReady,
    isAuthenticated,
    // Callbacks are stable, so they don't need to be in deps
    // but we include them for TypeScript safety
    startAuthenticating,
    startValidatingCache,
    startLoadingProfile,
    startLoadingPermissions,
    startInitializingData,
    startLoadingSection,
    setReady,
    setError,
    setUnauthenticated,
  ]);

  return (
    <LoadingStateContext.Provider value={contextValue}>
      {children}
    </LoadingStateContext.Provider>
  );
};

