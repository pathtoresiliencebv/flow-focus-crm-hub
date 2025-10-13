import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { StreamChat } from 'https://esm.sh/stream-chat@8.40.0';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')  // email is in auth.users, not profiles
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    console.log('🔐 Generating Stream token for user:', {
      id: profile.id,
      name: profile.full_name,
      role: profile.role
    });

    // Initialize Stream Chat server-side client
    const streamApiKey = Deno.env.get('STREAM_API_KEY');
    const streamApiSecret = Deno.env.get('STREAM_API_SECRET');

    if (!streamApiKey || !streamApiSecret) {
      throw new Error('Stream API credentials not configured');
    }

    // Use StreamChat for upserting users (server-side operations)
    const serverClient = StreamChat.getInstance(streamApiKey, streamApiSecret);

    // Create or update user in Stream
    const streamUser = {
      id: profile.id,
      name: profile.full_name,
      role: profile.role,
      email: user.email || '',  // Get email from auth.users, not profiles
    };

    // Upsert current user in Stream (creates if doesn't exist, updates if exists)
    await serverClient.upsertUser(streamUser);

    // Also upsert all users that this user can chat with
    // This ensures they exist in Stream when creating channels
    console.log('📝 Upserting all available chat users in Stream...');
    
    let chatUsersQuery;
    if (profile.role === 'Installateur') {
      // Installateurs can only chat with Administrator and Administratie
      chatUsersQuery = supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['Administrator', 'Administratie']);
    } else if (['Administrator', 'Administratie'].includes(profile.role)) {
      // Admin/Administratie can chat with all Installateurs + other admins
      chatUsersQuery = supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['Installateur', 'Administrator', 'Administratie']);
    }

    if (chatUsersQuery) {
      const { data: chatUsers } = await chatUsersQuery;
      
      if (chatUsers && chatUsers.length > 0) {
        const usersToUpsert = chatUsers.map(u => ({
          id: u.id,
          name: u.full_name,
          role: u.role,
        }));
        
        await serverClient.upsertUsers(usersToUpsert);
        console.log(`✅ Upserted ${usersToUpsert.length} chat users in Stream`);
      }
    }

    // Generate user token manually using djwt (Stream SDK has persistent null issues)
    console.log('🔑 Generating JWT token manually...');
    const payload = {
      user_id: profile.id,
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
    
    const userToken = `${jwtData}.${jwtSignature}`;

    console.log('✅ Stream token generated successfully');

    return new Response(
      JSON.stringify({
        token: userToken,
        apiKey: streamApiKey,
        userId: profile.id,
        user: streamUser,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error generating Stream token:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate Stream token',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

