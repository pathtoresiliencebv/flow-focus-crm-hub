import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TypingUser {
  id: string;
  name: string;
  language: string;
}

interface RealtimeFeatures {
  typingIndicators: {
    isTyping: boolean;
    users: TypingUser[];
  };
  onlinePresence: {
    onlineUsers: string[];
    lastSeen: Record<string, string>;
  };
  messageStatus: {
    delivered: string[];
    read: string[];
    translated: string[];
  };
}

interface UseRealtimeChatReturn {
  features: RealtimeFeatures;
  setTyping: (isTyping: boolean) => void;
  markAsRead: (messageId: string) => void;
  updatePresence: () => void;
  subscribeToPresence: (userIds: string[]) => void;
}

export const useRealtimeChat = (channelId?: string): UseRealtimeChatReturn => {
  const { user } = useAuth();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [features, setFeatures] = useState<RealtimeFeatures>({
    typingIndicators: {
      isTyping: false,
      users: []
    },
    onlinePresence: {
      onlineUsers: [],
      lastSeen: {}
    },
    messageStatus: {
      delivered: [],
      read: [],
      translated: []
    }
  });

  useEffect(() => {
    if (!channelId || !user) return;

    const realtimeChannel = supabase.channel(`chat_${channelId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Listen for typing indicators
    realtimeChannel
      .on('presence', { event: 'sync' }, () => {
        const state = realtimeChannel.presenceState();
        const onlineUsers = Object.keys(state);
        
        setFeatures(prev => ({
          ...prev,
          onlinePresence: {
            ...prev.onlinePresence,
            onlineUsers
          }
        }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setFeatures(prev => ({
          ...prev,
          onlinePresence: {
            ...prev.onlinePresence,
            onlineUsers: [...prev.onlinePresence.onlineUsers, key]
          }
        }));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setFeatures(prev => ({
          ...prev,
          onlinePresence: {
            ...prev.onlinePresence,
            onlineUsers: prev.onlinePresence.onlineUsers.filter(id => id !== key)
          }
        }));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setFeatures(prev => ({
            ...prev,
            typingIndicators: {
              isTyping: payload.isTyping,
              users: payload.isTyping 
                ? [...prev.typingIndicators.users.filter(u => u.id !== payload.userId), {
                    id: payload.userId,
                    name: payload.userName || 'User',
                    language: payload.language || 'nl'
                  }]
                : prev.typingIndicators.users.filter(u => u.id !== payload.userId)
            }
          }));
        }
      })
      .on('broadcast', { event: 'message_read' }, ({ payload }) => {
        setFeatures(prev => ({
          ...prev,
          messageStatus: {
            ...prev.messageStatus,
            read: [...prev.messageStatus.read, payload.messageId]
          }
        }));
      })
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [channelId, user]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!channel || !user) return;

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        userName: user.user_metadata?.full_name || 'User',
        language: 'nl',
        isTyping
      }
    });
  }, [channel, user]);

  const markAsRead = useCallback((messageId: string) => {
    if (!channel) return;

    channel.send({
      type: 'broadcast',
      event: 'message_read',
      payload: { messageId, userId: user?.id }
    });

    setFeatures(prev => ({
      ...prev,
      messageStatus: {
        ...prev.messageStatus,
        read: [...prev.messageStatus.read, messageId]
      }
    }));
  }, [channel, user]);

  const updatePresence = useCallback(() => {
    if (!channel || !user) return;

    channel.track({
      user_id: user.id,
      online_at: new Date().toISOString(),
    });
  }, [channel, user]);

  const subscribeToPresence = useCallback((userIds: string[]) => {
    // This would be used to track specific users' presence
    console.log('Subscribing to presence for users:', userIds);
  }, []);

  return {
    features,
    setTyping,
    markAsRead,
    updatePresence,
    subscribeToPresence
  };
};