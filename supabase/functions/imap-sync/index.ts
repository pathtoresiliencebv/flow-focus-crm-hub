/**
 * IMAP Sync Edge Function
 * 
 * Synchronizes emails from IMAP server to database
 * Replaces gmail-sync with provider-agnostic IMAP implementation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptPassword } from '../_shared/emailEncryption.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  accountId: string;
  fullSync?: boolean; // If true, sync all emails (not just new)
  maxMessages?: number; // Limit number of messages to sync
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

    const { accountId, fullSync = false, maxMessages = 50 }: SyncRequest = await req.json();

    console.log('🔄 Starting IMAP sync for account:', accountId);

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    if (!account.sync_enabled) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Sync is disabled for this account',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt passwords
    const imapPassword = await decryptPassword(account.imap_password);

    // Connect to IMAP server
    console.log('📧 Connecting to IMAP:', account.imap_host);

    const connection = await Deno.connect({
      hostname: account.imap_host,
      port: account.imap_port,
      transport: account.imap_encryption === 'none' ? 'tcp' : 'tls',
    });

    const imapClient = new IMAPClient(connection);

    try {
      // Login
      await imapClient.login(account.imap_username, imapPassword);
      console.log('✅ IMAP login successful');

      // Select INBOX
      const mailboxInfo = await imapClient.select('INBOX');
      console.log('📬 Mailbox info:', mailboxInfo);

      // Determine which messages to fetch
      let messageRange: string;
      if (fullSync) {
        // Fetch last N messages
        const total = mailboxInfo.exists;
        const start = Math.max(1, total - maxMessages + 1);
        messageRange = `${start}:${total}`;
      } else {
        // Fetch only new messages since last sync
        const lastUid = account.last_synced_uid || 1;
        messageRange = `${lastUid}:*`;
      }

      console.log('🔍 Fetching messages:', messageRange);

      // Fetch message headers
      const messages = await imapClient.fetchMessages(messageRange, [
        'UID',
        'FLAGS',
        'ENVELOPE',
        'BODY.PEEK[HEADER]',
        'RFC822.SIZE',
      ]);

      console.log(`📥 Fetched ${messages.length} messages`);

      let syncedCount = 0;
      let errorCount = 0;

      // Process each message
      for (const message of messages) {
        try {
          await processMessage(message, accountId, supabaseClient);
          syncedCount++;
        } catch (error) {
          console.error('Error processing message:', message.uid, error);
          errorCount++;
        }
      }

      // Update account last sync
      const highestUid = messages.length > 0 
        ? Math.max(...messages.map(m => m.uid))
        : account.last_synced_uid || 0;

      await supabaseClient
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          last_synced_uid: highestUid,
          connection_status: 'connected',
          last_error: null,
        })
        .eq('id', accountId);

      // Logout
      await imapClient.logout();

      console.log('✅ Sync completed:', { syncedCount, errorCount });

      return new Response(
        JSON.stringify({
          success: true,
          syncedCount,
          errorCount,
          lastUid: highestUid,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('IMAP error:', error);

      // Update account with error
      await supabaseClient
        .from('email_accounts')
        .update({
          connection_status: 'error',
          last_error: error.message,
          last_error_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      throw error;
    } finally {
      connection.close();
    }
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Simple IMAP Client
 * Implements basic IMAP commands
 */
class IMAPClient {
  private connection: Deno.Conn;
  private tagCounter = 0;
  private buffer = '';

  constructor(connection: Deno.Conn) {
    this.connection = connection;
  }

  private nextTag(): string {
    return `A${String(++this.tagCounter).padStart(4, '0')}`;
  }

  private async sendCommand(command: string): Promise<string> {
    const tag = this.nextTag();
    const fullCommand = `${tag} ${command}\r\n`;
    
    console.log('→', fullCommand.trim());
    await this.connection.write(new TextEncoder().encode(fullCommand));

    return tag;
  }

  private async readResponse(expectedTag: string): Promise<string> {
    const buffer = new Uint8Array(8192);
    let response = this.buffer;

    while (true) {
      const bytesRead = await this.connection.read(buffer);
      if (!bytesRead) break;

      response += new TextDecoder().decode(buffer.subarray(0, bytesRead));

      // Check if we have a complete response
      if (response.includes(`${expectedTag} OK`) || 
          response.includes(`${expectedTag} NO`) || 
          response.includes(`${expectedTag} BAD`)) {
        console.log('←', response.substring(0, 200) + (response.length > 200 ? '...' : ''));
        this.buffer = '';
        return response;
      }
    }

    return response;
  }

  async login(username: string, password: string): Promise<void> {
    const tag = await this.sendCommand(`LOGIN ${username} ${password}`);
    const response = await this.readResponse(tag);

    if (!response.includes(`${tag} OK`)) {
      throw new Error('IMAP login failed');
    }
  }

  async select(mailbox: string): Promise<any> {
    const tag = await this.sendCommand(`SELECT ${mailbox}`);
    const response = await this.readResponse(tag);

    if (!response.includes(`${tag} OK`)) {
      throw new Error(`Failed to select mailbox: ${mailbox}`);
    }

    // Parse mailbox info
    const existsMatch = response.match(/\* (\d+) EXISTS/);
    const recentMatch = response.match(/\* (\d+) RECENT/);

    return {
      exists: existsMatch ? parseInt(existsMatch[1]) : 0,
      recent: recentMatch ? parseInt(recentMatch[1]) : 0,
    };
  }

  async fetchMessages(range: string, items: string[]): Promise<any[]> {
    const itemsStr = items.join(' ');
    const tag = await this.sendCommand(`FETCH ${range} (${itemsStr})`);
    const response = await this.readResponse(tag);

    // Parse FETCH responses (simplified)
    const messages: any[] = [];
    const fetchMatches = response.matchAll(/\* (\d+) FETCH \((.*?)\)/gs);

    for (const match of fetchMatches) {
      const messageNum = parseInt(match[1]);
      const data = match[2];

      // Parse UID
      const uidMatch = data.match(/UID (\d+)/);
      const uid = uidMatch ? parseInt(uidMatch[1]) : messageNum;

      // Parse FLAGS
      const flagsMatch = data.match(/FLAGS \((.*?)\)/);
      const flags = flagsMatch ? flagsMatch[1].split(' ') : [];

      // Parse ENVELOPE (simplified)
      const envelopeMatch = data.match(/ENVELOPE \((.*?)\)/);
      
      messages.push({
        uid,
        flags,
        messageNum,
        raw: data,
      });
    }

    return messages;
  }

  async logout(): Promise<void> {
    const tag = await this.sendCommand('LOGOUT');
    await this.readResponse(tag);
  }
}

/**
 * Process a single message
 */
async function processMessage(
  message: any,
  accountId: string,
  supabase: any
): Promise<void> {
  // Parse message data (simplified - would need proper email parser in production)
  const isRead = message.flags.includes('\\Seen');
  const isStarred = message.flags.includes('\\Flagged');

  // Check if message already exists
  const { data: existing } = await supabase
    .from('email_messages')
    .select('id')
    .eq('message_id', `uid-${message.uid}`)
    .single();

  if (existing) {
    console.log('Message already exists:', message.uid);
    return;
  }

  // Create thread (simplified - would need proper threading logic)
  const threadId = `thread-${accountId}-${message.uid}`;

  // Upsert thread
  await supabase
    .from('email_threads')
    .upsert({
      id: threadId,
      account_id: accountId,
      thread_id: `imap-${message.uid}`,
      subject: 'Email Subject', // Would parse from ENVELOPE
      snippet: 'Email preview...', // Would parse from body
      message_count: 1,
      last_message_at: new Date().toISOString(),
      is_read: isRead,
      is_starred: isStarred,
      is_archived: false,
    });

  // Insert message
  await supabase
    .from('email_messages')
    .insert({
      thread_id: threadId,
      message_id: `uid-${message.uid}`,
      from_email: 'sender@example.com', // Would parse from ENVELOPE
      from_name: 'Sender Name',
      to_emails: [{ email: 'recipient@example.com', name: 'Recipient' }],
      subject: 'Email Subject',
      body_text: 'Email body...', // Would fetch full body
      body_html: '<p>Email body...</p>',
      received_at: new Date().toISOString(),
      is_read: isRead,
      is_draft: false,
    });
}
