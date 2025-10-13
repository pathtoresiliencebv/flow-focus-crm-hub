import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { StreamChat } from 'stream-chat';
import type { Channel, DefaultGenerics } from 'stream-chat';
import { useAuth } from './AuthContext';
import {
  initStreamClient,
  getStreamClient,
  getStreamUserToken,
  connectStreamUser,
  disconnectStreamUser,
  getAvailableChatUsers,
  ensureChatUsersExist,
} from '@/lib/stream-chat';
import { toast } from '@/hooks/use-toast';

interface StreamChatContextType {
  client: StreamChat | null;
  isConnected: boolean;
  isConnecting: boolean;
  availableUsers: any[];
  currentChannel: Channel<DefaultGenerics> | null;
  setCurrentChannel: (channel: Channel<DefaultGenerics> | null) => void;
  loadAvailableUsers: () => Promise<void>;
  error: string | null;
}

const StreamChatContext = createContext<StreamChatContextType | undefined>(undefined);

export const useStreamChat = () => {
  const context = useContext(StreamChatContext);
  if (!context) {
    throw new Error('useStreamChat must be used within StreamChatProvider');
  }
  return context;
};

interface StreamChatProviderProps {
  children: ReactNode;
}

export const StreamChatProvider: React.FC<StreamChatProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel<DefaultGenerics> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available users based on role
  const loadAvailableUsers = useCallback(async () => {
    if (!profile?.role) return;

    try {
      console.log('🔍 Loading available chat users...');
      
      // Ensure all chat users exist in Stream before loading the list
      await ensureChatUsersExist();
      
      const users = await getAvailableChatUsers(profile.role);
      
      // Filter out current user
      const filteredUsers = users.filter(u => u.id !== user?.id);
      
      setAvailableUsers(filteredUsers);
      console.log('✅ Loaded', filteredUsers.length, 'available users');
    } catch (error) {
      console.error('❌ Error loading available users:', error);
      setError('Failed to load available users');
    }
  }, [profile?.role, user?.id]);

  // Initialize and connect Stream client
  useEffect(() => {
    let mounted = true;

    const initializeStream = async () => {
      if (!user || !profile || isConnecting) return;

      // Check if user has chat access
      const hasAccess = ['Administrator', 'Administratie', 'Installateur'].includes(profile.role);
      if (!hasAccess) {
        console.log('⚠️ User role does not have chat access:', profile.role);
        return;
      }

      try {
        setIsConnecting(true);
        setError(null);
        console.log('🚀 Initializing Stream Chat for user:', user.id);

        // Get Stream token from Edge Function
        const tokenData = await getStreamUserToken();

        if (!mounted) return;

        // Initialize client
        const streamClient = initStreamClient(tokenData.apiKey);

        // Connect user
        await connectStreamUser(tokenData.userId, tokenData.token);

        if (!mounted) return;

        setClient(streamClient);
        setIsConnected(true);
        console.log('✅ Stream Chat initialized and connected');

        // Load available users
        await loadAvailableUsers();

        toast({
          title: 'Chat verbonden',
          description: 'Je bent nu verbonden met het chat systeem',
        });
      } catch (error) {
        console.error('❌ Failed to initialize Stream:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect to chat');
        
        toast({
          title: 'Chat verbinding mislukt',
          description: 'Kon niet verbinden met het chat systeem. Probeer het later opnieuw.',
          variant: 'destructive',
        });
      } finally {
        if (mounted) {
          setIsConnecting(false);
        }
      }
    };

    initializeStream();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.role]);

  // Disconnect on logout
  useEffect(() => {
    return () => {
      if (client) {
        console.log('🔌 Disconnecting Stream client on unmount...');
        disconnectStreamUser().catch(err => {
          console.error('Error disconnecting:', err);
        });
      }
    };
  }, [client]);

  const value: StreamChatContextType = {
    client,
    isConnected,
    isConnecting,
    availableUsers,
    currentChannel,
    setCurrentChannel,
    loadAvailableUsers,
    error,
  };

  return (
    <StreamChatContext.Provider value={value}>
      {children}
    </StreamChatContext.Provider>
  );
};

