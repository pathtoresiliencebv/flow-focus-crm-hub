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
   * Fetch emails from database or IMAP depending on folder
   * 
   * @param accountId - Email account ID
   * @param folder - Folder name (inbox, sent, drafts, etc.)
   */
  const fetchEmails = useCallback(async (accountId: string, folder: string = 'inbox') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // For SENT/DRAFTS/ARCHIVE folders: fetch from database
      if (folder === 'sent' || folder === 'drafts' || folder === 'archive' || folder === 'trash') {
        console.log('💾 Fetching', folder, 'emails from database...');
        
        const { data, error } = await supabase
          .from('email_messages')
          .select('*')
          .eq('folder', folder)
          .order('sent_at', { ascending: false });
        
        if (error) throw error;
        
        setState({
          messages: data || [],
          loading: false,
          error: null,
        });
        
        console.log('✅ Loaded', data?.length || 0, 'emails from database');
        return data;
      }
      
      // For INBOX: Don't auto-fetch - user must click Synchroniseren
      console.log('📭 Inbox ready - click Synchroniseren to load emails');
      setState({
        messages: [],
        loading: false,
        error: null,
      });
      
      return [];
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
    const { maxMessages = 200, loadMore = false } = options;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Fetching emails LIVE from IMAP server...', { maxMessages, loadMore });

      // Use imap-sync for LIVE email fetching
      const { data, error } = await supabase.functions.invoke('imap-sync', {
        body: {
          accountId,
          fullSync: false,
          maxMessages,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch emails');
      }

      if (!data.success) {
        throw new Error(data.error || 'Fetch failed');
      }

      console.log('✅ Live emails fetched:', data);

      // HYBRID: Save SENT emails to database for history
      const sentMessages = (data.messages || []).filter((m: any) => 
        m.folder === 'sent' || m.status === 'sent'
      );
      
      if (sentMessages.length > 0) {
        console.log('💾 Saving', sentMessages.length, 'sent emails to database...');
        await supabase.from('email_messages').upsert(sentMessages, {
          onConflict: 'external_message_id',
        });
      }

      // Update state (append if loadMore, replace otherwise)
      setState(prev => ({
        messages: loadMore 
          ? [...prev.messages, ...(data.messages || [])]
          : data.messages || [],
        loading: false,
        error: null,
      }));

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

