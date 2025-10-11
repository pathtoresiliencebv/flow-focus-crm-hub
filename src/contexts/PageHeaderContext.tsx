import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

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
  
  // Use refs to track if we're in a render cycle to prevent loops
  const isSettingHeaderRef = useRef(false);
  const renderCountRef = useRef(0);

  // ✅ Wrap setters in useCallback for stable references
  const setTitle = useCallback((newTitle: string) => {
    if (isSettingHeaderRef.current) {
      console.warn('⚠️ Preventing header update during render cycle');
      return;
    }
    setTitleState(newTitle);
  }, []);

  const setActions = useCallback((newActions: ReactNode) => {
    if (isSettingHeaderRef.current) {
      console.warn('⚠️ Preventing actions update during render cycle');
      return;
    }
    setActionsState(newActions);
  }, []);

  // Track render cycles to detect loops
  useEffect(() => {
    renderCountRef.current += 1;
    if (renderCountRef.current > 50) {
      console.error('🚨 INFINITE LOOP DETECTED in PageHeaderContext!');
      console.error('Render count:', renderCountRef.current);
    }
    
    // Reset counter after a delay
    const timer = setTimeout(() => {
      renderCountRef.current = 0;
    }, 1000);
    
    return () => clearTimeout(timer);
  });

  // ✅ Create stable context value - NEVER changes unless title/actions actually change
  const value = React.useMemo(() => ({
    title,
    setTitle,
    actions,
    setActions
  }), [title, actions, setTitle, setActions]);

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
