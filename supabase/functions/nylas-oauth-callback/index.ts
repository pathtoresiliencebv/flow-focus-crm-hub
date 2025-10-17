import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Nylas from "https://esm.sh/nylas@7.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthCallbackRequest {
  code: string;
  state?: string;
}

// Encryption helper functions
async function encryptToken(token: string): Promise<string> {
  const key = Deno.env.get('EMAIL_ENCRYPTION_KEY');
  if (!key) {
    throw new Error('EMAIL_ENCRYPTION_KEY not configured');
  }
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.slice(0, 32)); // Use first 32 bytes
  const data = encoder.encode(token);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔐 Nylas OAuth Callback started');

    const { code, state }: OAuthCallbackRequest = await req.json();

    if (!code) {
      throw new Error('Authorization code is required');
    }

    // Get Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get environment variables
    const nylasApiKey = Deno.env.get('NYLAS_API_KEY');
    const nylasClientId = Deno.env.get('NYLAS_CLIENT_ID');
    const nylasClientSecret = Deno.env.get('NYLAS_CLIENT_SECRET');
    const redirectUri = Deno.env.get('NYLAS_REDIRECT_URI');

    if (!nylasApiKey || !nylasClientId || !nylasClientSecret || !redirectUri) {
      throw new Error('Missing Nylas configuration');
    }

    // Initialize Nylas
    const nylas = new Nylas({
      apiKey: nylasApiKey,
    });

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokenResponse = await nylas.auth.exchangeCodeForToken({
      clientId: nylasClientId,
      clientSecret: nylasClientSecret,
      redirectUri: redirectUri,
      code: code,
    });

    console.log('✅ Tokens received:', {
      grantId: tokenResponse.grantId,
      email: tokenResponse.email,
      expiresIn: tokenResponse.expiresIn,
    });

    // Get account info from Nylas
    const account = await nylas.accounts.get({
      identifier: tokenResponse.grantId,
    });

    console.log('📧 Account info:', {
      id: account.id,
      email: account.emailAddress,
      provider: account.provider,
    });

    // Encrypt tokens
    const encryptedAccessToken = await encryptToken(tokenResponse.accessToken);
    const encryptedRefreshToken = await encryptToken(tokenResponse.refreshToken);

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + (tokenResponse.expiresIn * 1000));

    // Save to database
    const { data: accountData, error: insertError } = await supabaseClient
      .from('nylas_accounts')
      .insert({
        user_id: user.id,
        email_address: account.emailAddress,
        grant_id: tokenResponse.grantId,
        provider: account.provider,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        sync_state: 'initial',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw new Error(`Failed to save account: ${insertError.message}`);
    }

    console.log('✅ Account saved to database:', accountData.id);

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          id: accountData.id,
          email_address: accountData.email_address,
          provider: accountData.provider,
          grant_id: accountData.grant_id,
        },
        message: 'Account connected successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});



