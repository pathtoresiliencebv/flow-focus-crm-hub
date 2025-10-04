/**
 * Hook to fetch emails from Supabase cache (email_messages table)
 * 
 * Emails are synced from IMAP to database via imap-cache-sync Edge Function
 * This provides fast loading and offline access
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CachedEmail {
  id: string;
  subject: string;
  from_email: string;
  to_email: string[];
  body_text: string;
  body_html?: string;
  status: 'unread' | 'read' | 'archived' | 'sent' | 'draft' | 'failed';
  is_starred: boolean;
  folder: string;
  received_at: string;
  created_at: string;
  direction: 'inbound' | 'outbound';
}

interface UseCachedEmailsState {
  messages: CachedEmail[];
  loading: boolean;
  error: string | null;
}

export const useCachedEmails = () => {
  const [state, setState] = useState<UseCachedEmailsState>({
    messages: [],
    loading: false,
    error: null,
  });

  /**
   * Fetch emails from database cache
   */
  const fetchEmails = useCallback(async (accountId: string, folder: string = 'inbox') => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📥 Fetching cached emails from database...', { accountId, folder });

      // Query email_messages table
      const query = supabase
        .from('email_messages')
        .select('*')
        .eq('folder', folder)
        .order('received_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message || 'Failed to fetch emails from cache');
      }

      console.log('✅ Cached emails fetched:', { count: data?.length || 0 });

      setState({
        messages: (data as CachedEmail[]) || [],
        loading: false,
        error: null,
      });

      return data;
    } catch (err: any) {
      console.error('❌ Error fetching cached emails:', err);
      setState(prev => ({ ...prev, error: err.message, loading: false }));
      throw err;
    }
  }, []);

  /**
   * Sync emails from IMAP to database cache
   */
  const syncEmails = useCallback(async (accountId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Syncing emails from IMAP to cache...');

      // TEMP: Use debug version to get detailed logs
      const { data, error } = await supabase.functions.invoke('imap-cache-sync-debug', {
        body: {
          accountId,
          fullSync: true,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to sync emails');
      }

      if (!data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      console.log('✅ Email sync completed:', data);

      // Refresh emails from cache
      await fetchEmails(accountId);

      return data;
    } catch (err: any) {
      console.error('❌ Error syncing emails:', err);
      setState(prev => ({ ...prev, error: err.message, loading: false }));
      throw err;
    }
  }, [fetchEmails]);

  /**
   * Get all folders with message counts
   */
  const getFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_messages')
        .select('folder, status, is_starred');

      if (error) throw error;

      // Count messages per folder
      const folderCounts: Record<string, number> = {};
      const unreadCounts: Record<string, number> = {};
      let starredCount = 0;

      data?.forEach((msg: any) => {
        folderCounts[msg.folder] = (folderCounts[msg.folder] || 0) + 1;
        if (msg.status === 'unread') {
          unreadCounts[msg.folder] = (unreadCounts[msg.folder] || 0) + 1;
        }
        if (msg.is_starred) {
          starredCount++;
        }
      });

      return {
        folders: folderCounts,
        unread: unreadCounts,
        starred: starredCount,
      };
    } catch (err) {
      console.error('Error getting folder counts:', err);
      return { folders: {}, unread: {}, starred: 0 };
    }
  }, []);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    fetchEmails,
    syncEmails,
    getFolders,
  };
};

