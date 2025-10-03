import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EmailAccount {
  id: string;
  user_id: string;
  email_address: string;
  display_name: string | null;
  // SMTP configuration
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string; // Encrypted
  smtp_encryption: 'tls' | 'ssl' | 'none';
  // IMAP configuration
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string; // Encrypted
  imap_encryption: 'ssl' | 'tls' | 'none';
  // Status
  is_active: boolean;
  is_primary: boolean;
  sync_enabled: boolean;
  connection_status: 'unconfigured' | 'testing' | 'connected' | 'error';
  last_sync_at: string | null;
  last_synced_uid: number | null;
  last_error: string | null;
  last_error_at: string | null;
  created_at: string;
  updated_at: string;
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

  const syncAccount = useCallback(async (accountId: string, fullSync: boolean = false) => {
    try {
      // All accounts now use imap-sync (SMTP/IMAP based)
      const { data, error } = await supabase.functions.invoke('imap-sync', {
        body: {
          accountId,
          fullSync,
          maxMessages: fullSync ? 100 : 50,
        }
      });

      if (error) throw error;

      console.log('✅ Sync result:', data);
      await fetchAccounts(); // Refresh accounts to update last_sync_at
      
      return data;
    } catch (err: any) {
      console.error('❌ Error syncing email account:', err);
      throw err;
    }
  }, [fetchAccounts]);

  const testConnection = useCallback(async (config: {
    smtp: {
      host: string;
      port: number;
      username: string;
      password: string;
      encryption: 'tls' | 'ssl' | 'none';
    };
    imap: {
      host: string;
      port: number;
      username: string;
      password: string;
      encryption: 'ssl' | 'tls' | 'none';
    };
    testEmail?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('test-email-connection', {
        body: config
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      console.error('❌ Error testing connection:', err);
      throw err;
    }
  }, []);

  const sendEmail = useCallback(async (params: {
    accountId: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType?: string;
    }>;
    inReplyTo?: string;
    priority?: 'high' | 'normal' | 'low';
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('smtp-send', {
        body: params
      });

      if (error) throw error;

      console.log('✅ Email sent:', data);
      return data;
    } catch (err: any) {
      console.error('❌ Error sending email:', err);
      throw err;
    }
  }, []);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    syncAccount,
    testConnection,
    sendEmail,
  };
};
