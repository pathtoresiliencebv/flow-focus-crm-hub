import { useState, useEffect, useCallback, useRef } from 'react';
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

export const useFixedChat = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const subscriptionRef = useRef<any>(null);
  const selectedConversationRef = useRef<string | null>(null);

  // Update ref when selected conversation changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Fetch available users
  const fetchAvailableUsers = useCallback(async () => {
    if (!user || !profile) return;

    try {
      console.log('🔍 Fetching available chat users for:', user.id, 'Role:', profile?.role);
      
      const { data, error } = await supabase.rpc('get_available_chat_users', {
        current_user_id: user.id
      });

      if (error) {
        console.error('❌ Error fetching available users:', error);
        return;
      }

      console.log('✅ Found available chat users:', data?.length || 0, data);
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  }, [user, profile]);

  // Generate conversations from available users
  const generateConversations = useCallback(async () => {
    if (!user || availableUsers.length === 0) return;

    console.log('🔄 Generating conversations for', availableUsers.length, 'users');

    const conversationPromises = availableUsers.map(async (otherUser) => {
      try {
        // Get last message for this conversation
        const { data: lastMessageData } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUser.id}),and(from_user_id.eq.${otherUser.id},to_user_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('from_user_id', otherUser.id)
          .eq('to_user_id', user.id)
          .eq('read', false);

        return {
          id: otherUser.id,
          other_user: otherUser,
          last_message: lastMessageData || undefined,
          unread_count: unreadCount || 0
        };
      } catch (error) {
        console.error('Error generating conversation for user:', otherUser.id, error);
        return {
          id: otherUser.id,
          other_user: otherUser,
          last_message: undefined,
          unread_count: 0
        };
      }
    });

    const conversations = await Promise.all(conversationPromises);
    console.log('✅ Generated conversations:', conversations.length);
    setConversations(conversations);
  }, [user, availableUsers]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user || !otherUserId) {
      console.log('⚠️ Cannot fetch messages - missing user or otherUserId:', { user: user?.id, otherUserId });
      return;
    }

    console.log('📨 Fetching messages between:', user.id, 'and:', otherUserId);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!from_user_id(id, full_name)
        `)
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return;
      }

      console.log('✅ Fetched messages:', data?.length || 0, 'messages', data);
      setMessages((data || []) as DirectMessage[]);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  }, [user]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, toUserId: string) => {
    if (!user || !content.trim() || !toUserId || sending) return;

    setSending(true);
    console.log('📤 Sending message to:', toUserId, 'Content:', content);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          content: content.trim(),
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        throw error;
      }

      console.log('✅ Message sent successfully:', data);
      
      // Add message to local state immediately
      const newMessage: DirectMessage = {
        id: data.id,
        from_user_id: data.from_user_id,
        to_user_id: data.to_user_id,
        content: data.content,
        created_at: data.created_at,
        sender: {
          id: user.id,
          full_name: profile?.full_name || 'You'
        }
      };

      setMessages(prev => [...prev, newMessage]);

      // Update conversation with new last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === toUserId 
            ? { ...conv, last_message: newMessage }
            : conv
        )
      );

    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [user, profile, sending]);

  // Select a conversation
  const selectConversation = useCallback((otherUserId: string | null) => {
    console.log('💬 Selecting conversation with:', otherUserId);
    setSelectedConversation(otherUserId);
    if (otherUserId) {
      fetchMessages(otherUserId);
    } else {
      setMessages([]);
    }
  }, [fetchMessages]);

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || subscriptionRef.current) return;

    console.log('🔌 Setting up realtime subscription for user:', user.id);

    const channel = supabase
      .channel('direct_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        async (payload) => {
          console.log('📨 New message received:', payload);
          
          const newMessage = payload.new as any;
          
          // Check if message involves current user
          const isRelevant = newMessage.from_user_id === user.id || newMessage.to_user_id === user.id;
          
          if (!isRelevant) {
            console.log('⏭️ Message not relevant for current user, skipping');
            return;
          }

          // Fetch sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', newMessage.from_user_id)
            .single();

          const enrichedMessage: DirectMessage = {
            ...newMessage,
            sender: senderData || { id: newMessage.from_user_id, full_name: 'Unknown' }
          };
          
          // Only add message if it's for the currently selected conversation
          const otherUserId = newMessage.from_user_id === user.id ? newMessage.to_user_id : newMessage.from_user_id;
          
          if (selectedConversationRef.current === otherUserId) {
            console.log('✅ Adding message to current conversation');
            
            setMessages(prev => {
              // Check if message already exists
              const exists = prev.some(msg => msg.id === enrichedMessage.id);
              if (exists) {
                console.log('⚠️ Message already exists, skipping');
                return prev;
              }
              
              return [...prev, enrichedMessage];
            });
          } else {
            console.log('⏭️ Message for different conversation, updating sidebar only');
          }

          // Update conversations list
          setConversations(prev => 
            prev.map(conv => {
              if (conv.id === otherUserId) {
                return {
                  ...conv,
                  last_message: enrichedMessage,
                  unread_count: newMessage.from_user_id !== user.id ? conv.unread_count + 1 : conv.unread_count
                };
              }
              return conv;
            })
          );
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status);
      });

    subscriptionRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
      subscriptionRef.current = null;
    };
  }, [user]);

  // Initialize chat
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const initializeChat = async () => {
      if (!mounted) return;
      
      setLoading(true);
      console.log('🚀 Initializing chat for user:', user.id);
      
      await fetchAvailableUsers();
      
      if (!mounted) return;
      
      setLoading(false);
    };

    initializeChat();

    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, fetchAvailableUsers]);

  // Update conversations when available users change
  useEffect(() => {
    if (availableUsers.length > 0) {
      generateConversations();
    }
  }, [availableUsers, generateConversations]);

  // Setup realtime subscription after initialization
  useEffect(() => {
    if (!user || loading) return;

    const cleanup = setupRealtimeSubscription();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [user, loading, setupRealtimeSubscription]);

  return {
    conversations,
    selectedConversation,
    messages,
    availableUsers,
    loading,
    sending,
    selectConversation,
    sendMessage,
    fetchMessages,
    fetchAvailableUsers
  };
};
