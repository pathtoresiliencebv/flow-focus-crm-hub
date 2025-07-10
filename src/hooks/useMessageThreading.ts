import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface MessageThread {
  id: string;
  parentMessageId: string;
  title?: string;
  participants: string[];
  messageCount: number;
  lastActivity: string;
  isResolved: boolean;
  priority: 'low' | 'medium' | 'high';
  resolvedBy?: string;
  resolvedAt?: string;
}

interface ThreadMessage {
  id: string;
  threadId: string;
  content: string;
  senderId: string;
  createdAt: string;
  messageType: string;
  fileUrl?: string;
}

interface UseMessageThreadingReturn {
  threads: MessageThread[];
  currentThread: MessageThread | null;
  threadMessages: ThreadMessage[];
  isLoading: boolean;
  createThread: (messageId: string, title?: string) => Promise<string | null>;
  joinThread: (threadId: string) => Promise<void>;
  leaveThread: (threadId: string) => Promise<void>;
  resolveThread: (threadId: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
  sendThreadMessage: (threadId: string, content: string, type?: string) => Promise<void>;
  loadThread: (threadId: string) => Promise<void>;
  loadUserThreads: () => Promise<void>;
  updateThreadTitle: (threadId: string, title: string) => Promise<void>;
  updateThreadPriority: (threadId: string, priority: 'low' | 'medium' | 'high') => Promise<void>;
}

export const useMessageThreading = (): UseMessageThreadingReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [currentThread, setCurrentThread] = useState<MessageThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createThread = useCallback(async (messageId: string, title?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      setIsLoading(true);

      // First verify the message exists and user has access
      const { data: message, error: messageError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('id', messageId)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .single();

      if (messageError || !message) {
        toast({
          title: "Error",
          description: "Message not found or access denied",
          variant: "destructive"
        });
        return null;
      }

      // Create the thread
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          parent_message_id: messageId,
          title: title || `Thread from ${new Date().toLocaleDateString()}`,
          participants: [message.from_user_id, message.to_user_id],
          priority: 'medium'
        })
        .select()
        .single();

      if (threadError) {
        throw threadError;
      }

      toast({
        title: "Thread Created",
        description: "New message thread has been created successfully"
      });

      // Reload threads to update the list
      await loadUserThreads();

      return thread.id;

    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Error",
        description: "Failed to create thread",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const joinThread = useCallback(async (threadId: string): Promise<void> => {
    if (!user) return;

    try {
      // Add user to thread participants
      const { data: thread, error: fetchError } = await supabase
        .from('message_threads')
        .select('participants')
        .eq('id', threadId)
        .single();

      if (fetchError || !thread) {
        throw new Error('Thread not found');
      }

      const updatedParticipants = [...thread.participants];
      if (!updatedParticipants.includes(user.id)) {
        updatedParticipants.push(user.id);

        const { error: updateError } = await supabase
          .from('message_threads')
          .update({ participants: updatedParticipants })
          .eq('id', threadId);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Joined Thread",
          description: "You have joined the conversation thread"
        });

        await loadUserThreads();
      }

    } catch (error) {
      console.error('Error joining thread:', error);
      toast({
        title: "Error",
        description: "Failed to join thread",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const leaveThread = useCallback(async (threadId: string): Promise<void> => {
    if (!user) return;

    try {
      const { data: thread, error: fetchError } = await supabase
        .from('message_threads')
        .select('participants')
        .eq('id', threadId)
        .single();

      if (fetchError || !thread) {
        throw new Error('Thread not found');
      }

      const updatedParticipants = thread.participants.filter((id: string) => id !== user.id);

      const { error: updateError } = await supabase
        .from('message_threads')
        .update({ participants: updatedParticipants })
        .eq('id', threadId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Left Thread",
        description: "You have left the conversation thread"
      });

      await loadUserThreads();

    } catch (error) {
      console.error('Error leaving thread:', error);
      toast({
        title: "Error",
        description: "Failed to leave thread",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const resolveThread = useCallback(async (threadId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('message_threads')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', threadId);

      if (error) {
        throw error;
      }

      toast({
        title: "Thread Resolved",
        description: "The conversation thread has been marked as resolved"
      });

      await loadUserThreads();

    } catch (error) {
      console.error('Error resolving thread:', error);
      toast({
        title: "Error",
        description: "Failed to resolve thread",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const reopenThread = useCallback(async (threadId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('message_threads')
        .update({
          is_resolved: false,
          resolved_by: null,
          resolved_at: null
        })
        .eq('id', threadId);

      if (error) {
        throw error;
      }

      toast({
        title: "Thread Reopened",
        description: "The conversation thread has been reopened"
      });

      await loadUserThreads();

    } catch (error) {
      console.error('Error reopening thread:', error);
      toast({
        title: "Error",
        description: "Failed to reopen thread",
        variant: "destructive"
      });
    }
  }, [toast]);

  const sendThreadMessage = useCallback(async (threadId: string, content: string, type: string = 'text'): Promise<void> => {
    if (!user) return;

    try {
      // For now, we'll store thread messages in the direct_messages table with a reference
      // In a real implementation, you might want a separate thread_messages table
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: user.id, // Special case for thread messages
          content: `[THREAD:${threadId}] ${content}`,
          message_type: type,
          context_type: 'thread'
        });

      if (error) {
        throw error;
      }

      // Load updated thread messages
      await loadThread(threadId);

    } catch (error) {
      console.error('Error sending thread message:', error);
      toast({
        title: "Error",
        description: "Failed to send message to thread",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const loadThread = useCallback(async (threadId: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Load thread details
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (threadError) {
        throw threadError;
      }

      // Load thread messages (simplified - in reality you'd have a proper thread messages table)
      const { data: messages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .ilike('content', `[THREAD:${threadId}]%`)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      setCurrentThread({
        id: thread.id,
        parentMessageId: thread.parent_message_id,
        title: thread.title,
        participants: thread.participants || [],
        messageCount: messages?.length || 0,
        lastActivity: thread.created_at,
        isResolved: thread.is_resolved,
        priority: (thread.priority as 'low' | 'medium' | 'high') || 'medium',
        resolvedBy: thread.resolved_by,
        resolvedAt: thread.resolved_at
      });

      setThreadMessages(
        (messages || []).map(msg => ({
          id: msg.id,
          threadId,
          content: msg.content.replace(`[THREAD:${threadId}] `, ''),
          senderId: msg.from_user_id,
          createdAt: msg.created_at,
          messageType: msg.message_type || 'text',
          fileUrl: msg.file_url
        }))
      );

    } catch (error) {
      console.error('Error loading thread:', error);
      toast({
        title: "Error",
        description: "Failed to load thread",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadUserThreads = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data: userThreads, error } = await supabase
        .from('message_threads')
        .select('*')
        .contains('participants', [user.id])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setThreads(
        (userThreads || []).map(thread => ({
          id: thread.id,
          parentMessageId: thread.parent_message_id,
          title: thread.title,
          participants: thread.participants || [],
          messageCount: 0, // Would be calculated from thread messages
          lastActivity: thread.created_at,
          isResolved: thread.is_resolved,
          priority: (thread.priority as 'low' | 'medium' | 'high') || 'medium',
          resolvedBy: thread.resolved_by,
          resolvedAt: thread.resolved_at
        }))
      );

    } catch (error) {
      console.error('Error loading user threads:', error);
      toast({
        title: "Error",
        description: "Failed to load threads",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const updateThreadTitle = useCallback(async (threadId: string, title: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('message_threads')
        .update({ title })
        .eq('id', threadId);

      if (error) {
        throw error;
      }

      await loadUserThreads();

    } catch (error) {
      console.error('Error updating thread title:', error);
      toast({
        title: "Error",
        description: "Failed to update thread title",
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateThreadPriority = useCallback(async (threadId: string, priority: 'low' | 'medium' | 'high'): Promise<void> => {
    try {
      const { error } = await supabase
        .from('message_threads')
        .update({ priority })
        .eq('id', threadId);

      if (error) {
        throw error;
      }

      await loadUserThreads();

    } catch (error) {
      console.error('Error updating thread priority:', error);
      toast({
        title: "Error",
        description: "Failed to update thread priority",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    threads,
    currentThread,
    threadMessages,
    isLoading,
    createThread,
    joinThread,
    leaveThread,
    resolveThread,
    reopenThread,
    sendThreadMessage,
    loadThread,
    loadUserThreads,
    updateThreadTitle,
    updateThreadPriority
  };
};