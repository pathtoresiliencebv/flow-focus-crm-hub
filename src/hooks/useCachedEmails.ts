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
   * Fetch emails LIVE from IMAP (called on component mount)
   * For initial load - syncEmails() is called when user clicks refresh
   */
  const fetchEmails = useCallback(async (accountId: string, folder: string = 'inbox') => {
    // Don't auto-fetch on mount - user must click Synchroniseren
    // This prevents hammering the IMAP server
    console.log('📭 Ready to fetch emails - click Synchroniseren button');
    
    setState({
      messages: [],
      loading: false,
      error: null,
    });
    
    return [];
  }, []);

  /**
   * Fetch emails LIVE from IMAP (no database storage - pure Roundcube style)
   */
  const syncEmails = useCallback(async (accountId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Fetching emails LIVE from IMAP server...');

      // Use imap-sync for LIVE email fetching (no DB storage)
      const { data, error } = await supabase.functions.invoke('imap-sync', {
        body: {
          accountId,
          fullSync: false, // Laatste 200 emails
          maxMessages: 200,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch emails');
      }

      if (!data.success) {
        throw new Error(data.error || 'Fetch failed');
      }

      console.log('✅ Live emails fetched:', data);

      // Update state with LIVE messages (not from database)
      setState({
        messages: data.messages || [],
        loading: false,
        error: null,
      });

      return data;
    } catch (err: any) {
      console.error('❌ Error fetching live emails:', err);
      setState(prev => ({ ...prev, error: err.message, loading: false }));
      throw err;
    }
  }, []);

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

