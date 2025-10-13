import { createContext, useContext, ReactNode } from 'react';
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
  const loadingMachine = useLoadingMachine();

  return (
    <LoadingStateContext.Provider value={loadingMachine}>
      {children}
    </LoadingStateContext.Provider>
  );
};

