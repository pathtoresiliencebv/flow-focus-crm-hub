import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Nylas from "https://esm.sh/nylas@7.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncMessagesRequest {
  accountId: string;
  fullSync?: boolean;
  maxMessages?: number;
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
    console.log('📧 Nylas Message Sync started');

    const { accountId, fullSync = false, maxMessages = 100 }: SyncMessagesRequest = await req.json();

    if (!accountId) {
      throw new Error('Account ID is required');
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

    console.log('📧 Syncing messages for account:', account.email_address);

    // Decrypt access token
    const accessToken = await decryptToken(account.access_token);

    // Initialize Nylas with account's access token
    const nylas = new Nylas({
      apiKey: Deno.env.get('NYLAS_API_KEY')!,
    });

    // Update sync state
    await supabaseClient
      .from('nylas_accounts')
      .update({ sync_state: 'syncing' })
      .eq('id', accountId);

    let syncedCount = 0;
    let threadCount = 0;

    try {
      // Fetch messages from Nylas
      console.log('🔄 Fetching messages from Nylas...');
      const messages = await nylas.messages.list({
        identifier: account.grant_id,
        queryParams: {
          limit: maxMessages,
          // Add date filter for incremental sync
          ...(fullSync ? {} : {
            since: account.last_sync_at ? new Date(account.last_sync_at).getTime() / 1000 : undefined,
          }),
        },
      });

      console.log(`📬 Found ${messages.data.length} messages to sync`);

      // Process each message
      for (const message of messages.data) {
        try {
          // Check if message already exists
          const { data: existingMessage } = await supabaseClient
            .from('nylas_messages')
            .select('id')
            .eq('nylas_account_id', accountId)
            .eq('nylas_message_id', message.id)
            .single();

          if (existingMessage) {
            console.log('⏭️ Message already exists, skipping:', message.id);
            continue;
          }

          // Parse message data
          const messageData = {
            nylas_account_id: accountId,
            nylas_message_id: message.id,
            thread_id: message.threadId,
            from_email: message.from?.[0]?.email || '',
            from_name: message.from?.[0]?.name || '',
            to_emails: message.to?.map(recipient => ({
              email: recipient.email,
              name: recipient.name,
            })) || [],
            cc_emails: message.cc?.map(recipient => ({
              email: recipient.email,
              name: recipient.name,
            })) || [],
            bcc_emails: message.bcc?.map(recipient => ({
              email: recipient.email,
              name: recipient.name,
            })) || [],
            subject: message.subject || '',
            body_text: message.body || '',
            body_html: message.body || '',
            received_at: new Date(message.date * 1000).toISOString(),
            sent_at: message.date ? new Date(message.date * 1000).toISOString() : null,
            is_read: message.unread === false,
            is_starred: message.starred || false,
            labels: message.labels || [],
            folder: message.folder || 'inbox',
            has_attachments: (message.attachments && message.attachments.length > 0) || false,
            attachments: message.attachments?.map(attachment => ({
              id: attachment.id,
              filename: attachment.filename,
              content_type: attachment.contentType,
              size: attachment.size,
            })) || [],
            in_reply_to: message.inReplyTo || null,
            references: message.references || null,
            message_id: message.messageId || null,
          };

          // Insert message
          const { error: messageError } = await supabaseClient
            .from('nylas_messages')
            .insert(messageData);

          if (messageError) {
            console.error('❌ Error inserting message:', messageError);
            continue;
          }

          syncedCount++;

          // Handle thread
          if (message.threadId) {
            // Check if thread exists
            const { data: existingThread } = await supabaseClient
              .from('nylas_threads')
              .select('id, message_count')
              .eq('nylas_account_id', accountId)
              .eq('nylas_thread_id', message.threadId)
              .single();

            if (existingThread) {
              // Update thread message count
              await supabaseClient
                .from('nylas_threads')
                .update({
                  message_count: existingThread.message_count + 1,
                  last_message_at: messageData.received_at,
                  is_read: messageData.is_read,
                })
                .eq('id', existingThread.id);
            } else {
              // Create new thread
              const threadData = {
                nylas_account_id: accountId,
                nylas_thread_id: message.threadId,
                subject: message.subject || '',
                participants: [
                  ...(message.from || []),
                  ...(message.to || []),
                  ...(message.cc || []),
                ],
                message_count: 1,
                last_message_at: messageData.received_at,
                is_read: messageData.is_read,
                is_starred: messageData.is_starred,
                labels: messageData.labels,
              };

              const { error: threadError } = await supabaseClient
                .from('nylas_threads')
                .insert(threadData);

              if (threadError) {
                console.error('❌ Error inserting thread:', threadError);
              } else {
                threadCount++;
              }
            }
          }

        } catch (messageError) {
          console.error('❌ Error processing message:', messageError);
          continue;
        }
      }

      // Update account sync status
      await supabaseClient
        .from('nylas_accounts')
        .update({
          sync_state: 'synced',
          last_sync_at: new Date().toISOString(),
          last_error: null,
          last_error_at: null,
        })
        .eq('id', accountId);

      console.log('✅ Sync completed:', {
        messages: syncedCount,
        threads: threadCount,
      });

      return new Response(
        JSON.stringify({
          success: true,
          messageCount: syncedCount,
          threadCount: threadCount,
          message: `Synced ${syncedCount} messages and ${threadCount} threads`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (syncError: any) {
      console.error('❌ Sync error:', syncError);

      // Update account with error
      await supabaseClient
        .from('nylas_accounts')
        .update({
          sync_state: 'error',
          last_error: syncError.message,
          last_error_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      throw syncError;
    }

  } catch (error: any) {
    console.error('❌ Message sync error:', error);
    
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



