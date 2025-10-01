import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmailThread {
  id: string;
  account_id: string;
  thread_id: string;
  subject: string | null;
  snippet: string | null;
  message_count: number;
  participants: Array<{ email: string; name: string }>;
  first_message_at: string | null;
  last_message_at: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_important: boolean;
  is_archived: boolean;
  labels: string[];
  folder: string;
  created_at: string;
  updated_at: string;
}

export const useEmailThreads = (accountId: string | null, folder: string = 'inbox') => {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!accountId) {
      setThreads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('email_threads')
        .select('*')
        .eq('account_id', accountId)
        .order('last_message_at', { ascending: false })
        .limit(50);

      // Filter by folder
      if (folder !== 'all') {
        query = query.eq('folder', folder);
      }

      // Special filters
      if (folder === 'starred') {
        query = query.eq('is_starred', true);
      } else if (folder === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setThreads(data || []);
    } catch (err: any) {
      console.error('Error fetching email threads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accountId, folder]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const markAsRead = useCallback(async (threadId: string, isRead: boolean = true) => {
    try {
      const { error } = await supabase
        .from('email_threads')
        .update({ is_read: isRead })
        .eq('id', threadId);

      if (error) throw error;

      setThreads(prev => prev.map(thread => 
        thread.id === threadId ? { ...thread, is_read: isRead } : thread
      ));
    } catch (err: any) {
      console.error('Error marking thread as read:', err);
      throw err;
    }
  }, []);

  const toggleStar = useCallback(async (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    try {
      const { error } = await supabase
        .from('email_threads')
        .update({ is_starred: !thread.is_starred })
        .eq('id', threadId);

      if (error) throw error;

      setThreads(prev => prev.map(t => 
        t.id === threadId ? { ...t, is_starred: !t.is_starred } : t
      ));
    } catch (err: any) {
      console.error('Error toggling star:', err);
      throw err;
    }
  }, [threads]);

  const archiveThread = useCallback(async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('email_threads')
        .update({ is_archived: true, folder: 'archive' })
        .eq('id', threadId);

      if (error) throw error;

      setThreads(prev => prev.filter(t => t.id !== threadId));
    } catch (err: any) {
      console.error('Error archiving thread:', err);
      throw err;
    }
  }, []);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('email_threads')
        .update({ folder: 'trash' })
        .eq('id', threadId);

      if (error) throw error;

      setThreads(prev => prev.filter(t => t.id !== threadId));
    } catch (err: any) {
      console.error('Error deleting thread:', err);
      throw err;
    }
  }, []);

  return {
    threads,
    loading,
    error,
    fetchThreads,
    markAsRead,
    toggleStar,
    archiveThread,
    deleteThread
  };
};

