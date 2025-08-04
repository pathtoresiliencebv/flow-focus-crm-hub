import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation, TranslationResult } from '@/hooks/useTranslation';

export interface ChatMessage {
  id: string;
  content: string;
  user_id?: string;
  channel_id?: string;
  created_at: string;
  detected_language?: string;
  original_language?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
    language?: string;
    role?: string;
  };
}

export interface EnhancedChatMessage extends ChatMessage {
  translation?: TranslationResult;
  isTranslating?: boolean;
  translationError?: string;
}

export const useChatTranslation = (channelId?: string) => {
  const { 
    userPreferences, 
    translateMessage, 
    getLanguageName 
  } = useTranslation();
  
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load messages with translation data
  const loadMessages = useCallback(async () => {
    if (!channelId) return;

    try {
      setLoading(true);
      setError(null);

      // Load messages with sender information
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Load existing translations for these messages
      const messageIds = messagesData?.map(msg => msg.id) || [];
      const { data: translationsData } = await supabase
        .from('message_translations')
        .select('*')
        .in('message_id', messageIds)
        .eq('target_language', userPreferences.preferred_language);

      // Create translation lookup
      const translationLookup: Record<string, any> = {};
      translationsData?.forEach(translation => {
        translationLookup[translation.message_id] = translation;
      });

      // Load user language preferences for senders
      const userIds = messagesData?.map(msg => msg.user_id).filter(Boolean) || [];
      const { data: languagePrefs } = await supabase
        .from('user_language_preferences')
        .select('user_id, preferred_language')
        .in('user_id', userIds);

      const languageLookup: Record<string, string> = {};
      languagePrefs?.forEach(pref => {
        languageLookup[pref.user_id] = pref.preferred_language;
      });

      // Enhance messages with translation data
      const enhancedMessages: EnhancedChatMessage[] = messagesData?.map(msg => {
        const existingTranslation = translationLookup[msg.id];
        const senderLanguage = languageLookup[msg.user_id] || msg.detected_language || 'nl';

        return {
          ...msg,
          sender: msg.profiles ? {
            id: msg.profiles.id,
            name: msg.profiles.full_name || 'Unknown User',
            avatar: msg.profiles.avatar_url,
            language: senderLanguage,
            role: msg.profiles.role,
          } : undefined,
          translation: existingTranslation ? {
            translatedText: existingTranslation.translated_text,
            originalText: existingTranslation.original_text,
            fromLanguage: existingTranslation.source_language,
            toLanguage: existingTranslation.target_language,
            confidence: existingTranslation.confidence,
            cached: true,
          } : undefined,
        };
      }) || [];

      setMessages(enhancedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [channelId, userPreferences.preferred_language]);

  // Auto-translate messages that need translation
  const translatePendingMessages = useCallback(async () => {
    if (!userPreferences.chat_translation_enabled) return;

    const messagesToTranslate = messages.filter(msg => 
      !msg.translation && 
      !msg.isTranslating && 
      msg.detected_language && 
      msg.detected_language !== userPreferences.preferred_language &&
      msg.user_id !== supabase.auth.getSession().then(s => s.data.session?.user?.id)
    );

    for (const message of messagesToTranslate) {
      await translateMessageById(message.id);
    }
  }, [messages, userPreferences]);

  // Translate a specific message
  const translateMessageById = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    if (message.isTranslating || message.translation) return;

    // Mark as translating
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isTranslating: true, translationError: undefined }
        : msg
    ));

    try {
      const result = await translateMessage(
        message.content,
        userPreferences.preferred_language,
        messageId,
        message.detected_language || message.original_language
      );

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              isTranslating: false, 
              translation: result,
              translationError: result.error 
            }
          : msg
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isTranslating: false, translationError: errorMessage }
          : msg
      ));
    }
  }, [messages, translateMessage, userPreferences.preferred_language]);

  // Send a new message
  const sendMessage = useCallback(async (content: string) => {
    if (!channelId || !content.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: content.trim(),
          channel_id: channelId,
          user_id: user.id,
        });

      if (error) throw error;

      // Reload messages to include the new one
      await loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [channelId, loadMessages]);

  // Set up real-time subscription
  useEffect(() => {
    if (!channelId) return;

    const subscription = supabase
      .channel(`chat_messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId, loadMessages]);

  // Load messages on mount and channel change
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-translate new messages
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      translatePendingMessages();
    }
  }, [messages.length, loading, translatePendingMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    translateMessageById,
    refreshMessages: loadMessages,
  };
};