import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailSyncRequest {
  accountId: string;
  maxResults?: number;
  fullSync?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { accountId, maxResults = 50, fullSync = false }: GmailSyncRequest = await req.json();

    console.log('📧 Gmail Sync started:', { accountId, maxResults, fullSync });

    // Get email account
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    // Check if token needs refresh
    const tokenExpiresAt = new Date(account.token_expires_at);
    const now = new Date();
    
    let accessToken = account.access_token;
    
    if (tokenExpiresAt <= now) {
      console.log('🔄 Refreshing access token...');
      accessToken = await refreshGmailToken(account, supabase);
    }

    // Fetch threads from Gmail API
    const threadsUrl = fullSync && account.sync_token
      ? `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&pageToken=${account.sync_token}`
      : `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}`;

    const threadsResponse = await fetch(threadsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!threadsResponse.ok) {
      const error = await threadsResponse.text();
      throw new Error(`Gmail API error: ${error}`);
    }

    const threadsData = await threadsResponse.json();
    const threads = threadsData.threads || [];

    console.log(`📥 Fetched ${threads.length} threads`);

    // Process each thread
    let processedCount = 0;
    for (const thread of threads) {
      try {
        await processThread(thread.id, account.id, accessToken, supabase);
        processedCount++;
      } catch (error) {
        console.error(`❌ Error processing thread ${thread.id}:`, error);
      }
    }

    // Update sync metadata
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_token: threadsData.nextPageToken || null
      })
      .eq('id', accountId);

    if (updateError) {
      console.error('❌ Error updating sync metadata:', updateError);
    }

    console.log(`✅ Sync complete: ${processedCount}/${threads.length} threads processed`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        totalThreads: threads.length,
        nextPageToken: threadsData.nextPageToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Gmail sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshGmailToken(account: any, supabase: any): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const { access_token, expires_in } = await response.json();

  // Update token in database
  await supabase
    .from('email_accounts')
    .update({
      access_token,
      token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
    })
    .eq('id', account.id);

  return access_token;
}

async function processThread(
  threadId: string,
  accountId: string,
  accessToken: string,
  supabase: any
) {
  // Fetch full thread details
  const threadResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!threadResponse.ok) {
    throw new Error(`Failed to fetch thread ${threadId}`);
  }

  const threadData = await threadResponse.json();
  const messages = threadData.messages || [];

  if (messages.length === 0) return;

  // Get first message for thread metadata
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  // Extract subject
  const subject = getHeader(firstMessage.payload.headers, 'Subject') || '(No Subject)';
  const snippet = threadData.snippet || '';

  // Extract participants
  const participants: any[] = [];
  const participantEmails = new Set<string>();

  messages.forEach((msg: any) => {
    const from = getHeader(msg.payload.headers, 'From');
    const to = getHeader(msg.payload.headers, 'To');
    const cc = getHeader(msg.payload.headers, 'Cc');

    [from, to, cc].forEach(header => {
      if (header) {
        const emails = extractEmails(header);
        emails.forEach(email => {
          if (!participantEmails.has(email.address)) {
            participantEmails.add(email.address);
            participants.push(email);
          }
        });
      }
    });
  });

  // Check if thread exists
  const { data: existingThread } = await supabase
    .from('email_threads')
    .select('id')
    .eq('account_id', accountId)
    .eq('thread_id', threadId)
    .single();

  const threadRecord = {
    account_id: accountId,
    thread_id: threadId,
    subject,
    snippet,
    message_count: messages.length,
    participants,
    first_message_at: new Date(parseInt(firstMessage.internalDate)).toISOString(),
    last_message_at: new Date(parseInt(lastMessage.internalDate)).toISOString(),
    labels: threadData.labelIds || [],
    is_read: !threadData.labelIds?.includes('UNREAD'),
    is_starred: threadData.labelIds?.includes('STARRED'),
    folder: getFolder(threadData.labelIds || [])
  };

  let dbThreadId: string;

  if (existingThread) {
    // Update existing thread
    const { data, error } = await supabase
      .from('email_threads')
      .update(threadRecord)
      .eq('id', existingThread.id)
      .select('id')
      .single();

    if (error) throw error;
    dbThreadId = data.id;
  } else {
    // Insert new thread
    const { data, error } = await supabase
      .from('email_threads')
      .insert(threadRecord)
      .select('id')
      .single();

    if (error) throw error;
    dbThreadId = data.id;
  }

  // Process messages
  for (const message of messages) {
    await processMessage(message, dbThreadId, supabase);
  }
}

async function processMessage(message: any, threadId: string, supabase: any) {
  const headers = message.payload.headers;

  const from = getHeader(headers, 'From');
  const to = getHeader(headers, 'To');
  const cc = getHeader(headers, 'Cc');
  const subject = getHeader(headers, 'Subject');

  const fromEmail = extractEmails(from || '')[0] || { address: '', name: '' };

  // Extract body
  const { text, html } = extractBody(message.payload);

  // Check if message exists
  const { data: existing } = await supabase
    .from('email_messages')
    .select('id')
    .eq('thread_id', threadId)
    .eq('message_id', message.id)
    .single();

  if (existing) {
    // Message already exists, skip
    return;
  }

  // Insert message
  const messageRecord = {
    thread_id: threadId,
    message_id: message.id,
    from_email: fromEmail.address,
    from_name: fromEmail.name,
    to_emails: extractEmails(to || ''),
    cc_emails: extractEmails(cc || ''),
    subject,
    body_text: text,
    body_html: html,
    received_at: new Date(parseInt(message.internalDate)).toISOString(),
    labels: message.labelIds || [],
    is_read: !message.labelIds?.includes('UNREAD'),
    is_draft: message.labelIds?.includes('DRAFT')
  };

  const { error } = await supabase
    .from('email_messages')
    .insert(messageRecord);

  if (error) {
    console.error('Error inserting message:', error);
  }
}

function getHeader(headers: any[], name: string): string | undefined {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value;
}

function extractEmails(headerValue: string): Array<{ address: string; name: string }> {
  if (!headerValue) return [];
  
  const emails: Array<{ address: string; name: string }> = [];
  const regex = /"?([^"<]*)"?\s*<?([^>]+)>?/g;
  let match;

  while ((match = regex.exec(headerValue)) !== null) {
    const [, name, address] = match;
    emails.push({
      name: name?.trim() || '',
      address: address?.trim() || match[0].trim()
    });
  }

  return emails;
}

function extractBody(payload: any): { text: string; html: string } {
  let text = '';
  let html = '';

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        text += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
      if (part.mimeType === 'text/html' && part.body.data) {
        html += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
      // Recursive for nested parts
      if (part.parts) {
        const nested = extractBody(part);
        text += nested.text;
        html += nested.html;
      }
    }
  } else if (payload.body.data) {
    const content = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    if (payload.mimeType === 'text/plain') {
      text = content;
    } else if (payload.mimeType === 'text/html') {
      html = content;
    }
  }

  return { text, html };
}

function getFolder(labels: string[]): string {
  if (labels.includes('SENT')) return 'sent';
  if (labels.includes('DRAFT')) return 'drafts';
  if (labels.includes('TRASH')) return 'trash';
  if (labels.includes('SPAM')) return 'spam';
  return 'inbox';
}

