import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { enhancedTranslationService } from '@/services/enhancedTranslationService';
import { languageDetectionService } from '@/services/languageDetectionService';
import { useChatFileUpload } from './useChatFileUpload';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'location';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  thumbnail_url?: string;
  audio_duration?: number;
  transcription_text?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  detected_language?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  other_user_id: string;
  other_user_name?: string;
  other_user_email?: string;
  other_user_role?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export const useDirectChat = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Load conversations (list of users I've chatted with)
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read,
          profiles!direct_messages_sender_id_fkey (id, full_name, email, role),
          receiver_profiles:profiles!direct_messages_receiver_id_fkey (id, full_name, email, role)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation and get latest message + unread count
      const conversationMap = new Map<string, Conversation>();

      data?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id 
          ? msg.receiver_profiles // receiver profile
          : msg.profiles; // sender profile

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            other_user_id: otherUserId,
            other_user_name: otherUser?.full_name,
            other_user_email: otherUser?.email,
            other_user_role: otherUser?.role,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: 0
          });
        }

        // Update unread count (messages received that are not read)
        if (msg.receiver_id === user.id && !msg.is_read) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unread_count++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user?.id]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async () => {
    if (!user?.id || !selectedUserId) {
      setMessages([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user?.id, selectedUserId]);

  // Send a message
  const sendMessage = useCallback(async (
    receiverId: string, 
    content: string, 
    messageType: string = 'text',
    fileData?: any,
    locationData?: any
  ) => {
    if (!user?.id) return;

    try {
      const messageData: any = {
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        message_type: messageType,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add file data if present
      if (fileData) {
        messageData.file_url = fileData.file_url;
        messageData.file_name = fileData.file_name;
        messageData.file_size = fileData.file_size;
        messageData.file_type = fileData.file_type;
        messageData.thumbnail_url = fileData.thumbnail_url;
        messageData.audio_duration = fileData.audio_duration;
        messageData.transcription_text = fileData.transcription_text;
      }

      // Add location data if present
      if (locationData) {
        messageData.latitude = locationData.latitude;
        messageData.longitude = locationData.longitude;
        messageData.address = locationData.address;
      }

      // Detect language for text messages
      if (messageType === 'text' && content.trim()) {
        try {
          const response = await supabase.functions.invoke('translate-message', {
            body: { 
              text: content,
              action: 'detect'
            }
          });
          
          if (response.data?.detectedLanguage) {
            messageData.detected_language = response.data.detectedLanguage;
          }
        } catch (error) {
          console.warn('Language detection failed:', error);
        }
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert([messageData]);

      if (error) throw error;

      // Reload conversations and messages
      await Promise.all([loadConversations(), loadMessages()]);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user?.id, loadConversations, loadMessages]);

  // Mark messages as read
  const markAsRead = useCallback(async (otherUserId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.other_user_id === otherUserId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('direct_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          console.log('Direct message change:', payload);
          
          // Reload data when changes occur
          loadConversations();
          if (selectedUserId) {
            loadMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedUserId, loadConversations, loadMessages]);

  // Load data on mount and when user changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await loadConversations();
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadConversations]);

  // Load messages when selected user changes
  useEffect(() => {
    loadMessages();
  }, [selectedUserId, loadMessages]);

  return {
    loading,
    conversations,
    messages,
    selectedUserId,
    setSelectedUserId,
    sendMessage,
    markAsRead,
    refreshConversations: loadConversations,
    refreshMessages: loadMessages
  };
};