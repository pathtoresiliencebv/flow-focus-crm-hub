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
    const { maxMessages = 200, loadMore = false } = options;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Fetching emails LIVE from IMAP server...', { maxMessages, loadMore });

      // Try OX Mail sync first, fallback to IMAP if it fails
      console.log('📧 Calling ox-mail-sync with:', { accountId, maxMessages });
      
      let data, error;
      
      try {
        const oxResponse = await supabase.functions.invoke('ox-mail-sync', {
          body: {
            accountId,
            maxMessages,
          }
        });
        
        data = oxResponse.data;
        error = oxResponse.error;
        
        console.log('📧 OX response:', { data, error });
        
        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || 'OX Mail sync failed');
        }
      } catch (oxError: any) {
        console.warn('⚠️ OX Mail sync failed, falling back to IMAP:', oxError.message);
        
        // Fallback to IMAP sync
        const imapResponse = await supabase.functions.invoke('imap-sync', {
          body: {
            accountId,
            maxMessages,
          }
        });
        
        data = imapResponse.data;
        error = imapResponse.error;
        
        console.log('📧 IMAP fallback response:', { data, error });
        
        if (error) {
          throw new Error(error.message || 'Failed to fetch emails');
        }

        if (!data.success) {
          throw new Error(data.error || 'Fetch failed');
        }
      }

      console.log('✅ Live emails fetched:', data);

      // Save to database for persistence (delete/star must work!)
      if (data.messages && data.messages.length > 0) {
        console.log('💾 Saving', data.messages.length, 'emails to database...');
        
        const { data: userData } = await supabase.auth.getUser();
        
        const messagesToSave = data.messages.map((m: any) => ({
          id: m.id || crypto.randomUUID(), // Use existing ID or generate new one
          user_id: userData.user?.id,
          direction: 'inbound',
          from_email: m.from_email || 'unknown',
          to_email: Array.isArray(m.to_email) ? m.to_email : [m.to_email || ''],
          subject: m.subject || '(Geen onderwerp)',
          body_text: m.body_text || '',
          body_html: m.body_html || null,
          attachments: m.attachments || [],
          status: m.status || 'unread',
          is_starred: m.is_starred || false,
          folder: 'inbox',
          received_at: m.received_at || m.date || new Date().toISOString(),
          external_message_id: m.external_message_id || m.uid,
        }));
        
        const { error: upsertError } = await supabase.from('email_messages').upsert(messagesToSave, {
          onConflict: 'external_message_id',
        });
        
        if (upsertError) {
          console.error('❌ Error saving emails to database:', upsertError);
          throw upsertError;
        }
      }

      // Sort by date DESC (newest first)
      const sortedMessages = (data.messages || []).sort((a: any, b: any) => {
        const dateA = new Date(a.received_at || a.date).getTime();
        const dateB = new Date(b.received_at || b.date).getTime();
        return dateB - dateA;
      });

      setState(prev => ({
        messages: loadMore 
          ? [...prev.messages, ...sortedMessages]
          : sortedMessages,
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

