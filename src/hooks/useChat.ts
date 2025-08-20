import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ChatUser {
  id: string;
  full_name?: string;
  role?: string;
  is_online?: boolean;
}

export interface ChatMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    full_name?: string;
    role?: string;
  };
}

// Simplified chat hook that only uses direct_messages table
export const useChat = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Load available users for chat based on role
  const loadAvailableUsers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_available_chat_users', { current_user_id: user.id });

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading available users:', error);
      toast({
        title: "Fout",
        description: "Kon gebruikers niet laden",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (otherUserId: string) => {
    if (!user || !otherUserId) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!from_user_id(id, full_name, role)
        `)
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const formattedMessages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        from_user_id: msg.from_user_id,
        to_user_id: msg.to_user_id,
        content: msg.content,
        created_at: msg.created_at,
        sender: Array.isArray(msg.sender) && msg.sender.length > 0 ? msg.sender[0] : {
          id: msg.from_user_id,
          full_name: 'Unknown User',
          role: 'Bekijker'
        }
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Fout",
        description: "Kon berichten niet laden",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Send a message
  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: receiverId,
          content: content.trim(),
        });

      if (error) throw error;

      // Reload messages to show the new message
      await loadMessages(receiverId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive",
      });
    }
  }, [user, toast, loadMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const messageSubscription = supabase
      .channel('direct-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Only update if this message is relevant to current conversation
          if (selectedUserId && 
              ((newMessage.from_user_id === user.id && newMessage.to_user_id === selectedUserId) ||
               (newMessage.from_user_id === selectedUserId && newMessage.to_user_id === user.id))) {
            loadMessages(selectedUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [user, selectedUserId, loadMessages]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadAvailableUsers().finally(() => setLoading(false));
    }
  }, [user, loadAvailableUsers]);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId, loadMessages]);

  return {
    conversations,
    messages,
    loading,
    selectedUserId,
    setSelectedUserId,
    sendMessage,
    loadAvailableUsers,
  };
};