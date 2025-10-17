import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NylasMessage {
  id: string;
  nylas_account_id: string;
  nylas_message_id: string;
  thread_id: string | null;
  from_email: string;
  from_name: string | null;
  to_emails: Array<{ email: string; name?: string }>;
  cc_emails: Array<{ email: string; name?: string }>;
  bcc_emails: Array<{ email: string; name?: string }>;
  subject: string;
  body_text: string;
  body_html: string | null;
  received_at: string;
  sent_at: string | null;
  is_read: boolean;
  is_starred: boolean;
  labels: string[];
  folder: string;
  has_attachments: boolean;
  attachments: Array<{
    id: string;
    filename: string;
    content_type: string;
    size: number;
  }>;
  in_reply_to: string | null;
  references: string | null;
  message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NylasThread {
  id: string;
  nylas_account_id: string;
  nylas_thread_id: string;
  subject: string;
  participants: Array<{ email: string; name?: string }>;
  message_count: number;
  last_message_at: string;
  is_read: boolean;
  is_starred: boolean;
  labels: string[];
  created_at: string;
  updated_at: string;
}

interface UseNylasMessagesState {
  messages: NylasMessage[];
  threads: NylasThread[];
  loading: boolean;
  error: string | null;
}

export const useNylasMessages = () => {
  const [state, setState] = useState<UseNylasMessagesState>({
    messages: [],
    threads: [],
    loading: false,
    error: null,
  });

  /**
   * Fetch messages from database
   */
  const fetchMessages = useCallback(async (
    accountId: string, 
    folder: string = 'inbox',
    options: { limit?: number; offset?: number } = {}
  ) => {
    const { limit = 100, offset = 0 } = options;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('💾 Fetching messages from database:', { accountId, folder, limit, offset });

      const query = supabase
        .from('nylas_messages')
        .select('*')
        .eq('nylas_account_id', accountId)
        .eq('folder', folder)
        .order('received_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      setState(prev => ({
        ...prev,
        messages: data || [],
        loading: false,
        error: null,
      }));

      console.log('✅ Loaded', data?.length || 0, 'messages from database');
      return data;
    } catch (err: any) {
      console.error('❌ Error fetching messages:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, []);

  /**
   * Sync messages from Nylas API
   */
  const syncMessages = useCallback(async (
    accountId: string,
    options: { fullSync?: boolean; maxMessages?: number } = {}
  ) => {
    const { fullSync = false, maxMessages = 100 } = options;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Syncing messages from Nylas API:', { accountId, fullSync, maxMessages });

      const { data, error } = await supabase.functions.invoke('nylas-sync-messages', {
        body: { accountId, fullSync, maxMessages },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Message sync failed');
      }

      console.log('✅ Messages synced:', data);

      // Refresh messages from database
      await fetchMessages(accountId, 'inbox');

      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (err: any) {
      console.error('❌ Error syncing messages:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, [fetchMessages]);

  /**
   * Send message via Nylas
   */
  const sendMessage = useCallback(async (params: {
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
    references?: string;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📤 Sending message via Nylas:', {
        accountId: params.accountId,
        to: params.to,
        subject: params.subject,
      });

      const { data, error } = await supabase.functions.invoke('nylas-send-message', {
        body: params,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      console.log('✅ Message sent successfully:', data);

      // Refresh messages to show sent message
      await fetchMessages(params.accountId, 'sent');

      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (err: any) {
      console.error('❌ Error sending message:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, [fetchMessages]);

  /**
   * Mark message as read/unread
   */
  const markAsRead = useCallback(async (messageId: string, isRead: boolean = true) => {
    try {
      const { error } = await supabase
        .from('nylas_messages')
        .update({ is_read: isRead })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: isRead } : msg
        ),
      }));

      console.log('✅ Message marked as', isRead ? 'read' : 'unread');
    } catch (err: any) {
      console.error('❌ Error marking message as read:', err);
      throw err;
    }
  }, []);

  /**
   * Toggle star on message
   */
  const starMessage = useCallback(async (messageId: string, isStarred: boolean) => {
    try {
      const { error } = await supabase
        .from('nylas_messages')
        .update({ is_starred: isStarred })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId ? { ...msg, is_starred: isStarred } : msg
        ),
      }));

      console.log('✅ Message', isStarred ? 'starred' : 'unstarred');
    } catch (err: any) {
      console.error('❌ Error starring message:', err);
      throw err;
    }
  }, []);

  /**
   * Delete message (move to trash)
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('nylas_messages')
        .update({ folder: 'trash' })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId ? { ...msg, folder: 'trash' } : msg
        ),
      }));

      console.log('✅ Message moved to trash');
    } catch (err: any) {
      console.error('❌ Error deleting message:', err);
      throw err;
    }
  }, []);

  /**
   * Search messages
   */
  const searchMessages = useCallback(async (
    accountId: string,
    query: string,
    folder?: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 Searching messages:', { accountId, query, folder });

      let searchQuery = supabase
        .from('nylas_messages')
        .select('*')
        .eq('nylas_account_id', accountId)
        .or(`subject.ilike.%${query}%,body_text.ilike.%${query}%,from_email.ilike.%${query}%`);

      if (folder) {
        searchQuery = searchQuery.eq('folder', folder);
      }

      const { data, error } = await searchQuery
        .order('received_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        messages: data || [],
        loading: false,
        error: null,
      }));

      console.log('✅ Found', data?.length || 0, 'matching messages');
      return data;
    } catch (err: any) {
      console.error('❌ Error searching messages:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, []);

  /**
   * Get folder counts
   */
  const getFolderCounts = useCallback(async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('nylas_messages')
        .select('folder, is_read')
        .eq('nylas_account_id', accountId);

      if (error) throw error;

      const counts: Record<string, { total: number; unread: number }> = {};

      data?.forEach((msg: any) => {
        const folder = msg.folder || 'inbox';
        if (!counts[folder]) {
          counts[folder] = { total: 0, unread: 0 };
        }
        counts[folder].total++;
        if (!msg.is_read) {
          counts[folder].unread++;
        }
      });

      return counts;
    } catch (err: any) {
      console.error('❌ Error getting folder counts:', err);
      return {};
    }
  }, []);

  /**
   * Get threads for account
   */
  const fetchThreads = useCallback(async (accountId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('nylas_threads')
        .select('*')
        .eq('nylas_account_id', accountId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        threads: data || [],
        loading: false,
        error: null,
      }));

      return data;
    } catch (err: any) {
      console.error('❌ Error fetching threads:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, []);

  return {
    // State
    messages: state.messages,
    threads: state.threads,
    loading: state.loading,
    error: state.error,

    // Actions
    fetchMessages,
    syncMessages,
    sendMessage,
    markAsRead,
    starMessage,
    deleteMessage,
    searchMessages,
    getFolderCounts,
    fetchThreads,
  };
};



