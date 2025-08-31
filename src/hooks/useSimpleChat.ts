import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DirectMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
  };
  // Add other fields that might exist in the database
  [key: string]: any;
}

export interface ChatUser {
  id: string;
  full_name: string;
  role: string;
  is_online?: boolean;
}

export interface Conversation {
  id: string;
  other_user: ChatUser;
  last_message?: DirectMessage;
  unread_count: number;
}

export const useSimpleChat = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available users based on role
  const fetchAvailableUsers = useCallback(async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase.rpc('get_available_chat_users', {
        current_user_id: user.id
      });

      if (error) {
        console.error('Error fetching available users:', error);
        return;
      }

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  }, [user, profile]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_from_user_id_fkey(id, full_name)
        `)
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages((data || []) as unknown as DirectMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, toUserId: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          content: content.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Refresh messages
      await fetchMessages(toUserId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [user, fetchMessages]);

  // Generate conversations from available users
  const generateConversations = useCallback(async () => {
    if (!user || availableUsers.length === 0) return;

    try {
      const conversationList: Conversation[] = [];

      for (const chatUser of availableUsers) {
        // Get last message
        const { data: lastMessageData } = await supabase
          .from('direct_messages')
          .select(`
            *,
            sender:profiles!direct_messages_from_user_id_fkey(id, full_name)
          `)
          .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${chatUser.id}),and(from_user_id.eq.${chatUser.id},to_user_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages (messages from other user that are newer than last seen)
        const { count: unreadCount } = await supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('from_user_id', chatUser.id)
          .eq('to_user_id', user.id);

        conversationList.push({
          id: chatUser.id,
          other_user: chatUser,
          last_message: (lastMessageData as unknown as DirectMessage) || undefined,
          unread_count: unreadCount || 0
        });
      }

      // Sort by last message time
      conversationList.sort((a, b) => {
        const aTime = a.last_message?.created_at || '0';
        const bTime = b.last_message?.created_at || '0';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(conversationList);
    } catch (error) {
      console.error('Error generating conversations:', error);
    }
  }, [user, availableUsers]);

  // Select a conversation
  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
  }, [fetchMessages]);

  // Initialize
  useEffect(() => {
    if (user && profile) {
      fetchAvailableUsers();
    }
  }, [user, profile, fetchAvailableUsers]);

  useEffect(() => {
    if (availableUsers.length > 0) {
      generateConversations().finally(() => setLoading(false));
    }
  }, [availableUsers, generateConversations]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('direct_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(from_user_id.eq.${user.id},to_user_id.eq.${user.id})`
        },
        (payload) => {
          console.log('New message received:', payload);
          
          // If message is for current conversation, refresh messages
          if (selectedConversation && 
              (payload.new.from_user_id === selectedConversation || 
               payload.new.to_user_id === selectedConversation)) {
            fetchMessages(selectedConversation);
          }
          
          // Refresh conversations
          generateConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, selectedConversation, fetchMessages, generateConversations]);

  return {
    conversations,
    selectedConversation,
    messages,
    availableUsers,
    loading,
    selectConversation,
    sendMessage,
    fetchMessages
  };
};