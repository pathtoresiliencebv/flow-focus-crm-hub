import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NylasAccount {
  id: string;
  user_id: string;
  email_address: string;
  grant_id: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'imap';
  sync_state: 'initial' | 'syncing' | 'synced' | 'error';
  is_active: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseNylasAuthState {
  accounts: NylasAccount[];
  loading: boolean;
  error: string | null;
}

export const useNylasAuth = () => {
  const { user } = useAuth();
  const [state, setState] = useState<UseNylasAuthState>({
    accounts: [],
    loading: false,
    error: null,
  });

  /**
   * Fetch user's Nylas accounts
   */
  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, accounts: [], loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('nylas_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        accounts: data || [],
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      console.error('Error fetching Nylas accounts:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
    }
  }, [user]);

  /**
   * Initiate OAuth flow for a provider
   */
  const initiateOAuth = useCallback(async (provider: NylasAccount['provider'], email?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.functions.invoke('nylas-oauth-init', {
        body: { provider, email },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate OAuth');
      }

      // Open OAuth URL in new window/tab
      const authWindow = window.open(
        data.authUrl,
        'nylas-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setState(prev => ({ ...prev, loading: false }));
          // Refresh accounts after OAuth completion
          fetchAccounts();
        }
      }, 1000);

      return data;
    } catch (err: any) {
      console.error('OAuth initiation error:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, [fetchAccounts]);

  /**
   * Handle OAuth callback (called from OAuth popup)
   */
  const handleCallback = useCallback(async (code: string, state?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.functions.invoke('nylas-oauth-callback', {
        body: { code, state },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'OAuth callback failed');
      }

      console.log('✅ OAuth callback successful:', data.account);

      // Refresh accounts
      await fetchAccounts();

      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, [fetchAccounts]);

  /**
   * Disconnect a Nylas account
   */
  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Deactivate account in database
      const { error } = await supabase
        .from('nylas_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;

      // Refresh accounts
      await fetchAccounts();

      setState(prev => ({ ...prev, loading: false }));
    } catch (err: any) {
      console.error('Disconnect account error:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, [fetchAccounts]);

  /**
   * Get primary account (most recently added)
   */
  const getPrimaryAccount = useCallback((): NylasAccount | null => {
    return state.accounts.length > 0 ? state.accounts[0] : null;
  }, [state.accounts]);

  /**
   * Check if user has any connected accounts
   */
  const hasAccounts = useCallback((): boolean => {
    return state.accounts.length > 0;
  }, [state.accounts]);

  /**
   * Get accounts by provider
   */
  const getAccountsByProvider = useCallback((provider: NylasAccount['provider']): NylasAccount[] => {
    return state.accounts.filter(account => account.provider === provider);
  }, [state.accounts]);

  // Auto-fetch accounts when user changes
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    // State
    accounts: state.accounts,
    loading: state.loading,
    error: state.error,

    // Actions
    fetchAccounts,
    initiateOAuth,
    handleCallback,
    disconnectAccount,

    // Helpers
    getPrimaryAccount,
    hasAccounts,
    getAccountsByProvider,
  };
};


