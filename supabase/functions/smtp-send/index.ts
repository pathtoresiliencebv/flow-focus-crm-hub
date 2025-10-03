/**
 * SMTP Send Edge Function
 * 
 * Sends emails via SMTP and saves to Sent folder
 * Provider-agnostic email sending
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { decryptPassword } from '../_shared/emailEncryption.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  accountId: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType?: string;
  }>;
  inReplyTo?: string; // Message ID for threading
  references?: string[]; // For email threading
  priority?: 'high' | 'normal' | 'low';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const emailData: SendEmailRequest = await req.json();

    console.log('📤 Sending email via SMTP for account:', emailData.accountId);

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', emailData.accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    // Decrypt password
    const smtpPassword = await decryptPassword(account.smtp_password);

    console.log('🔐 Connecting to SMTP:', account.smtp_host);

    // Configure SMTP client
    const smtpClient = new SMTPClient({
      connection: {
        hostname: account.smtp_host,
        port: account.smtp_port,
        tls: account.smtp_encryption !== 'none',
        auth: {
          username: account.smtp_username,
          password: smtpPassword,
        },
      },
    });

    // Prepare recipients
    const toAddresses = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
    const ccAddresses = emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc]) : undefined;
    const bccAddresses = emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc : [emailData.bcc]) : undefined;

    // Prepare email
    const emailMessage: any = {
      from: {
        name: account.display_name || account.email_address.split('@')[0],
        mail: account.email_address,
      },
      to: toAddresses,
      cc: ccAddresses,
      bcc: bccAddresses,
      subject: emailData.subject,
      content: emailData.bodyText || '',
      html: emailData.bodyHtml,
    };

    // Add headers for threading
    if (emailData.inReplyTo) {
      emailMessage.inReplyTo = emailData.inReplyTo;
    }
    if (emailData.references) {
      emailMessage.references = emailData.references;
    }

    // Add priority
    if (emailData.priority) {
      const priorityMap = {
        high: '1',
        normal: '3',
        low: '5',
      };
      emailMessage.priority = priorityMap[emailData.priority];
    }

    // Add attachments if any
    if (emailData.attachments && emailData.attachments.length > 0) {
      emailMessage.attachments = emailData.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64',
        contentType: att.contentType || 'application/octet-stream',
      }));
    }

    // Send email
    console.log('📧 Sending to:', toAddresses.join(', '));
    await smtpClient.send(emailMessage);
    await smtpClient.close();

    console.log('✅ Email sent successfully');

    // Generate unique message ID
    const messageId = `<${Date.now()}.${Math.random().toString(36)}@${account.smtp_host}>`;
    const threadId = emailData.inReplyTo 
      ? await findThreadByMessageId(emailData.inReplyTo, supabaseClient)
      : `thread-${account.id}-${Date.now()}`;

    // Create or update thread
    await supabaseClient
      .from('email_threads')
      .upsert({
        id: threadId,
        account_id: account.id,
        thread_id: messageId,
        subject: emailData.subject,
        snippet: (emailData.bodyText || emailData.bodyHtml || '').substring(0, 200),
        participants: [
          { email: account.email_address, name: account.display_name },
          ...toAddresses.map(email => ({ email, name: email.split('@')[0] })),
        ],
        message_count: 1, // Would increment if reply
        last_message_at: new Date().toISOString(),
        is_read: true, // Sent emails are always read
        is_starred: false,
        labels: ['Sent'],
      });

    // Save email to database (Sent folder)
    const { data: savedMessage, error: saveError } = await supabaseClient
      .from('email_messages')
      .insert({
        thread_id: threadId,
        message_id: messageId,
        from_email: account.email_address,
        from_name: account.display_name || account.email_address,
        to_emails: toAddresses.map(email => ({ email, name: email.split('@')[0] })),
        cc_emails: ccAddresses?.map(email => ({ email, name: email.split('@')[0] })) || [],
        bcc_emails: bccAddresses?.map(email => ({ email, name: email.split('@')[0] })) || [],
        subject: emailData.subject,
        body_text: emailData.bodyText || '',
        body_html: emailData.bodyHtml || '',
        received_at: new Date().toISOString(),
        is_read: true,
        is_draft: false,
        labels: ['Sent'],
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving sent email:', saveError);
      // Don't fail the request - email was sent successfully
    }

    // TODO: Also save to IMAP Sent folder for proper sync
    // This would require IMAP APPEND command

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        threadId,
        savedMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Send error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Find thread ID by message ID (for replies)
 */
async function findThreadByMessageId(
  messageId: string,
  supabase: any
): Promise<string> {
  const { data } = await supabase
    .from('email_messages')
    .select('thread_id')
    .eq('message_id', messageId)
    .single();

  return data?.thread_id || `thread-${Date.now()}`;
}
