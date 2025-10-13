import { StreamChat } from 'stream-chat';
import type { Channel, DefaultGenerics } from 'stream-chat';
import { supabase } from '@/integrations/supabase/client';

let streamClient: StreamChat | null = null;

export interface StreamTokenResponse {
  token: string;
  apiKey: string;
  userId: string;
  user: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
}

/**
 * Initialize Stream Chat client
 */
export const initStreamClient = (apiKey: string): StreamChat => {
  if (!streamClient) {
    streamClient = StreamChat.getInstance(apiKey);
    console.log('✅ Stream client initialized');
  }
  return streamClient;
};

/**
 * Get the current Stream client instance
 */
export const getStreamClient = (): StreamChat | null => {
  return streamClient;
};

/**
 * Generate Stream user token via Supabase Edge Function
 */
export const getStreamUserToken = async (): Promise<StreamTokenResponse> => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    console.log('🔐 Requesting Stream token from Supabase Edge Function...');

    // Call Edge Function to generate Stream token
    const { data, error } = await supabase.functions.invoke('generate-stream-token', {
      body: { userId: session.user.id },
    });

    if (error) {
      console.error('❌ Error getting Stream token:', error);
      throw error;
    }

    if (!data || !data.token) {
      throw new Error('No token received from server');
    }

    console.log('✅ Stream token received');
    return data as StreamTokenResponse;
  } catch (error) {
    console.error('❌ Failed to get Stream user token:', error);
    throw error;
  }
};

/**
 * Connect user to Stream Chat
 */
export const connectStreamUser = async (
  userId: string,
  userToken: string
): Promise<void> => {
  if (!streamClient) {
    throw new Error('Stream client not initialized');
  }

  try {
    console.log('🔌 Connecting user to Stream...', userId);
    
    await streamClient.connectUser(
      {
        id: userId,
      },
      userToken
    );

    console.log('✅ User connected to Stream');
  } catch (error) {
    console.error('❌ Failed to connect Stream user:', error);
    throw error;
  }
};

/**
 * Disconnect user from Stream Chat
 */
export const disconnectStreamUser = async (): Promise<void> => {
  if (streamClient) {
    try {
      console.log('🔌 Disconnecting user from Stream...');
      await streamClient.disconnectUser();
      streamClient = null;
      console.log('✅ User disconnected from Stream');
    } catch (error) {
      console.error('❌ Failed to disconnect Stream user:', error);
    }
  }
};

/**
 * Create or get a 1-on-1 channel between two users
 */
export const createDirectChannel = async (
  currentUserId: string,
  otherUserId: string
): Promise<Channel<DefaultGenerics>> => {
  if (!streamClient) {
    throw new Error('Stream client not initialized');
  }

  try {
    // Create a unique channel ID based on sorted user IDs (ensures same channel regardless of who initiates)
    const sortedIds = [currentUserId, otherUserId].sort();
    const channelId = `direct_${sortedIds[0]}_${sortedIds[1]}`;

    console.log('📝 Creating/getting direct channel:', channelId);

    const channel = streamClient.channel('messaging', channelId, {
      members: [currentUserId, otherUserId],
    });

    await channel.watch();

    console.log('✅ Direct channel ready');
    return channel;
  } catch (error) {
    console.error('❌ Failed to create direct channel:', error);
    throw error;
  }
};

/**
 * Get all channels for the current user
 */
export const getUserChannels = async () => {
  if (!streamClient) {
    throw new Error('Stream client not initialized');
  }

  try {
    const filter = { members: { $in: [streamClient.userID!] } };
    const sort = [{ last_message_at: -1 as const }];

    const channels = await streamClient.queryChannels(filter, sort, {
      watch: true,
      state: true,
    });

    console.log('✅ Retrieved', channels.length, 'channels');
    return channels;
  } catch (error) {
    console.error('❌ Failed to get user channels:', error);
    throw error;
  }
};

/**
 * Filter available users based on role permissions
 * Installateurs can only see Administrator/Administratie
 * Administrator/Administratie can see all Installateurs + other admins
 */
export const getAvailableChatUsers = async (currentUserRole: string): Promise<any[]> => {
  try {
    console.log('🔍 Fetching available chat users for role:', currentUserRole);

    let query;

    if (currentUserRole === 'Installateur') {
      // Installateurs can only chat with Administrator and Administratie
      query = supabase
        .from('profiles')
        .select('id, full_name, role, email, is_online')
        .in('role', ['Administrator', 'Administratie'])
        .eq('status', 'Actief')
        .order('full_name');
    } else if (['Administrator', 'Administratie'].includes(currentUserRole)) {
      // Admin/Administratie can chat with all Installateurs + other admins
      query = supabase
        .from('profiles')
        .select('id, full_name, role, email, is_online')
        .or(`role.eq.Installateur,role.eq.Administrator,role.eq.Administratie`)
        .eq('status', 'Actief')
        .order('full_name');
    } else {
      // Other roles have no chat access
      return [];
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }

    console.log('✅ Found', data?.length || 0, 'available chat users');
    return data || [];
  } catch (error) {
    console.error('❌ Failed to get available chat users:', error);
    throw error;
  }
};

