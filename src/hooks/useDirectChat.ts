import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { TranslationService } from '@/services/translationService';
import { enhancedTranslationService } from '@/services/enhancedTranslationService';
import { languageDetectionService } from '@/services/languageDetectionService';
import { useChatFileUpload } from './useChatFileUpload';

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
  message_type?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  thumbnail_url?: string;
  audio_duration?: number;
  transcription_text?: string;
  detected_language?: string;
  context_type?: string;
  translation_confidence?: number;
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
  const { uploadFile } = useChatFileUpload();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  // Load available users for chat based on role
  const loadAvailableUsers = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Loading available users for chat...');
      const { data, error } = await supabase
        .rpc('get_available_chat_users', { current_user_id: user.id });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      console.log('Available users loaded:', data);
      
      // Filter out users with null or empty full_name and add fallback
      const validUsers = (data || []).map((user: ChatUser) => ({
        ...user,
        full_name: user.full_name || user.role || 'Onbekende gebruiker'
      }));

      setAvailableUsers(validUsers);
    } catch (error) {
      console.error('Error loading available users:', error);
      // Set empty array to prevent crash
      setAvailableUsers([]);
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

  // Send a text message with enhanced translation
  const sendMessage = useCallback(async (toUserId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      await sendEnhancedMessage(toUserId, {
        content: content.trim(),
        messageType: 'text'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Send a file message
  const sendFileMessage = useCallback(async (toUserId: string, file: File) => {
    if (!user || !file) return;

    try {
      setIsTranslating(true);
      
      // Upload file first
      const uploadResult = await uploadFile(file, 'chat-files');
      const { url: fileUrl, fileName, fileType, fileSize } = uploadResult;
      
      await sendEnhancedMessage(toUserId, {
        content: `📎 ${fileName}`,
        messageType: 'file',
        fileUrl,
        fileName,
        fileType,
        fileSize
      });
    } catch (error) {
      console.error('Error sending file:', error);
      toast({
        title: "Fout",
        description: "Kon bestand niet versturen",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  }, [user, uploadFile, toast]);

  // Send a voice message
  const sendVoiceMessage = useCallback(async (toUserId: string, audioBlob: Blob, duration: number) => {
    if (!user || !audioBlob) return;

    try {
      setIsTranslating(true);
      
      // Create file from blob
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      
      // Upload audio file
      const uploadResult = await uploadFile(audioFile, 'chat-files');
      const { url: fileUrl, fileName, fileType, fileSize } = uploadResult;
      
      // Get transcription
      let transcriptionText = '';
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        const { data } = await supabase.functions.invoke('voice-to-text', {
          body: formData
        });
        
        transcriptionText = data?.text || '';
      } catch (transcriptionError) {
        console.warn('Transcription failed:', transcriptionError);
      }
      
      await sendEnhancedMessage(toUserId, {
        content: transcriptionText || '🎵 Voice message',
        messageType: 'voice',
        fileUrl,
        fileName,
        fileType,
        fileSize,
        audioDuration: duration,
        transcriptionText
      });
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Fout",
        description: "Kon spraakbericht niet versturen",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  }, [user, uploadFile, toast]);

  // Enhanced message sender with language detection and translation
  const sendEnhancedMessage = useCallback(async (toUserId: string, messageData: {
    content: string;
    messageType: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    audioDuration?: number;
    transcriptionText?: string;
  }) => {
    if (!user) return;

    try {
      // Get recipient's language preference
      const { data: recipientData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', toUserId)
        .single();

      const recipientLanguage = (recipientData?.role === 'Installateur' ? 'pl' : 'nl');
      const senderLanguage = (profile?.role === 'Installateur' ? 'pl' : 'nl');

      // Detect language of content
      const detectionResult = languageDetectionService.detectFromContent(messageData.content);
      const detectedLanguage = detectionResult.code;
      
      // Enhanced translation if needed
      let translatedContent: Record<string, string> = {};
      let translationConfidence = 1.0;

      if (detectedLanguage !== recipientLanguage && messageData.content.trim()) {
        const translationResult = await enhancedTranslationService.translateText({
          text: messageData.content,
          fromLanguage: detectedLanguage,
          toLanguage: recipientLanguage,
          context: 'casual'
        });
        translatedContent[recipientLanguage] = translationResult.translatedText;
        translationConfidence = translationResult.confidence;
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          content: messageData.content,
          original_language: detectedLanguage,
          translated_content: Object.keys(translatedContent).length > 0 ? translatedContent : null,
          translation_confidence: translationConfidence,
          message_type: messageData.messageType,
          file_url: messageData.fileUrl,
          file_name: messageData.fileName,
          file_type: messageData.fileType,
          file_size: messageData.fileSize,
          audio_duration: messageData.audioDuration,
          transcription_text: messageData.transcriptionText,
          detected_language: detectedLanguage,
          context_type: 'work'
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error sending enhanced message:', error);
      throw error;
    }
  }, [user, profile]);

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
    isTranslating,
    sendMessage,
    sendFileMessage,
    sendVoiceMessage,
    loadMessages,
    getUnreadCount,
    loadAvailableUsers
  };
};