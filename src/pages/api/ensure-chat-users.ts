import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { StreamChat } from 'stream-chat';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const streamApiKey = process.env.STREAM_API_KEY!;
const streamApiSecret = process.env.STREAM_API_SECRET!;

// Manual JWT generation function
const generateJWT = async (userId: string): Promise<string> => {
  const payload = {
    user_id: userId,
  };
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(streamApiSecret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const header = { alg: 'HS256', typ: 'JWT' };
  const jwtHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwtPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwtData = `${jwtHeader}.${jwtPayload}`;
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(jwtData)
  );
  
  const jwtSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${jwtData}.${jwtSignature}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Initialize Stream server client with new instance
    const serverClient = new StreamChat(streamApiKey, streamApiSecret);
    
    if (!serverClient) {
      return res.status(500).json({ error: 'Failed to initialize Stream client' });
    }

    // Get all users that this user can chat with
    let chatUsersQuery;
    if (profile.role === 'Installateur') {
      chatUsersQuery = supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['Administrator', 'Administratie']);
    } else if (['Administrator', 'Administratie'].includes(profile.role)) {
      chatUsersQuery = supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['Installateur', 'Administrator', 'Administratie']);
    }

    if (chatUsersQuery) {
      const { data: chatUsers } = await chatUsersQuery;
      
      if (chatUsers && chatUsers.length > 0) {
        try {
          // Upsert all chat users
          const usersToUpsert = chatUsers.map(u => ({
            id: u.id,
            name: u.full_name,
            role: u.role,
          }));
          
          await serverClient.upsertUsers(usersToUpsert);
          console.log(`✅ Upserted ${usersToUpsert.length} chat users in Stream`);
        } catch (upsertError) {
          console.error('⚠️ Failed to upsert users in Stream:', upsertError);
          // Continue anyway, as this is non-critical
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'All chat users ensured in Stream' 
    });

  } catch (error) {
    console.error('❌ Error ensuring chat users:', error);
    return res.status(500).json({ 
      error: 'Failed to ensure chat users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
