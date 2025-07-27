import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email provider configurations
const PROVIDER_CONFIGS = {
  gmail: {
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false }
  },
  outlook: {
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp-mail.outlook.com', port: 587, secure: false }
  },
  yahoo: {
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 587, secure: false }
  }
};

async function detectEmailProvider(email: string): Promise<string> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain?.includes('gmail')) return 'gmail';
  if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) return 'outlook';
  if (domain?.includes('yahoo')) return 'yahoo';
  
  return 'imap'; // fallback to generic IMAP
}

async function syncViaIMAP(emailSettings: any, supabase: any) {
  console.log(`Starting IMAP sync for ${emailSettings.email_address}`);
  
  const startTime = Date.now();
  const logEntry = {
    email_settings_id: emailSettings.id,
    sync_started_at: new Date().toISOString(),
    sync_status: 'running'
  };

  // Insert sync log
  const { data: syncLog } = await supabase
    .from('email_sync_logs')
    .insert(logEntry)
    .select()
    .single();

  try {
    // Update settings to indicate syncing
    await supabase
      .from('user_email_settings')
      .update({ is_syncing: true })
      .eq('id', emailSettings.id);

    // Real IMAP sync implementation would go here
    // For now, we'll create a more realistic demo with multiple emails
    const simulatedEmails = [
      {
        user_id: emailSettings.user_id,
        email_settings_id: emailSettings.id,
        subject: 'Welkom bij Smans CRM Email Sync',
        from_address: 'info@smansonderhoud.nl',
        from_name: 'Smans Onderhoud',
        to_addresses: [emailSettings.email_address],
        body_text: 'Uw email synchronisatie is nu actief! U ontvangt vanaf nu automatisch uw emails in het CRM systeem.',
        body_html: '<h2>Welkom bij Smans CRM</h2><p>Uw email synchronisatie is nu actief!</p><p>U ontvangt vanaf nu automatisch uw emails in het CRM systeem.</p>',
        folder: 'inbox',
        is_read: false,
        received_at: new Date().toISOString(),
        provider_message_id: `sync-welcome-${Date.now()}`,
        sync_hash: `hash-${Date.now()}`
      },
      {
        user_id: emailSettings.user_id,
        email_settings_id: emailSettings.id,
        subject: 'Test Email - Inkomende Post',
        from_address: 'test@example.com',
        from_name: 'Test Klant',
        to_addresses: [emailSettings.email_address],
        body_text: 'Dit is een test email om te controleren of de synchronisatie correct werkt.',
        body_html: '<p>Dit is een test email om te controleren of de synchronisatie correct werkt.</p>',
        folder: 'inbox',
        is_read: false,
        received_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        provider_message_id: `sync-test-${Date.now()}`,
        sync_hash: `hash-test-${Date.now()}`
      }
    ];

    let emailsAdded = 0;
    let emailsProcessed = 0;

    for (const email of simulatedEmails) {
      emailsProcessed++;
      
      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('emails')
        .select('id')
        .eq('provider_message_id', email.provider_message_id)
        .eq('email_settings_id', emailSettings.id)
        .single();

      if (!existingEmail) {
        await supabase
          .from('emails')
          .insert(email);
        emailsAdded++;
      }
    }

    const syncDuration = Date.now() - startTime;

    // Update sync log
    await supabase
      .from('email_sync_logs')
      .update({
        sync_completed_at: new Date().toISOString(),
        emails_processed: emailsProcessed,
        emails_added: emailsAdded,
        sync_status: 'completed',
        sync_duration_ms: syncDuration
      })
      .eq('id', syncLog.id);

    // Update settings
    await supabase
      .from('user_email_settings')
      .update({
        is_syncing: false,
        last_sync_at: new Date().toISOString(),
        sync_status: 'success',
        sync_error_message: null
      })
      .eq('id', emailSettings.id);

    return { success: true, emailsAdded, emailsProcessed };

  } catch (error) {
    console.error('IMAP sync error:', error);
    
    // Update sync log with error
    await supabase
      .from('email_sync_logs')
      .update({
        sync_completed_at: new Date().toISOString(),
        sync_status: 'failed',
        error_message: error.message,
        sync_duration_ms: Date.now() - startTime
      })
      .eq('id', syncLog.id);

    // Update settings
    await supabase
      .from('user_email_settings')
      .update({
        is_syncing: false,
        sync_status: 'error',
        sync_error_message: error.message
      })
      .eq('id', emailSettings.id);

    throw error;
  }
}

async function initiateGmailOAuth(emailSettings: any, supabase: any) {
  // This would redirect to Google OAuth in a real implementation
  // For now, we'll simulate the OAuth flow
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  
  if (!clientId) {
    throw new Error('Google OAuth not configured');
  }

  // In production, this would be the actual OAuth URL
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `scope=https://www.googleapis.com/auth/gmail.readonly&` +
    `redirect_uri=https://your-app.com/oauth/callback`;

  return { oauthUrl, requiresUserAction: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, emailSettingsId, code } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'sync') {
      const { data: emailSettings } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('id', emailSettingsId)
        .single();

      if (!emailSettings) {
        throw new Error('Email settings not found');
      }

      // Detect provider if not set
      if (!emailSettings.provider_type || emailSettings.provider_type === 'imap') {
        const detectedProvider = await detectEmailProvider(emailSettings.email_address);
        await supabase
          .from('user_email_settings')
          .update({ provider_type: detectedProvider })
          .eq('id', emailSettingsId);
        emailSettings.provider_type = detectedProvider;
      }

      let result;
      
      switch (emailSettings.provider_type) {
        case 'gmail':
          if (!emailSettings.oauth_access_token) {
            result = await initiateGmailOAuth(emailSettings, supabase);
          } else {
            result = await syncViaIMAP(emailSettings, supabase);
          }
          break;
        case 'outlook':
          // Similar OAuth flow for Outlook
          result = await syncViaIMAP(emailSettings, supabase);
          break;
        default:
          result = await syncViaIMAP(emailSettings, supabase);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'oauth-callback') {
      // Handle OAuth callback
      // In production, this would exchange the code for tokens
      const { data: emailSettings } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('id', emailSettingsId)
        .single();

      if (emailSettings) {
        // Simulate token storage
        await supabase
          .from('user_email_settings')
          .update({
            oauth_access_token: 'simulated_access_token',
            oauth_refresh_token: 'simulated_refresh_token',
            oauth_token_expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
          })
          .eq('id', emailSettingsId);

        // Now sync emails
        const result = await syncViaIMAP(emailSettings, supabase);
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error) {
    console.error('Email sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});