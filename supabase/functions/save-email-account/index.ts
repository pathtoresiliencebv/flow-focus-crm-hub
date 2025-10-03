/**
 * Save Email Account Edge Function
 * 
 * Saves email account with encrypted passwords
 * Handles both create and update operations
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptPassword } from '../_shared/emailEncryption.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveAccountRequest {
  accountId?: string; // If provided, update existing account
  emailAddress: string;
  displayName?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string; // Plain text, will be encrypted
  smtpEncryption: 'tls' | 'ssl' | 'none';
  imapHost: string;
  imapPort: number;
  imapUsername: string;
  imapPassword: string; // Plain text, will be encrypted
  imapEncryption: 'ssl' | 'tls' | 'none';
  syncEnabled?: boolean;
  connectionStatus?: string;
  isActive?: boolean;
  isPrimary?: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: SaveAccountRequest = await req.json();

    console.log('💾 Saving email account for:', requestData.emailAddress);

    // Encrypt passwords
    console.log('🔐 Encrypting passwords...');
    const encryptedSmtpPassword = await encryptPassword(requestData.smtpPassword);
    const encryptedImapPassword = await encryptPassword(requestData.imapPassword);
    console.log('✅ Passwords encrypted');

    // Prepare account data
    const accountData = {
      user_id: user.id,
      email_address: requestData.emailAddress,
      display_name: requestData.displayName || requestData.emailAddress.split('@')[0],
      smtp_host: requestData.smtpHost,
      smtp_port: requestData.smtpPort,
      smtp_username: requestData.smtpUsername,
      smtp_password: encryptedSmtpPassword,
      smtp_encryption: requestData.smtpEncryption,
      imap_host: requestData.imapHost,
      imap_port: requestData.imapPort,
      imap_username: requestData.imapUsername,
      imap_password: encryptedImapPassword,
      imap_encryption: requestData.imapEncryption,
      sync_enabled: requestData.syncEnabled ?? true,
      connection_status: requestData.connectionStatus || 'configured',
      is_active: requestData.isActive ?? true,
      is_primary: requestData.isPrimary ?? false,
    };

    let result;

    if (requestData.accountId) {
      // Update existing account
      console.log('📝 Updating existing account:', requestData.accountId);
      result = await supabaseClient
        .from('email_accounts')
        .update(accountData)
        .eq('id', requestData.accountId)
        .eq('user_id', user.id) // Security: only update own accounts
        .select()
        .single();
    } else {
      // Create new account
      console.log('➕ Creating new account');
      result = await supabaseClient
        .from('email_accounts')
        .insert(accountData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('❌ Database error:', result.error);
      throw result.error;
    }

    console.log('✅ Account saved successfully:', result.data.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: result.data.id,
          email_address: result.data.email_address,
          display_name: result.data.display_name,
        },
        message: 'Email account saved successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Save account error:', error);

    let errorMessage = error.message || 'Failed to save email account';
    let statusCode = 500;

    if (errorMessage.includes('EMAIL_ENCRYPTION_KEY')) {
      errorMessage = 'Email encryption key not configured. Please contact administrator.';
      statusCode = 500;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});

