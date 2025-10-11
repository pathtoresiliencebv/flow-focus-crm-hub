import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface PageHeaderContextType {
  title: string;
  setTitle: (title: string) => void;
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState('');
  const [actions, setActionsState] = useState<ReactNode>(null);

  // ✅ Wrap setters in useCallback for stable references
  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
  }, []);

  const setActions = useCallback((newActions: ReactNode) => {
    setActionsState(newActions);
  }, []);

  // ✅ Memoize context value to prevent unnecessary re-renders
  // Note: setTitle and setActions are stable (useCallback with []), so only title and actions should trigger updates
  const value = useMemo(() => ({
    title,
    setTitle,
    actions,
    setActions
  }), [title, actions]); // Removed setTitle and setActions - they're stable

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error('usePageHeader must be used within PageHeaderProvider');
  }
  return context;
}

