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
   * Fetch emails from database
   */
  const fetchEmails = useCallback(async (accountId: string, folder: string = 'inbox') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('💾 Fetching', folder, 'emails from database...');
      
      const query = supabase
        .from('email_messages')
        .select('*')
        .eq('folder', folder);
      
      // Sort by appropriate date field
      if (folder === 'sent') {
        query.order('sent_at', { ascending: false });
      } else {
        query.order('received_at', { ascending: false });
      }
      
      query.limit(200);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setState({
        messages: data || [],
        loading: false,
        error: null,
      });
      
      console.log('✅ Loaded', data?.length || 0, folder, 'emails from database');
      return data;
    } catch (err: any) {
      console.error('❌ Error fetching emails:', err);
      setState(prev => ({ ...prev, error: err.message, loading: false }));
      throw err;
    }
  }, []);

  /**
   * Fetch emails LIVE from IMAP (HYBRID mode)
   * 
   * @param accountId - Email account ID
   * @param options - Fetch options
   *   - maxMessages: Number of recent messages to fetch (default: 200)
   *   - loadMore: Append to existing messages (pagination)
   */
  const syncEmails = useCallback(async (
    accountId: string, 
    options: { maxMessages?: number; loadMore?: boolean } = {}
  ) => {
    // Note: maxMessages and loadMore are no longer used by the backend function
    // but are kept for compatibility with the frontend component call.
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Calling backend to sync emails and store in cache...');

      // Call the correct 'imap-cache-sync' function
      const { data, error } = await supabase.functions.invoke('imap-cache-sync', {
        body: {
          accountId,
          fullSync: false // Use false for standard sync, true for a full history sync
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to invoke sync function.');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'The sync function reported a failure.');
      }

      console.log('✅ Backend sync successful:', data.message);

      // After a successful sync, re-fetch the emails from the database cache
      // to update the UI with the latest data.
      console.log('🔄 Re-fetching emails from local cache to update UI...');
      await fetchEmails(accountId, 'inbox');

      return data;
    } catch (err: any) {
      console.error('❌ Error during email synchronization:', err);
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

