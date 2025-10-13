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
    streamClient = new StreamChat(apiKey);
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

    // Call Edge Function to generate Stream token with explicit error handling
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-stream-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId: session.user.id }),
      }
    );

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 Response body:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { rawError: responseText };
      }
      console.error('❌ Edge Function error response:', errorData);
      throw new Error(`Edge Function error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = JSON.parse(responseText);

    if (!data) {
      console.error('❌ No data received from Edge Function');
      throw new Error('No data received from server');
    }

    if (data.error) {
      console.error('❌ Edge Function returned error:', data.error);
      console.error('❌ Error details:', data.details || 'No details available');
      throw new Error(`Edge Function error: ${data.error}`);
    }

    if (!data.token) {
      console.error('❌ No token in response:', data);
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
 * Note: Users are already upserted in Stream via the Edge Function during token generation
 */
export const createDirectChannel = async (
  currentUserId: string,
  otherUserId: string,
  otherUserData?: { full_name: string; role: string }
): Promise<Channel<DefaultGenerics>> => {
  if (!streamClient) {
    throw new Error('Stream client not initialized');
  }

  try {
    // Create a unique channel ID based on sorted user IDs (ensures same channel regardless of who initiates)
    const sortedIds = [currentUserId, otherUserId].sort();
    const channelId = `direct_${sortedIds[0]}_${sortedIds[1]}`;

    console.log('📝 Creating/getting direct channel:', channelId);

    // If we have user data, ensure the other user exists in Stream first
    if (otherUserData) {
      try {
        console.log('📝 Ensuring other user exists in Stream...');
        await streamClient.upsertUser({
          id: otherUserId,
          name: otherUserData.full_name,
          role: otherUserData.role,
        });
        console.log('✅ Other user upserted successfully');
      } catch (upsertError) {
        // User upsert might fail due to permissions, but we can continue
        console.warn('⚠️ Could not upsert other user (may already exist):', upsertError);
      }
    }

    // Members array must only contain user IDs (strings), not objects
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
        .select('id, full_name, role')
        .in('role', ['Administrator', 'Administratie']);
    } else if (['Administrator', 'Administratie'].includes(currentUserRole)) {
      // Admin/Administratie can chat with all Installateurs + other admins
      query = supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['Installateur', 'Administrator', 'Administratie']);
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

