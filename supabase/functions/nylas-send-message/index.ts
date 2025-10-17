import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Nylas from "https://esm.sh/nylas@7.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  accountId: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
  inReplyTo?: string;
  references?: string;
}

// Decryption helper function
async function decryptToken(encryptedToken: string): Promise<string> {
  const key = Deno.env.get('EMAIL_ENCRYPTION_KEY');
  if (!key) {
    throw new Error('EMAIL_ENCRYPTION_KEY not configured');
  }
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyData = encoder.encode(key.slice(0, 32));
  
  const combined = new Uint8Array(
    atob(encryptedToken).split('').map(char => char.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📧 Nylas Send Message started');

    const {
      accountId,
      to,
      cc = [],
      bcc = [],
      subject,
      bodyText,
      bodyHtml,
      attachments = [],
      inReplyTo,
      references,
    }: SendMessageRequest = await req.json();

    if (!accountId || !to || !subject) {
      throw new Error('Missing required fields: accountId, to, subject');
    }

    // Get Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('nylas_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Nylas account not found');
    }

    console.log('📧 Sending message from account:', account.email_address);

    // Decrypt access token
    const accessToken = await decryptToken(account.access_token);

    // Initialize Nylas with account's access token
    const nylas = new Nylas({
      apiKey: Deno.env.get('NYLAS_API_KEY')!,
    });

    // Prepare recipients
    const toArray = Array.isArray(to) ? to : [to];
    const ccArray = Array.isArray(cc) ? cc : (cc ? [cc] : []);
    const bccArray = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

    // Prepare message data
    const messageData = {
      to: toArray.map(email => ({ email })),
      cc: ccArray.map(email => ({ email })),
      bcc: bccArray.map(email => ({ email })),
      subject,
      body: bodyHtml || bodyText || '',
      ...(inReplyTo && { inReplyTo }),
      ...(references && { references }),
    };

    console.log('📤 Sending message via Nylas:', {
      to: toArray,
      subject,
      hasAttachments: attachments.length > 0,
    });

    // Send message via Nylas
    const sentMessage = await nylas.messages.send({
      identifier: account.grant_id,
      requestBody: messageData,
    });

    console.log('✅ Message sent successfully:', sentMessage.id);

    // Save sent message to database
    const messageRecord = {
      nylas_account_id: accountId,
      nylas_message_id: sentMessage.id,
      thread_id: sentMessage.threadId,
      from_email: account.email_address,
      from_name: account.email_address,
      to_emails: toArray.map(email => ({ email, name: email })),
      cc_emails: ccArray.map(email => ({ email, name: email })),
      bcc_emails: bccArray.map(email => ({ email, name: email })),
      subject,
      body_text: bodyText || '',
      body_html: bodyHtml || '',
      received_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      is_read: true, // Sent messages are marked as read
      is_starred: false,
      labels: [],
      folder: 'sent',
      has_attachments: attachments.length > 0,
      attachments: attachments.map(attachment => ({
        filename: attachment.filename,
        content_type: attachment.contentType || 'application/octet-stream',
        size: attachment.content.length,
      })),
      in_reply_to: inReplyTo || null,
      references: references || null,
      message_id: sentMessage.messageId || null,
    };

    const { data: savedMessage, error: saveError } = await supabaseClient
      .from('nylas_messages')
      .insert(messageRecord)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Error saving sent message:', saveError);
      // Don't throw error here, message was sent successfully
    }

    // Update thread if this is a reply
    if (sentMessage.threadId) {
      const { data: existingThread } = await supabaseClient
        .from('nylas_threads')
        .select('id, message_count')
        .eq('nylas_account_id', accountId)
        .eq('nylas_thread_id', sentMessage.threadId)
        .single();

      if (existingThread) {
        // Update existing thread
        await supabaseClient
          .from('nylas_threads')
          .update({
            message_count: existingThread.message_count + 1,
            last_message_at: messageRecord.sent_at,
            is_read: true,
          })
          .eq('id', existingThread.id);
      } else {
        // Create new thread for sent message
        const threadData = {
          nylas_account_id: accountId,
          nylas_thread_id: sentMessage.threadId,
          subject,
          participants: [
            { email: account.email_address, name: account.email_address },
            ...toArray.map(email => ({ email, name: email })),
            ...ccArray.map(email => ({ email, name: email })),
          ],
          message_count: 1,
          last_message_at: messageRecord.sent_at,
          is_read: true,
          is_starred: false,
          labels: [],
        };

        await supabaseClient
          .from('nylas_threads')
          .insert(threadData);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: sentMessage.id,
        threadId: sentMessage.threadId,
        message: 'Message sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Send message error:', error);
    
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



