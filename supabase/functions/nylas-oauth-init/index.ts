import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Nylas from "https://esm.sh/nylas@7.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthInitRequest {
  provider: 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'imap';
  email?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔐 Nylas OAuth Init started');

    const { provider, email }: OAuthInitRequest = await req.json();

    if (!provider) {
      throw new Error('Provider is required');
    }

    // Get environment variables
    const nylasApiKey = Deno.env.get('NYLAS_API_KEY');
    const nylasClientId = Deno.env.get('NYLAS_CLIENT_ID');
    const nylasClientSecret = Deno.env.get('NYLAS_CLIENT_SECRET');
    const redirectUri = Deno.env.get('NYLAS_REDIRECT_URI');

    if (!nylasApiKey || !nylasClientId || !nylasClientSecret || !redirectUri) {
      throw new Error('Missing Nylas configuration. Please set NYLAS_API_KEY, NYLAS_CLIENT_ID, NYLAS_CLIENT_SECRET, and NYLAS_REDIRECT_URI');
    }

    // Initialize Nylas
    const nylas = new Nylas({
      apiKey: nylasApiKey,
    });

    // Build OAuth URL
    const authUrl = nylas.auth.urlForOAuth2({
      clientId: nylasClientId,
      redirectUri: redirectUri,
      loginHint: email, // Pre-fill email if provided
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      provider: provider,
    });

    console.log('✅ OAuth URL generated for provider:', provider);

    return new Response(
      JSON.stringify({
        success: true,
        authUrl,
        provider,
        redirectUri,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ OAuth init error:', error);
    
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



