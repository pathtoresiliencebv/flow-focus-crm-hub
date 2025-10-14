import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, smtp_host, smtp_port, imap_host, imap_port, ssl } = await req.json();

    if (!email || !password || !smtp_host) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Nylas IMAP/SMTP connection using the correct API endpoint
    const nylasResponse = await fetch('https://api.us.nylas.com/v3/grants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('NYLAS_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'imap',
        settings: {
          imap_host: imap_host || smtp_host.replace('smtp', 'imap'),
          imap_port: imap_port || 993,
          imap_username: email,
          imap_password: password,
          smtp_host: smtp_host,
          smtp_port: smtp_port || 587,
          smtp_username: email,
          smtp_password: password,
        },
        scopes: [
          'https://api.nylas.com/v3/grants.email.read',
          'https://api.nylas.com/v3/grants.email.send',
          'https://api.nylas.com/v3/grants.email.modify',
          'https://api.nylas.com/v3/grants.contacts.read',
          'https://api.nylas.com/v3/grants.contacts.write',
        ],
      }),
    });

    if (!nylasResponse.ok) {
      const errorData = await nylasResponse.text();
      console.error('Nylas API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create Nylas connection', details: errorData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nylasData = await nylasResponse.json();

    // Save the connection to our database
    const { data: account, error: dbError } = await supabaseClient
      .from('nylas_accounts')
      .insert({
        user_id: user.id,
        email_address: email,
        grant_id: nylasData.id,
        provider: 'imap',
        access_token: nylasData.access_token,
        refresh_token: nylasData.refresh_token,
        token_expires_at: nylasData.expires_at ? new Date(nylasData.expires_at).toISOString() : null,
        sync_state: 'initial',
        is_active: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save account to database', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        account: {
          id: account.id,
          email_address: account.email_address,
          provider: account.provider,
          sync_state: account.sync_state
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in nylas-smtp-connect:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
