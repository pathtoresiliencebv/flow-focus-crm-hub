import { useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useChat } from './useChat';
import { useDirectChat } from './useDirectChat';
import { useRealtimeChat } from './useRealtimeChat';
import { useChatStore, useChatStoreSelectors } from './useChatStore';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedChatOptions {
  enableRealtime?: boolean;
  enableDirectMessages?: boolean;
  enableChannels?: boolean;
  autoLoadMessages?: boolean;
}

export const useEnhancedChat = (options: EnhancedChatOptions = {}) => {
  const {
    enableRealtime = true,
    enableDirectMessages = true,
    enableChannels = true,
    autoLoadMessages = true
  } = options;

  const { user } = useAuth();
  const { toast } = useToast();
  
  // Base hooks
  const chat = useChat();
  const directChat = useDirectChat();
  
  // Store state and selectors
  const store = useChatStore();
  const totalUnreadCount = useChatStoreSelectors.useTotalUnreadCount();
  const selectedConversation = useChatStoreSelectors.useSelectedConversation();
  const selectedMessages = useChatStoreSelectors.useSelectedMessages();
  const availableUsers = useChatStoreSelectors.useAvailableUsers();
  
  // Real-time features
  const realtimeFeatures = useRealtimeChat(
    enableRealtime && selectedConversation.type === 'channel' 
      ? selectedConversation.conversationId || undefined 
      : undefined
  );

  // Sync channel data to store
  useEffect(() => {
    if (enableChannels && chat.channels.length > 0) {
      store.setChannels(chat.channels);
      
      // Calculate unread counts for channels
      chat.channels.forEach(channel => {
        store.setUnreadCount(channel.id, channel.unread_count || 0);
      });
    }
  }, [chat.channels, enableChannels, store]);

  // Sync channel messages to store
  useEffect(() => {
    if (enableChannels && chat.selectedChannelId && chat.messages.length > 0) {
      store.setChannelMessages(chat.selectedChannelId, chat.messages);
      store.generateUnifiedMessages();
    }
  }, [chat.messages, chat.selectedChannelId, enableChannels, store]);

  // Sync direct messages to store
  useEffect(() => {
    if (enableDirectMessages && directChat.selectedUserId && directChat.messages.length > 0) {
      const conversationId = store.getConversationId('direct', undefined, directChat.selectedUserId);
      store.setDirectMessages(conversationId, directChat.messages);
      store.generateUnifiedMessages();
    }
  }, [directChat.messages, directChat.selectedUserId, enableDirectMessages, store]);

  // Sync available users
  useEffect(() => {
    const allUsers = [
      ...chat.availableUsers,
      ...directChat.availableUsers
    ].reduce((unique, user) => {
      if (!unique.find(u => u.id === user.id)) {
        unique.push(user);
      }
      return unique;
    }, [] as typeof chat.availableUsers);
    
    store.setAvailableUsers(allUsers);
  }, [chat.availableUsers, directChat.availableUsers, store]);

  // Enhanced conversation selection
  const selectConversation = useCallback(async (
    type: 'channel' | 'direct',
    id: string,
    userId?: string
  ) => {
    try {
      store.setLoading(true);
      
      if (type === 'channel') {
        // Select channel and load messages
        chat.setSelectedChannelId(id);
        if (autoLoadMessages) {
          await chat.loadMessages(id);
        }
        store.selectConversation(id, 'channel');
        store.markAsRead(id);
      } else if (type === 'direct' && userId) {
        // Select direct conversation and load messages
        directChat.setSelectedUserId(userId);
        if (autoLoadMessages) {
          await directChat.loadMessages(userId);
        }
        const conversationId = store.getConversationId('direct', undefined, userId);
        store.selectConversation(conversationId, 'direct', userId);
        store.markAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
      toast({
        title: "Fout",
        description: "Kon gesprek niet laden",
        variant: "destructive",
      });
    } finally {
      store.setLoading(false);
    }
  }, [chat, directChat, store, autoLoadMessages, toast]);

  // Enhanced message sending
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!selectedConversation.conversationId) {
      toast({
        title: "Fout", 
        description: "Geen gesprek geselecteerd",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedConversation.type === 'channel') {
        await chat.sendMessage(
          selectedConversation.conversationId,
          content,
          messageType,
          fileUrl,
          fileName
        );
      } else if (selectedConversation.type === 'direct' && selectedConversation.userId) {
        if (messageType === 'text') {
          await directChat.sendMessage(selectedConversation.userId, content);
        } else {
          // For files, we'd need to handle them differently in direct chat
          toast({
            title: "Info",
            description: "Bestandsupload voor directe berichten wordt binnenkort ondersteund",
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive",
      });
    }
  }, [selectedConversation, chat, directChat, toast]);

  // Enhanced file sending
  const sendFileMessage = useCallback(async (file: File) => {
    if (!selectedConversation.userId || selectedConversation.type !== 'direct') {
      toast({
        title: "Info",
        description: "Bestandsupload alleen beschikbaar voor directe berichten",
      });
      return;
    }

    try {
      await directChat.sendFileMessage(selectedConversation.userId, file);
    } catch (error) {
      console.error('Error sending file:', error);
      toast({
        title: "Fout", 
        description: "Kon bestand niet versturen",
        variant: "destructive",
      });
    }
  }, [selectedConversation, directChat, toast]);

  // Enhanced voice message sending
  const sendVoiceMessage = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!selectedConversation.userId || selectedConversation.type !== 'direct') {
      toast({
        title: "Info",
        description: "Spraakberichten alleen beschikbaar voor directe berichten",
      });
      return;
    }

    try {
      await directChat.sendVoiceMessage(selectedConversation.userId, audioBlob, duration);
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Fout",
        description: "Kon spraakbericht niet versturen", 
        variant: "destructive",
      });
    }
  }, [selectedConversation, directChat, toast]);

  // Create new direct channel
  const createDirectChannel = useCallback(async (userId: string) => {
    try {
      const channelId = await chat.createDirectChannel(userId);
      if (channelId) {
        await selectConversation('channel', channelId);
        return channelId;
      }
    } catch (error) {
      console.error('Error creating direct channel:', error);
      toast({
        title: "Fout",
        description: "Kon directe chat niet aanmaken",
        variant: "destructive",
      });
    }
    return null;
  }, [chat, selectConversation, toast]);

  // Get conversation unread count
  const getUnreadCount = useCallback((conversationId: string) => {
    return store.unreadCounts[conversationId] || 0;
  }, [store.unreadCounts]);

  // Check if user is typing in current conversation
  const isUserTyping = useCallback((userId: string) => {
    if (!selectedConversation.conversationId) return false;
    const typingUsers = store.typingUsers[selectedConversation.conversationId] || [];
    return typingUsers.includes(userId);
  }, [selectedConversation.conversationId, store.typingUsers]);

  // Set typing status for current conversation
  const setTyping = useCallback((isTyping: boolean) => {
    if (enableRealtime && selectedConversation.type === 'channel') {
      realtimeFeatures.setTyping(isTyping);
    }
  }, [enableRealtime, selectedConversation.type, realtimeFeatures]);

  // Initialize and load data
  useEffect(() => {
    if (user && autoLoadMessages) {
      // Load initial data from base hooks
      if (enableChannels) {
        chat.loadChannels();
        chat.loadAvailableUsers();
      }
      if (enableDirectMessages) {
        directChat.loadAvailableUsers();
      }
    }
  }, [user, autoLoadMessages, enableChannels, enableDirectMessages]);

  return {
    // State
    loading: store.loading || chat.loading || directChat.loading,
    isTranslating: directChat.isTranslating,
    
    // Conversations
    channels: store.channels,
    availableUsers,
    selectedConversation,
    selectedMessages,
    
    // Unread counts
    totalUnreadCount,
    getUnreadCount,
    
    // Actions
    selectConversation,
    sendMessage,
    sendFileMessage,
    sendVoiceMessage,
    createDirectChannel,
    
    // Real-time features
    realtimeFeatures: enableRealtime ? realtimeFeatures : null,
    isUserTyping,
    setTyping,
    
    // Direct access to base hooks for advanced use cases
    chatHook: chat,
    directChatHook: directChat,
    store
  };
};