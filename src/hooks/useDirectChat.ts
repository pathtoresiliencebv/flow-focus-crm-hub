import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { TranslationService } from '@/services/translationService';

export interface DirectMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  original_language: string;
  translated_content?: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    full_name?: string;
    role?: string;
    language_preference?: string;
  };
}

export interface ChatUser {
  id: string;
  full_name?: string;
  role?: string;
  is_online?: boolean;
  language_preference?: string;
}

export const useDirectChat = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load available users for chat based on role
  const loadAvailableUsers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_available_chat_users', { current_user_id: user.id });

      if (error) throw error;

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error loading available users:', error);
      toast({
        title: "Fout",
        description: "Kon gebruikers niet laden",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Load messages for a specific user conversation
  const loadMessages = useCallback(async (otherUserId: string) => {
    if (!user || !otherUserId) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_from_user_id_fkey(id, full_name, role)
        `)
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        // Fallback without profile join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (fallbackError) throw fallbackError;

        const mappedMessages: DirectMessage[] = (fallbackData || []).map(msg => ({
          ...msg,
          translated_content: msg.translated_content as Record<string, string> | null,
          sender: {
            id: msg.from_user_id,
            full_name: 'Unknown User',
            role: 'Bekijker'
          }
        }));

        setMessages(mappedMessages);
        return;
      }

      const mappedMessages: DirectMessage[] = (data || []).map(msg => ({
        ...msg,
        translated_content: msg.translated_content as Record<string, string> | null,
        sender: Array.isArray(msg.sender) && msg.sender.length > 0 ? msg.sender[0] : {
          id: msg.from_user_id,
          full_name: 'Unknown User',
          role: 'Bekijker'
        }
      }));

      setMessages(mappedMessages);

      // Mark messages as read
      await markMessagesAsRead(otherUserId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Fout",
        description: "Kon berichten niet laden",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Send a direct message with automatic translation
  const sendMessage = useCallback(async (toUserId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      // Get recipient's role to determine language
      const { data: recipientData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', toUserId)
        .single();

      // Simple language logic: Admin/Administratie = Dutch, Installateur = Polish
      const recipientLanguage = recipientData?.role === 'Installateur' ? 'pl' : 'nl';
      const senderLanguage = profile?.role === 'Installateur' ? 'pl' : 'nl';

      // Detect and translate if needed
      const detectedLanguage = TranslationService.detectLanguage(content);
      let translatedContent: Record<string, string> = {};

      if (detectedLanguage !== recipientLanguage) {
        const translation = await TranslationService.translateText(
          content,
          detectedLanguage,
          recipientLanguage
        );
        translatedContent[recipientLanguage] = translation;
      }

      if (detectedLanguage !== senderLanguage && senderLanguage !== recipientLanguage) {
        const senderTranslation = await TranslationService.translateText(
          content,
          detectedLanguage,
          senderLanguage
        );
        translatedContent[senderLanguage] = senderTranslation;
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          content: content.trim(),
          original_language: detectedLanguage,
          translated_content: Object.keys(translatedContent).length > 0 ? translatedContent : null,
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive",
      });
    }
  }, [user, profile, toast]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (fromUserId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Get unread count for a user
  const getUnreadCount = useCallback(async (fromUserId: string): Promise<number> => {
    if (!user) return 0;

    try {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('direct-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;
          
          // Only add message if it's for current conversation
          if (selectedUserId && 
              ((newMessage.from_user_id === user.id && newMessage.to_user_id === selectedUserId) ||
               (newMessage.from_user_id === selectedUserId && newMessage.to_user_id === user.id))) {
            setMessages(prev => [...prev, newMessage]);
            
            // Mark as read if we're the recipient
            if (newMessage.to_user_id === user.id) {
              markMessagesAsRead(newMessage.from_user_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, selectedUserId, markMessagesAsRead]);

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
    messages,
    availableUsers,
    selectedUserId,
    setSelectedUserId,
    loading,
    sendMessage,
    loadMessages,
    getUnreadCount,
    loadAvailableUsers
  };
};