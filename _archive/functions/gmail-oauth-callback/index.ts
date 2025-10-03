import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface UserInfo {
  email: string;
  name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, userId } = await req.json();

    if (!code || !userId) {
      throw new Error('Missing code or userId');
    }

    console.log('🔐 Processing OAuth callback for user:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || `${new URL(req.url).origin}/api/auth/gmail/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens: TokenResponse = await tokenResponse.json();
    console.log('✅ Tokens received');

    // Get user info
    console.log('👤 Fetching user info...');
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo: UserInfo = await userInfoResponse.json();
    console.log('✅ User info:', userInfo.email);

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('email_address', userInfo.email)
      .single();

    const accountData = {
      user_id: userId,
      provider: 'gmail',
      email_address: userInfo.email,
      display_name: userInfo.name,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      is_active: true,
      sync_enabled: true
    };

    let accountId: string;

    if (existingAccount) {
      // Update existing account
      console.log('🔄 Updating existing account');
      const { data, error } = await supabase
        .from('email_accounts')
        .update(accountData)
        .eq('id', existingAccount.id)
        .select('id')
        .single();

      if (error) throw error;
      accountId = data.id;
    } else {
      // Create new account
      console.log('➕ Creating new account');
      
      // Check if this should be the primary account
      const { data: accounts } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', userId);

      const isPrimary = !accounts || accounts.length === 0;

      const { data, error } = await supabase
        .from('email_accounts')
        .insert({
          ...accountData,
          is_primary: isPrimary
        })
        .select('id')
        .single();

      if (error) throw error;
      accountId = data.id;
    }

    console.log('✅ Account saved:', accountId);

    // Trigger initial sync
    console.log('🔄 Triggering initial sync...');
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/gmail-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId,
        maxResults: 50,
        fullSync: true
      })
    });

    if (!syncResponse.ok) {
      console.error('⚠️ Initial sync failed (non-critical)');
    } else {
      console.log('✅ Initial sync triggered');
    }

    return new Response(
      JSON.stringify({
        success: true,
        accountId,
        email: userInfo.email,
        displayName: userInfo.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

