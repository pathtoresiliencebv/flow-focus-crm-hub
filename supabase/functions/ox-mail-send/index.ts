/**
 * OX MAIL SEND EMAIL
 * 
 * Sends emails via OX Mail API
 * Handles authentication, composition, and sending
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

interface SendEmailRequest {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  replyTo?: string;
  inReplyTo?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📧 OX Mail send started');
    
    const {
      accountId,
      to,
      cc = [],
      bcc = [],
      subject,
      bodyHtml,
      bodyText,
      attachments = [],
      replyTo,
      inReplyTo
    }: SendEmailRequest = await req.json();

    console.log('📧 Send request:', { 
      accountId, 
      to, 
      subject: subject.substring(0, 50) + '...',
      hasAttachments: attachments.length > 0 
    });

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
    console.log('✅ OX Mail: Login successful for sending email');

    try {
      // Prepare email data for OX Mail API
      const emailData = {
        to: to.join(','),
        cc: cc.length > 0 ? cc.join(',') : undefined,
        bcc: bcc.length > 0 ? bcc.join(',') : undefined,
        subject: subject,
        body: bodyHtml || bodyText || '',
        html: bodyHtml ? '1' : '0',
        reply_to: replyTo,
        in_reply_to: inReplyTo,
        attachments: attachments.map(att => ({
          name: att.filename,
          content: att.content,
          type: att.contentType
        }))
      };

      // Send email via OX Mail API
      const sendUrl = `https://webmail.hostnet.nl/ajax/mail?action=send&session=${session}`;
      
      const sendResponse = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: new URLSearchParams({
          to: emailData.to,
          cc: emailData.cc || '',
          bcc: emailData.bcc || '',
          subject: emailData.subject,
          body: emailData.body,
          html: emailData.html,
          reply_to: emailData.reply_to || '',
          in_reply_to: emailData.in_reply_to || '',
          attachments: JSON.stringify(emailData.attachments)
        })
      });

      if (!sendResponse.ok) {
        throw new Error(`OX send failed: ${sendResponse.status} ${sendResponse.statusText}`);
      }

      const sendData = await sendResponse.json();

      if (sendData.error) {
        throw new Error(`OX send error: ${sendData.error}`);
      }

      console.log('✅ OX Mail: Email sent successfully');

      // Save sent email to database
      const { data: userData } = await supabaseClient.auth.getUser();
      
      const sentEmail = {
        id: crypto.randomUUID(),
        user_id: userData.user?.id,
        direction: 'outbound',
        from_email: account.email_address,
        to_email: to,
        cc_email: cc,
        bcc_email: bcc,
        subject: subject,
        body_text: bodyText || '',
        body_html: bodyHtml || null,
        attachments: attachments,
        status: 'sent',
        is_starred: false,
        folder: 'sent',
        sent_at: new Date().toISOString(),
        received_at: new Date().toISOString(),
        external_message_id: `ox-sent-${Date.now()}`,
      };

      await supabaseClient
        .from('email_messages')
        .insert(sentEmail);

      console.log('✅ Sent email saved to database');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully via OX Mail API',
          messageId: sentEmail.id,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } finally {
      // Logout from OX Mail
      try {
        await fetch(`https://webmail.hostnet.nl/ajax/login?action=logout&session=${session}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        console.log('👋 OX Mail: Logged out after sending email');
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

  } catch (error: any) {
    console.error('OX Mail send error:', error);

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
