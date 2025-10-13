import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { StreamChat } from 'https://esm.sh/stream-chat@8.40.0';

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

    // Generate user token
    const userToken = serverClient.createToken(profile.id);

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

