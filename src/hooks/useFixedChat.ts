import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DirectMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  original_language: string;
  translated_content?: Record<string, string>;
  media_type?: 'photo' | 'file' | 'voice';
  media_url?: string;
  media_filename?: string;
  media_size?: number;
  media_mime_type?: string;
  voice_duration?: number;
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
  const [userLanguage, setUserLanguage] = useState<string>('nl');
  
  const subscriptionRef = useRef<any>(null);
  const selectedConversationRef = useRef<string | null>(null);

  // Translate message using edge function
  const translateMessage = useCallback(async (text: string, fromLang: string, toLang: string): Promise<string> => {
    if (fromLang === toLang) return text;

    try {
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: { text, from_lang: fromLang, to_lang: toLang }
      });

      if (error) {
        console.error('❌ Translation error:', error);
        return text; // Fallback to original
      }

      return data.translated_text || text;
    } catch (error) {
      console.error('❌ Translation failed:', error);
      return text;
    }
  }, []);

  // Update ref when selected conversation changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Fetch available users
  const fetchAvailableUsers = useCallback(async () => {
    if (!user || !profile) return;

    try {
      console.log('🔍 Fetching available chat users for:', user.id, 'Role:', profile?.role);
      
      // Get fresh session to ensure API key is included
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ No active session found');
        return;
      }
      
      const { data, error } = await supabase.rpc('get_available_chat_users', {
        current_user_id: user.id
      });

      if (error) {
        console.error('❌ Error fetching available users:', error);
        console.error('Error details:', JSON.stringify(error));
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
          .eq('is_read', false);

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
      // Fetch messages WITHOUT JOIN first to avoid foreign key issues
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return;
      }

      console.log('✅ Fetched messages:', messagesData?.length || 0, 'messages', messagesData);
      
      // Enrich messages with sender info
      if (messagesData && messagesData.length > 0) {
        const enrichedMessages = await Promise.all(
          messagesData.map(async (msg: any) => {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', msg.from_user_id)
              .single();
            
            return {
              ...msg,
              sender: senderData || { id: msg.from_user_id, full_name: 'Unknown' }
            };
          })
        );
        setMessages(enrichedMessages as DirectMessage[]);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  }, [user]);

  // Upload media file to storage
  const uploadMedia = useCallback(async (file: File, type: 'photo' | 'file' | 'voice'): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const folder = type === 'photo' ? 'photos' : type === 'voice' ? 'voice' : 'files';
      const fileName = `${timestamp}${fileExt ? `.${fileExt}` : ''}`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      console.log('📤 Uploading media:', { type, filePath, size: file.size });

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      console.log('✅ Media uploaded:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return null;
    }
  }, [user]);

  // Send media message (photo, file, or voice)
  const sendMediaMessage = useCallback(async (
    file: File, 
    mediaType: 'photo' | 'file' | 'voice',
    toUserId: string,
    voiceDuration?: number
  ) => {
    if (!user || !toUserId || sending) return;

    setSending(true);
    console.log('📤 Sending media message:', { type: mediaType, to: toUserId });

    try {
      // Upload file to storage
      const mediaUrl = await uploadMedia(file, mediaType);
      
      if (!mediaUrl) {
        throw new Error('Media upload failed');
      }

      const messageData = {
        from_user_id: user.id,
        to_user_id: toUserId,
        content: mediaType === 'photo' ? '📷 Foto' : mediaType === 'voice' ? '🎤 Spraakbericht' : `📎 ${file.name}`,
        is_read: false,
        original_language: userLanguage,
        media_type: mediaType,
        media_url: mediaUrl,
        media_filename: file.name,
        media_size: file.size,
        media_mime_type: file.type,
        voice_duration: voiceDuration || null
      };

      console.log('📝 Inserting media message:', messageData);

      const { data, error } = await supabase
        .from('direct_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending media message:', error);
        throw error;
      }

      console.log('✅ Media message sent successfully');

      // Add message to local state
      const newMessage: DirectMessage = {
        ...data,
        sender: {
          id: user.id,
          full_name: profile?.full_name || 'You'
        }
      };

      setMessages(prev => [...prev, newMessage]);

      // Update conversation
      setConversations(prev =>
        prev.map(conv =>
          conv.id === toUserId
            ? { ...conv, last_message: newMessage, unread_count: conv.unread_count }
            : conv
        )
      );

    } catch (error) {
      console.error('❌ Error sending media message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [user, profile, sending, userLanguage, uploadMedia]);

  // Send a new text message
  const sendMessage = useCallback(async (content: string, toUserId: string) => {
    if (!user || !content.trim() || !toUserId || sending) return;

    setSending(true);
    console.log('📤 Sending message to:', toUserId, 'Content:', content);

    try {
      // Get recipient's language preference
      const { data: recipientData } = await supabase
        .from('profiles')
        .select('chat_language')
        .eq('id', toUserId)
        .single();

      const recipientLang = recipientData?.chat_language || 'nl';
      
      // Translate if languages differ
      let translatedContent: Record<string, string> = {};
      if (userLanguage !== recipientLang) {
        console.log('🌍 Translating from', userLanguage, 'to', recipientLang);
        const translated = await translateMessage(content.trim(), userLanguage, recipientLang);
        translatedContent = {
          [userLanguage]: content.trim(),
          [recipientLang]: translated
        };
      }

      const messageData = {
        from_user_id: user.id,
        to_user_id: toUserId,
        content: content.trim(),
        is_read: false,
        original_language: userLanguage,
        translated_content: Object.keys(translatedContent).length > 0 ? translatedContent : null
      };
      
      console.log('📝 Inserting message data:', messageData);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .insert(messageData)
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
        original_language: data.original_language,
        translated_content: data.translated_content,
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
  }, [user, profile, sending, userLanguage, translateMessage]);

  // Select a conversation
  const selectConversation = useCallback((otherUserId: string | null) => {
    console.log('💬 Selecting conversation with:', otherUserId);
    
    // CRITICAL: Clear messages FIRST before fetching new ones
    setMessages([]);
    setSelectedConversation(otherUserId);
    
    if (otherUserId) {
      fetchMessages(otherUserId);
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

  // Load user's language preference
  useEffect(() => {
    if (profile?.chat_language) {
      setUserLanguage(profile.chat_language);
    }
  }, [profile]);

  return {
    conversations,
    selectedConversation,
    messages,
    availableUsers,
    loading,
    sending,
    userLanguage,
    setUserLanguage,
    selectConversation,
    sendMessage,
    sendMediaMessage,
    fetchMessages,
    fetchAvailableUsers
  };
};
