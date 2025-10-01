import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EmailAccount {
  id: string;
  user_id: string;
  provider: 'gmail' | 'outlook' | 'imap' | 'smtp';
  email: string;
  email_address?: string;
  display_name: string | null;
  is_active: boolean;
  is_primary: boolean;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_synced_at?: string | null;
  created_at: string;
}

export const useEmailAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAccounts(data || []);
    } catch (err: any) {
      console.error('Error fetching email accounts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = useCallback(async (accountData: Partial<EmailAccount>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .insert({
          ...accountData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      console.error('Error adding email account:', err);
      throw err;
    }
  }, [user]);

  const updateAccount = useCallback(async (accountId: string, updates: Partial<EmailAccount>) => {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .update(updates)
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => prev.map(acc => acc.id === accountId ? data : acc));
      return data;
    } catch (err: any) {
      console.error('Error updating email account:', err);
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (err: any) {
      console.error('Error deleting email account:', err);
      throw err;
    }
  }, []);

  const syncAccount = useCallback(async (accountId: string) => {
    try {
      // Get account to determine provider
      const account = accounts.find(a => a.id === accountId);
      if (!account) throw new Error('Account not found');

      const functionName = account.provider === 'smtp' ? 'imap-sync' : 'gmail-sync';
      const body = account.provider === 'smtp' 
        ? { accountId }
        : { accountId, maxResults: 50, fullSync: false };
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;

      console.log('Sync result:', data);
      await fetchAccounts(); // Refresh accounts to update last_sync_at
      
      return data;
    } catch (err: any) {
      console.error('Error syncing email account:', err);
      throw err;
    }
  }, [fetchAccounts, accounts]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    syncAccount
  };
};
