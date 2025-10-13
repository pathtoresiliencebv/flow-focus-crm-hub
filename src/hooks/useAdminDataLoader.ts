import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LoadingState {
  customers: boolean;
  projects: boolean;
  planning: boolean;
  timeRegistration: boolean;
  receipts: boolean;
  quotes: boolean;
  personnel: boolean;
  users: boolean;
  settings: boolean;
  email: boolean;
  chat: boolean;
}

interface LoadingErrors {
  customers?: string;
  projects?: string;
  planning?: string;
  timeRegistration?: string;
  receipts?: string;
  quotes?: string;
  personnel?: string;
  users?: string;
  settings?: string;
  email?: string;
  chat?: string;
}

export const useAdminDataLoader = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    customers: false,
    projects: false,
    planning: false,
    timeRegistration: false,
    receipts: false,
    quotes: false,
    personnel: false,
    users: false,
    settings: false,
    email: false,
    chat: false,
  });
  
  const [errors, setErrors] = useState<LoadingErrors>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user is Administrator
  const isAdmin = profile?.role === 'Administrator';

  // Generic data loader with error handling
  const loadData = useCallback(async (
    section: keyof LoadingState,
    queryFn: () => Promise<any>
  ) => {
    if (!isAdmin) return;

    try {
      setLoadingState(prev => ({ ...prev, [section]: true }));
      setErrors(prev => ({ ...prev, [section]: undefined }));
      
      const result = await queryFn();
      
      setLoadingState(prev => ({ ...prev, [section]: false }));
      return result;
    } catch (error: any) {
      console.error(`Error loading ${section}:`, error);
      
      const errorMessage = error?.message || `Kon ${section} niet laden`;
      setErrors(prev => ({ ...prev, [section]: errorMessage }));
      setLoadingState(prev => ({ ...prev, [section]: false }));
      
      // Show toast for critical errors
      if (error?.code === 'PGRST301' || error?.code === '42501') {
        toast({
          title: "Toegang geweigerd",
          description: `Geen toegang tot ${section}. Controleer uw rechten.`,
          variant: "destructive",
        });
      }
      
      throw error; // Re-throw to be caught by error boundary
    }
  }, [isAdmin, toast]);

  // Load customers with proper error handling
  const loadCustomers = useCallback(async () => {
    await loadData('customers', async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    });
  }, [loadData]);

  // Load projects with proper error handling
  const loadProjects = useCallback(async () => {
    await loadData('projects', async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers:customer_id (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    });
  }, [loadData]);

  // Load planning with proper error handling
  const loadPlanning = useCallback(async () => {
    await loadData('planning', async () => {
      const { data, error } = await supabase
        .from('planning_items')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data;
    });
  }, [loadData]);

  // Load receipts with proper error handling
  const loadReceipts = useCallback(async () => {
    await loadData('receipts', async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    });
  }, [loadData]);

  // Load quotes with proper error handling
  const loadQuotes = useCallback(async () => {
    await loadData('quotes', async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    });
  }, [loadData]);

  // Load users with proper error handling
  const loadUsers = useCallback(async () => {
    await loadData('users', async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) {
          console.warn('Error loading users:', error);
          // Return empty array instead of throwing error
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('Exception loading users:', err);
        return [];
      }
    });
  }, [loadData]);

  // Load personnel with proper error handling
  const loadPersonnel = useCallback(async () => {
    await loadData('personnel', async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['Installateur', 'Verkoper', 'Administratie'])
          .order('updated_at', { ascending: false });
        
        if (error) {
          console.warn('Error loading personnel:', error);
          // Return empty array instead of throwing error
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('Exception loading personnel:', err);
        return [];
      }
    });
  }, [loadData]);

  // Load time registration with proper error handling
  const loadTimeRegistration = useCallback(async () => {
    await loadData('timeRegistration', async () => {
      const { data, error } = await supabase
        .from('work_time_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    });
  }, [loadData]);

  // Load settings with proper error handling
  const loadSettings = useCallback(async () => {
    await loadData('settings', async () => {
      // Settings table doesn't exist, return empty array
      return [];
    });
  }, [loadData]);

  // Load email with proper error handling
  const loadEmail = useCallback(async () => {
    await loadData('email', async () => {
      // For email, we might not need to load specific data
      // or we could load email accounts/settings
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // Table doesn't exist is OK
        throw error;
      }
      return data || [];
    });
  }, [loadData]);

  // Load chat with proper error handling
  const loadChat = useCallback(async () => {
    await loadData('chat', async () => {
      // For chat, we'll just return a simple success response
      // since the chat functionality works through the main chat components
      // and doesn't need complex admin data loading
      return {
        channels: [],
        participants: [],
        status: 'loaded'
      };
    });
  }, [loadData]);

  // Initialize all data loading
  const initializeData = useCallback(async () => {
    if (!profile || !isAdmin || isInitialized) return;

    // ℹ️ NOTE: We don't notify the global loading machine here
    // Admin data initialization is a BACKGROUND process that happens AFTER auth is ready
    // It should NOT block the entire app with a global loading state
    console.log('🔄 DATA LOADER: Initializing admin data in background...');
    const startTime = Date.now();
    
    try {
      const results = await Promise.allSettled([
        loadCustomers(),
        loadProjects(),
        loadPlanning(),
        loadReceipts(),
        loadQuotes(),
        loadUsers(),
        loadPersonnel(),
        loadTimeRegistration(),
        loadSettings(),
        loadEmail(),
        loadChat(),
      ]);
      
      // Log which sections loaded successfully and which failed
      const sections = ['customers', 'projects', 'planning', 'receipts', 'quotes', 'users', 'personnel', 'timeRegistration', 'settings', 'email', 'chat'];
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedSections = results
        .map((r, i) => r.status === 'rejected' ? sections[i] : null)
        .filter(Boolean);
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ DATA LOADER: Initialization completed in ${elapsed}ms`);
      console.log(`📊 DATA LOADER: ${successCount}/${results.length} sections loaded successfully`);
      if (failedSections.length > 0) {
        console.warn(`⚠️ DATA LOADER: Failed sections:`, failedSections);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ DATA LOADER: Critical error during initialization:', error);
      // Still mark as initialized to prevent infinite loop
      setIsInitialized(true);
    }
  }, [profile, isAdmin, isInitialized, loadCustomers, loadProjects, loadPlanning, loadReceipts, loadQuotes, loadUsers, loadPersonnel, loadTimeRegistration, loadSettings, loadEmail, loadChat]);

  // Auto-initialize when admin is ready with timeout fallback
  useEffect(() => {
    // Only initialize when we have profile AND user is admin
    if (!profile) {
      console.log('⏳ DATA LOADER: Waiting for profile to load...');
      return;
    }
    
    if (!isAdmin) {
      console.log('👤 DATA LOADER: Non-admin user, skipping data initialization');
      setIsInitialized(true); // Mark as initialized for non-admins
      return;
    }
    
    if (isInitialized) {
      console.log('✅ DATA LOADER: Already initialized');
      return;
    }
    
    if (!user) {
      console.log('⚠️ DATA LOADER: No user session, waiting...');
      return;
    }

    console.log('🚀 DATA LOADER: Starting data initialization for Administrator...');
    console.log('📊 DATA LOADER STATE:', {
      hasProfile: !!profile,
      isAdmin,
      hasUser: !!user,
      isInitialized
    });
    
    // Set timeout to prevent infinite loading - force completion after 10 seconds
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.error('⚠️ DATA LOADER: Initialization timeout after 10s, forcing completion');
        console.log('📊 DATA LOADER: Final state on timeout:', {
          hasProfile: !!profile,
          hasUser: !!user,
          loadingState
        });
        setIsInitialized(true);
        // Clear any stuck loading states
        setLoadingState({
          customers: false,
          projects: false,
          planning: false,
          timeRegistration: false,
          receipts: false,
          quotes: false,
          personnel: false,
          users: false,
          settings: false,
          email: false,
          chat: false,
        });
      }
    }, 10000); // 10 second timeout
    
    initializeData();
    
    return () => clearTimeout(timeoutId);
  }, [profile, isAdmin, user, isInitialized, initializeData]);

  // Get error message for a specific section
  const getErrorMessage = (section: keyof LoadingState): string | undefined => {
    return errors[section];
  };

  // Check if a section is loading
  const isLoading = (section: keyof LoadingState): boolean => {
    return loadingState[section];
  };

  // Check if any section has errors
  const hasErrors = (): boolean => {
    return Object.values(errors).some(error => error !== undefined);
  };

  // Get all error messages
  const getAllErrors = (): LoadingErrors => {
    return { ...errors };
  };

  return {
    loadingState,
    errors,
    isInitialized,
    isAdmin,
    loadCustomers,
    loadProjects,
    loadPlanning,
    loadReceipts,
    loadQuotes,
    loadUsers,
    loadPersonnel,
    loadTimeRegistration,
    loadSettings,
    loadEmail,
    loadChat,
    initializeData,
    getErrorMessage,
    isLoading,
    hasErrors,
    getAllErrors,
  };
};
