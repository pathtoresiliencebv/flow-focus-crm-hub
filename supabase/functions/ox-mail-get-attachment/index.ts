/**
 * OX MAIL GET ATTACHMENT
 * 
 * Download email attachments via OX Mail API
 * Returns attachment file for download
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptPassword } from '../_shared/emailEncryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttachmentRequest {
  accountId: string;
  messageId: string;
  attachmentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accountId, messageId, attachmentId }: AttachmentRequest = await req.json();

    // Get Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get account
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    console.log('📎 Downloading attachment via OX Mail API');

    // Decrypt password
    const password = await decryptPassword(account.imap_password);

    // Login to OX Mail
    const loginResponse = await fetch('https://webmail.hostnet.nl/ajax/login?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: account.email_address,
        password: password,
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginData.error) {
      throw new Error(`OX login failed: ${loginData.error}`);
    }

    const session = loginData.session;

    // Download attachment
    const attachmentUrl = `https://webmail.hostnet.nl/ajax/mail?action=attachment&session=${session}&folder=default0/INBOX&id=${messageId}&attachment=${attachmentId}`;
    
    const attachmentResponse = await fetch(attachmentUrl);

    if (!attachmentResponse.ok) {
      throw new Error('Failed to download attachment');
    }

    // Get the file data
    const fileData = await attachmentResponse.arrayBuffer();

    // Logout
    await fetch(`https://webmail.hostnet.nl/ajax/login?action=logout&session=${session}`);

    console.log('✅ Attachment downloaded');

    // Return the file
    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': attachmentResponse.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': attachmentResponse.headers.get('Content-Disposition') || 'attachment',
      },
    });
  } catch (error: any) {
    console.error('❌ Attachment download error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
