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

    console.log('Fetching messages between:', user.id, 'and:', otherUserId);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_from_user_id_fkey(id, full_name)
        `)
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100); // Add pagination limit

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      console.log('Fetched messages:', data?.length || 0, 'messages');
      setMessages((data || []) as unknown as DirectMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, toUserId: string) => {
    if (!user || !content.trim()) return;

    const messageContent = content.trim();
    console.log('Sending message to user:', toUserId, 'Content:', messageContent);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          content: messageContent
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);
      
      // Optimistically add the message to current conversation
      if (selectedConversation === toUserId) {
        const optimisticMessage: DirectMessage = {
          ...data,
          sender: {
            id: user.id,
            full_name: profile?.full_name || 'You'
          }
        };
        
        setMessages(prevMessages => {
          const exists = prevMessages.find(m => m.id === optimisticMessage.id);
          if (exists) return prevMessages;
          
          return [...prevMessages, optimisticMessage].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Could add toast notification here for user feedback
    }
  }, [user, profile, selectedConversation]);

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
      console.log('Initializing chat for user:', user.id, 'Role:', profile.role);
      fetchAvailableUsers();
    }
  }, [user, profile, fetchAvailableUsers]);

  useEffect(() => {
    if (availableUsers.length > 0) {
      console.log('Available chat users:', availableUsers.length);
      generateConversations().finally(() => setLoading(false));
    } else if (user && profile && !loading) {
      // If no available users but we're authenticated, still stop loading
      console.log('No available chat users for role:', profile.role);
      setLoading(false);
    }
  }, [availableUsers, generateConversations, user, profile, loading]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up chat realtime subscription for user:', user.id);

    const subscription = supabase
      .channel(`direct_messages_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(from_user_id.eq.${user.id},to_user_id.eq.${user.id})`
        },
        (payload) => {
          console.log('New message received via realtime:', payload);
          
          const newMessage = payload.new as DirectMessage;
          
          // If message is for current conversation, add it immediately
          if (selectedConversation && 
              (newMessage.from_user_id === selectedConversation || 
               newMessage.to_user_id === selectedConversation)) {
            
            // Add message immediately for better UX
            setMessages(prevMessages => {
              // Avoid duplicates
              const exists = prevMessages.find(m => m.id === newMessage.id);
              if (exists) return prevMessages;
              
              return [...prevMessages, newMessage].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
            
            // Also refresh to get complete data with sender info
            setTimeout(() => fetchMessages(selectedConversation), 100);
          }
          
          // Refresh conversations to update last message and unread counts
          generateConversations();
        }
      )
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public', 
        table: 'direct_messages',
        filter: `or(from_user_id.eq.${user.id},to_user_id.eq.${user.id})`
      }, (payload) => {
        console.log('Message updated via realtime:', payload);
        
        // Refresh current conversation if affected
        if (selectedConversation) {
          const updatedMessage = payload.new as DirectMessage;
          if (updatedMessage.from_user_id === selectedConversation || 
              updatedMessage.to_user_id === selectedConversation) {
            fetchMessages(selectedConversation);
          }
        }
      })
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    return () => {
      console.log('Cleaning up chat subscription');
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