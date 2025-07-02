import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useOfflineChat } from './useOfflineChat';

export interface ChatChannel {
  id: string;
  name: string;
  type: 'general' | 'project' | 'direct';
  project_id?: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content?: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  file_url?: string;
  file_name?: string;
  translated_content?: Record<string, string>;
  reply_to_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name?: string;
    role?: string;
  };
}

export interface ChatParticipant {
  id: string;
  channel_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at?: string;
}

export const useChat = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { isOnline, addOfflineMessage, getOfflineMessages } = useOfflineChat();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  // Load user's channels
  const loadChannels = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .select(`
          *,
          chat_participants!inner(user_id)
        `)
        .eq('chat_participants.user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Calculate unread counts for each channel
      const channelsWithUnread = await Promise.all(
        (data || []).map(async (channel) => {
          const { data: participantData } = await supabase
            .from('chat_participants')
            .select('last_read_at')
            .eq('channel_id', channel.id)
            .eq('user_id', user.id)
            .single();

          const lastReadAt = participantData?.last_read_at;

          if (!lastReadAt) {
            // Count all messages if never read
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', channel.id);
            
            return { 
              ...channel, 
              type: channel.type as 'general' | 'project' | 'direct',
              unread_count: count || 0 
            };
          }

          // Count messages after last read
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id)
            .gt('created_at', lastReadAt);

          return { 
            ...channel, 
            type: channel.type as 'general' | 'project' | 'direct',
            unread_count: count || 0 
          };
        })
      );

      setChannels(channelsWithUnread);
    } catch (error) {
      console.error('Error loading channels:', error);
      toast({
        title: "Fout",
        description: "Kon kanalen niet laden",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Load messages for a channel (including offline messages)
  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;

    try {
      // Load online messages
      let onlineMessages: ChatMessage[] = [];
      
      if (isOnline) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            *,
            sender:profiles!chat_messages_sender_id_fkey(id, full_name, role)
          `)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        onlineMessages = (data || []).map(msg => ({
          id: msg.id,
          channel_id: msg.channel_id,
          sender_id: msg.sender_id,
          content: msg.content || undefined,
          message_type: msg.message_type as 'text' | 'image' | 'file' | 'voice',
          file_url: msg.file_url || undefined,
          file_name: msg.file_name || undefined,
          translated_content: msg.translated_content as Record<string, string> | undefined,
          reply_to_id: msg.reply_to_id || undefined,
          is_edited: msg.is_edited,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          sender: Array.isArray(msg.sender) && msg.sender.length > 0 ? msg.sender[0] : undefined
        }));
      }

      // Load offline messages
      const offlineMessages = await getOfflineMessages(channelId);
      const offlineMessagesChatFormat: ChatMessage[] = offlineMessages
        .filter(msg => !msg.synced)
        .map(msg => ({
          id: msg.temp_id,
          channel_id: msg.channel_id,
          sender_id: user?.id || '',
          content: msg.content || undefined,
          message_type: msg.message_type,
          file_url: msg.file_url,
          file_name: msg.file_name,
          is_edited: false,
          created_at: msg.created_at,
          updated_at: msg.created_at,
          sender: {
            id: user?.id || '',
            full_name: profile?.full_name || 'You',
            role: profile?.role || 'Bekijker'
          }
        }));

      // Combine and sort all messages
      const allMessages = [...onlineMessages, ...offlineMessagesChatFormat]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setMessages(allMessages);

      // Mark channel as read (only if online)
      if (isOnline) {
        await markChannelAsRead(channelId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Fout",
        description: "Kon berichten niet laden",
        variant: "destructive",
      });
    }
  }, [toast, isOnline, getOfflineMessages, user, profile]);

  // Send a message (with offline support)
  const sendMessage = useCallback(async (
    channelId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!user || !content.trim()) return;

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            channel_id: channelId,
            sender_id: user.id,
            content: content.trim(),
            message_type: messageType,
            file_url: fileUrl,
            file_name: fileName,
          });

        if (error) throw error;

        // Update channel timestamp
        await supabase
          .from('chat_channels')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', channelId);
      } else {
        // Store offline
        await addOfflineMessage(channelId, content.trim(), messageType, fileUrl, fileName);
        
        // Refresh messages to show the offline message
        await loadMessages(channelId);
        
        toast({
          title: "Bericht opgeslagen",
          description: "Wordt verzonden zodra je online bent",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive",
      });
    }
  }, [user, toast, isOnline, addOfflineMessage, loadMessages]);

  // Mark channel as read
  const markChannelAsRead = useCallback(async (channelId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('channel_id', channelId)
        .eq('user_id', user.id);

      // Update local state
      setChannels(prev => 
        prev.map(channel => 
          channel.id === channelId 
            ? { ...channel, unread_count: 0 }
            : channel
        )
      );
    } catch (error) {
      console.error('Error marking channel as read:', error);
    }
  }, [user]);

  // Create a new channel
  const createChannel = useCallback(async (
    name: string,
    type: 'general' | 'project' | 'direct' = 'general',
    projectId?: string,
    participantIds: string[] = []
  ) => {
    if (!user) return null;

    try {
      const { data: channelData, error: channelError } = await supabase
        .from('chat_channels')
        .insert({
          name,
          type,
          project_id: projectId,
          created_by: user.id,
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Add creator as admin participant
      const participants = [
        { channel_id: channelData.id, user_id: user.id, role: 'admin' },
        ...participantIds.map(userId => ({
          channel_id: channelData.id,
          user_id: userId,
          role: 'member' as const
        }))
      ];

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantError) throw participantError;

      await loadChannels();
      return channelData.id;
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: "Fout",
        description: "Kon kanaal niet aanmaken",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, loadChannels]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Only add message if it's for the current channel
          if (newMessage.channel_id === selectedChannelId) {
            setMessages(prev => [...prev, newMessage]);
          }

          // Update unread count for the channel
          setChannels(prev =>
            prev.map(channel =>
              channel.id === newMessage.channel_id
                ? {
                    ...channel,
                    unread_count: channel.id === selectedChannelId ? 0 : (channel.unread_count || 0) + 1,
                    updated_at: newMessage.created_at
                  }
                : channel
            )
          );
        }
      )
      .subscribe();

    // Subscribe to channel updates
    const channelSubscription = supabase
      .channel('chat-channels')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_channels',
        },
        () => {
          loadChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(channelSubscription);
    };
  }, [user, selectedChannelId, loadChannels]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadChannels().finally(() => setLoading(false));
    }
  }, [user, loadChannels]);

  // Load messages when channel is selected
  useEffect(() => {
    if (selectedChannelId) {
      loadMessages(selectedChannelId);
    }
  }, [selectedChannelId, loadMessages]);

  return {
    channels,
    messages,
    participants,
    loading,
    selectedChannelId,
    setSelectedChannelId,
    sendMessage,
    createChannel,
    markChannelAsRead,
    loadChannels,
    loadMessages,
    typingUsers,
    isOnline
  };
};