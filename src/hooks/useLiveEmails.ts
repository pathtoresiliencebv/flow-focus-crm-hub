/**
 * useLiveEmails Hook
 * 
 * Manages LIVE email fetching from IMAP server (Roundcube-style)
 * Does NOT use database - fetches emails directly on demand
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveEmail {
  uid: number;
  flags: string[];
  from: string;
  subject: string;
  date: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
}

export interface LiveEmailState {
  messages: LiveEmail[];
  loading: boolean;
  error: string | null;
  lastFetchAt: string | null;
  messageCount: number;
}

export const useLiveEmails = () => {
  const [state, setState] = useState<LiveEmailState>({
    messages: [],
    loading: false,
    error: null,
    lastFetchAt: null,
    messageCount: 0,
  });

  /**
   * Fetch emails directly from IMAP server
   */
  const fetchEmails = useCallback(async (accountId: string, options?: {
    fullSync?: boolean;
    maxMessages?: number;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📥 Fetching LIVE emails from IMAP...', { accountId, options });

      const { data, error } = await supabase.functions.invoke('imap-sync', {
        body: {
          accountId,
          fullSync: options?.fullSync ?? false,
          maxMessages: options?.maxMessages ?? 200,  // ✅ Fetch laatste 200 emails
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch emails');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Sync failed');
      }

      console.log('✅ LIVE emails fetched:', {
        messageCount: data.messageCount,
        messages: data.messages?.length,
      });

      setState({
        messages: data.messages || [],
        loading: false,
        error: null,
        lastFetchAt: new Date().toISOString(),
        messageCount: data.messageCount || 0,
      });

      return data;
    } catch (err: any) {
      console.error('❌ Error fetching LIVE emails:', err);
      
      const errorMessage = err.message || 'Failed to fetch emails';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      throw err;
    }
  }, []);

  /**
   * Refresh emails (re-fetch from IMAP)
   */
  const refresh = useCallback(async (accountId: string) => {
    return await fetchEmails(accountId, { fullSync: false });
  }, [fetchEmails]);

  /**
   * Clear current messages
   */
  const clear = useCallback(() => {
    setState({
      messages: [],
      loading: false,
      error: null,
      lastFetchAt: null,
      messageCount: 0,
    });
  }, []);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    lastFetchAt: state.lastFetchAt,
    messageCount: state.messageCount,
    fetchEmails,
    refresh,
    clear,
  };
};

