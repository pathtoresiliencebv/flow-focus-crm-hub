/**
 * OX MAIL ATTACHMENT DOWNLOAD
 * 
 * Downloads attachments via OX Mail API
 * Handles authentication and file streaming
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Decrypt password using AES-256-GCM
 */
async function decryptPassword(encrypted: string): Promise<string> {
  if (!encrypted) {
    throw new Error('Encrypted password cannot be empty');
  }

  try {
    const keyString = Deno.env.get('EMAIL_ENCRYPTION_KEY');
    if (!keyString) {
      throw new Error('EMAIL_ENCRYPTION_KEY not set');
    }

    const keyData = new TextEncoder().encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const key = await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format');
    }
    
    const [ivBase64, encryptedBase64] = parts;
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      key,
      encryptedData
    );
    
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
}

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
    console.log('📎 OX Mail attachment download started');
    
    const { accountId, messageId, attachmentId }: AttachmentRequest = await req.json();
    console.log('📎 Request params:', { accountId, messageId, attachmentId });

    // Get Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    // Decrypt password
    const password = await decryptPassword(account.imap_password);

    // Login to OX Mail
    const loginResponse = await fetch('https://webmail.hostnet.nl/ajax/login?action=login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: new URLSearchParams({
        name: account.email_address,
        password: password,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`OX login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    
    if (loginData.error) {
      throw new Error(`OX login error: ${loginData.error}`);
    }

    const session = loginData.session;
    console.log('✅ OX Mail: Login successful for attachment download');

    try {
      // Download attachment via OX Mail API
      const attachmentUrl = `https://webmail.hostnet.nl/ajax/mail?action=attachment&session=${session}&id=${messageId}&attachment=${attachmentId}`;
      
      const attachmentResponse = await fetch(attachmentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!attachmentResponse.ok) {
        throw new Error(`Attachment download failed: ${attachmentResponse.status}`);
      }

      // Get attachment data
      const attachmentData = await attachmentResponse.arrayBuffer();
      const contentType = attachmentResponse.headers.get('content-type') || 'application/octet-stream';
      const filename = attachmentResponse.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'attachment';

      console.log('✅ OX Mail: Attachment downloaded successfully');

      // Return attachment as stream
      return new Response(attachmentData, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          ...corsHeaders,
        },
        status: 200,
      });

    } finally {
      // Logout from OX Mail
      try {
        await fetch(`https://webmail.hostnet.nl/ajax/login?action=logout&session=${session}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        console.log('👋 OX Mail: Logged out after attachment download');
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

  } catch (error: any) {
    console.error('OX Mail attachment error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});