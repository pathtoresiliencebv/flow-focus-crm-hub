import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { ChatChannel, ChatMessage, ChatUser } from './useChat';
import { DirectMessage } from './useDirectChat';

interface UnifiedMessage extends ChatMessage {
  // Common properties for both channel and direct messages
  conversationId: string; // channel_id for channel messages, generated for direct messages
  conversationType: 'channel' | 'direct';
  otherUserId?: string; // For direct messages
}

interface ChatState {
  // Channels and Messages
  channels: ChatChannel[];
  channelMessages: Record<string, ChatMessage[]>;
  directMessages: Record<string, DirectMessage[]>;
  unifiedMessages: Record<string, UnifiedMessage[]>;
  
  // Users and Presence
  availableUsers: ChatUser[];
  onlineUsers: string[];
  typingUsers: Record<string, string[]>;
  
  // UI State
  selectedConversationId: string | null;
  selectedConversationType: 'channel' | 'direct' | null;
  selectedUserId: string | null;
  loading: boolean;
  
  // Unread counts
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  
  // Real-time subscriptions
  subscriptions: Set<string>;
}

interface ChatActions {
  // Channel Management
  setChannels: (channels: ChatChannel[]) => void;
  addChannel: (channel: ChatChannel) => void;
  updateChannel: (channelId: string, updates: Partial<ChatChannel>) => void;
  
  // Message Management
  setChannelMessages: (channelId: string, messages: ChatMessage[]) => void;
  addChannelMessage: (channelId: string, message: ChatMessage) => void;
  setDirectMessages: (conversationId: string, messages: DirectMessage[]) => void;
  addDirectMessage: (conversationId: string, message: DirectMessage) => void;
  
  // User Management
  setAvailableUsers: (users: ChatUser[]) => void;
  updateUserOnlineStatus: (userId: string, isOnline: boolean) => void;
  setTypingUsers: (conversationId: string, users: string[]) => void;
  
  // UI State
  selectConversation: (conversationId: string, type: 'channel' | 'direct', userId?: string) => void;
  setLoading: (loading: boolean) => void;
  
  // Unread Management
  setUnreadCount: (conversationId: string, count: number) => void;
  markAsRead: (conversationId: string) => void;
  calculateTotalUnread: () => void;
  
  // Real-time Subscriptions
  addSubscription: (subscriptionId: string) => void;
  removeSubscription: (subscriptionId: string) => void;
  clearSubscriptions: () => void;
  
  // Unified Messages
  generateUnifiedMessages: () => void;
  getConversationId: (type: 'channel' | 'direct', channelId?: string, userId?: string) => string;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial State
  channels: [],
  channelMessages: {},
  directMessages: {},
  unifiedMessages: {},
  availableUsers: [],
  onlineUsers: [],
  typingUsers: {},
  selectedConversationId: null,
  selectedConversationType: null,
  selectedUserId: null,
  loading: true,
  unreadCounts: {},
  totalUnreadCount: 0,
  subscriptions: new Set(),

  // Channel Management
  setChannels: (channels) => set({ channels }),
  
  addChannel: (channel) => set((state) => ({
    channels: [...state.channels, channel]
  })),
  
  updateChannel: (channelId, updates) => set((state) => ({
    channels: state.channels.map(channel =>
      channel.id === channelId ? { ...channel, ...updates } : channel
    )
  })),

  // Message Management
  setChannelMessages: (channelId, messages) => set((state) => ({
    channelMessages: {
      ...state.channelMessages,
      [channelId]: messages
    }
  })),
  
  addChannelMessage: (channelId, message) => set((state) => ({
    channelMessages: {
      ...state.channelMessages,
      [channelId]: [...(state.channelMessages[channelId] || []), message]
    }
  })),
  
  setDirectMessages: (conversationId, messages) => set((state) => ({
    directMessages: {
      ...state.directMessages,
      [conversationId]: messages
    }
  })),
  
  addDirectMessage: (conversationId, message) => set((state) => ({
    directMessages: {
      ...state.directMessages,
      [conversationId]: [...(state.directMessages[conversationId] || []), message]
    }
  })),

  // User Management
  setAvailableUsers: (users) => set({ availableUsers: users }),
  
  updateUserOnlineStatus: (userId, isOnline) => set((state) => ({
    onlineUsers: isOnline
      ? [...state.onlineUsers.filter(id => id !== userId), userId]
      : state.onlineUsers.filter(id => id !== userId),
    availableUsers: state.availableUsers.map(user =>
      user.id === userId ? { ...user, is_online: isOnline } : user
    )
  })),
  
  setTypingUsers: (conversationId, users) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [conversationId]: users
    }
  })),

  // UI State
  selectConversation: (conversationId, type, userId) => set({
    selectedConversationId: conversationId,
    selectedConversationType: type,
    selectedUserId: userId
  }),
  
  setLoading: (loading) => set({ loading }),

  // Unread Management
  setUnreadCount: (conversationId, count) => set((state) => {
    const newUnreadCounts = {
      ...state.unreadCounts,
      [conversationId]: count
    };
    const totalUnreadCount = Object.values(newUnreadCounts).reduce((sum, count) => (sum as number) + (count as number), 0);
    
    return {
      unreadCounts: newUnreadCounts,
      totalUnreadCount
    };
  }),
  
  markAsRead: (conversationId) => set((state) => {
    const newUnreadCounts = {
      ...state.unreadCounts,
      [conversationId]: 0
    };
    const totalUnreadCount = Object.values(newUnreadCounts).reduce((sum, count) => (sum as number) + (count as number), 0);
    
    return {
      unreadCounts: newUnreadCounts,
      totalUnreadCount
    };
  }),
  
  calculateTotalUnread: () => set((state) => ({
    totalUnreadCount: Object.values(state.unreadCounts).reduce((sum, count) => (sum as number) + (count as number), 0)
  })),

  // Real-time Subscriptions
  addSubscription: (subscriptionId) => set((state) => ({
    subscriptions: new Set(state.subscriptions).add(subscriptionId)
  })),
  
  removeSubscription: (subscriptionId) => set((state) => {
    const newSubscriptions = new Set(state.subscriptions);
    newSubscriptions.delete(subscriptionId);
    return { subscriptions: newSubscriptions };
  }),
  
  clearSubscriptions: () => set({ subscriptions: new Set() }),

  // Unified Messages
  generateUnifiedMessages: () => set((state) => {
    const unified: Record<string, UnifiedMessage[]> = {};
    
    // Add channel messages
    Object.entries(state.channelMessages).forEach(([channelId, messages]) => {
      unified[channelId] = (messages as ChatMessage[]).map(msg => ({
        ...msg,
        conversationId: channelId,
        conversationType: 'channel' as const
      }));
    });
    
    // Add direct messages 
    Object.entries(state.directMessages).forEach(([conversationId, messages]) => {
      unified[conversationId] = (messages as DirectMessage[]).map(msg => ({
        id: msg.id,
        channel_id: conversationId,
        sender_id: msg.from_user_id,
        content: msg.content,
        message_type: (msg.message_type || 'text') as 'text' | 'image' | 'file' | 'voice',
        file_url: msg.file_url,
        file_name: msg.file_name,
        translated_content: msg.translated_content,
        reply_to_id: undefined,
        is_edited: false,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        sender: msg.sender,
        conversationId,
        conversationType: 'direct' as const,
        otherUserId: msg.to_user_id
      }));
    });
    
    return { unifiedMessages: unified };
  }),
  
  getConversationId: (type, channelId, userId) => {
    if (type === 'channel' && channelId) {
      return channelId;
    }
    if (type === 'direct' && userId) {
      // Generate consistent conversation ID for direct messages
      return `direct_${userId}`;
    }
    return '';
  }
}));

// Selectors for optimized re-renders
export const useChatStoreSelectors = {
  // Get messages for selected conversation
  useSelectedMessages: () => useChatStore(state => {
    if (!state.selectedConversationId) return [];
    return state.unifiedMessages[state.selectedConversationId] || [];
  }),
  
  // Get unread count for specific conversation
  useUnreadCount: (conversationId: string) => useChatStore(state => 
    state.unreadCounts[conversationId] || 0
  ),
  
  // Get total unread count
  useTotalUnreadCount: () => useChatStore(state => state.totalUnreadCount),
  
  // Get available users with online status
  useAvailableUsers: () => useChatStore(state => 
    state.availableUsers.map(user => ({
      ...user,
      is_online: state.onlineUsers.includes(user.id)
    }))
  ),
  
  // Get typing users for conversation
  useTypingUsers: (conversationId: string) => useChatStore(state => 
    state.typingUsers[conversationId] || []
  ),
  
  // Get selected conversation info
  useSelectedConversation: () => useChatStore(state => ({
    conversationId: state.selectedConversationId,
    type: state.selectedConversationType,
    userId: state.selectedUserId
  }))
};