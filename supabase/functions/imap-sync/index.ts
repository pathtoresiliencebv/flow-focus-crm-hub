/**
 * IMAP Sync Edge Function - FULL IMPLEMENTATION
 * 
 * Synchronizes emails from IMAP server to database
 * Based on Roundcube functionality
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
  fullSync?: boolean;
  maxMessages?: number;
}

// Timeout utility
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Simple IMAP Client
class IMAPClient {
  private connection: Deno.Conn | null = null;
  private tagCounter = 0;

  async connect(host: string, port: number, useTLS: boolean): Promise<void> {
    try {
      // Deno Edge Runtime: use Deno.connectTls() for TLS, Deno.connect() for plain TCP
      if (useTLS) {
        console.log(`🔐 Connecting to ${host}:${port} with TLS...`);
        this.connection = await withTimeout(
          Deno.connectTls({
            hostname: host,
            port: port,
          }),
          10000
        );
      } else {
        console.log(`🔓 Connecting to ${host}:${port} without TLS...`);
        this.connection = await withTimeout(
          Deno.connect({
            hostname: host,
            port: port,
          }) as Promise<Deno.Conn>,
          10000
        );
      }

      console.log(`✅ Connected to IMAP server ${host}:${port}`);

      // Read greeting
      const greeting = await this.readResponse();
      console.log('IMAP greeting:', greeting.substring(0, 100));
    } catch (error) {
      console.error('❌ IMAP connection failed:', error);
      throw new Error(`Failed to connect to IMAP server: ${error.message}`);
    }
  }

  async login(username: string, password: string): Promise<void> {
    const tag = this.nextTag();
    await this.sendCommand(tag, `LOGIN "${username}" "${password}"`);
    const response = await this.readResponse();
    
    if (!response.includes(`${tag} OK`)) {
      throw new Error('IMAP authentication failed');
    }
    console.log('✅ IMAP login successful');
  }

  async selectMailbox(mailbox: string = 'INBOX'): Promise<{ exists: number; recent: number }> {
    const tag = this.nextTag();
    await this.sendCommand(tag, `SELECT "${mailbox}"`);
    const response = await this.readResponse();

    if (!response.includes(`${tag} OK`)) {
      throw new Error(`Failed to select mailbox: ${mailbox}`);
    }

    // Parse EXISTS and RECENT
    const existsMatch = response.match(/\* (\d+) EXISTS/);
    const recentMatch = response.match(/\* (\d+) RECENT/);

    return {
      exists: existsMatch ? parseInt(existsMatch[1]) : 0,
      recent: recentMatch ? parseInt(recentMatch[1]) : 0,
    };
  }

  async fetchMessages(start: number, end: number): Promise<any[]> {
    const tag = this.nextTag();
    const range = end === -1 ? `${start}:*` : `${start}:${end}`;
    
    await this.sendCommand(tag, `FETCH ${range} (UID FLAGS ENVELOPE BODY.PEEK[HEADER] BODY.PEEK[TEXT])`);
    const response = await this.readResponse(30000); // Longer timeout for fetching

    return this.parseMessages(response);
  }

  private parseMessages(response: string): any[] {
    const messages: any[] = [];
    const messageBlocks = response.split(/\r?\n\* \d+ FETCH/).slice(1);

    for (const block of messageBlocks) {
      try {
        const uidMatch = block.match(/UID (\d+)/);
        const flagsMatch = block.match(/FLAGS \((.*?)\)/);
        const envelopeMatch = block.match(/ENVELOPE \((.*?)\)/s);

        if (!uidMatch) continue;

        const uid = parseInt(uidMatch[1]);
        const flags = flagsMatch ? flagsMatch[1].split(' ') : [];
        
        // Parse envelope (simplified)
        let from = 'Unknown';
        let subject = '(No subject)';
        let date = new Date().toISOString();

        if (envelopeMatch) {
          const envelope = envelopeMatch[1];
          // Very basic envelope parsing - in production use a proper library
          const parts = envelope.split('" "');
          if (parts.length > 2) {
            date = parts[0].replace(/"/g, '');
            subject = parts[1].replace(/"/g, '');
          }
        }

        // Extract body (simplified)
        const bodyMatch = block.match(/BODY\[TEXT\] \{(\d+)\}\r?\n([\s\S]*)/);
        let body = '';
        if (bodyMatch) {
          body = bodyMatch[2].substring(0, parseInt(bodyMatch[1]));
        }

        messages.push({
          uid,
          flags,
          from,
          subject,
          date,
          body: body.substring(0, 500), // Limit body size
          isRead: flags.includes('\\Seen'),
          isStarred: flags.includes('\\Flagged'),
        });
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }

    return messages;
  }

  async logout(): Promise<void> {
    if (!this.connection) return;
    
    try {
      const tag = this.nextTag();
      await this.sendCommand(tag, 'LOGOUT');
      await this.readResponse();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      try {
        this.connection?.close();
      } catch {}
      this.connection = null;
    }
  }

  private nextTag(): string {
    return `A${String(++this.tagCounter).padStart(4, '0')}`;
  }

  private async sendCommand(tag: string, command: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    
    const fullCommand = `${tag} ${command}\r\n`;
    console.log('→', fullCommand.substring(0, 100));
    await this.connection.write(new TextEncoder().encode(fullCommand));
  }

  private async readResponse(timeoutMs: number = 10000): Promise<string> {
    if (!this.connection) throw new Error('Not connected');

    return await withTimeout(async () => {
      let response = '';
      const buffer = new Uint8Array(8192);

      while (true) {
        const bytesRead = await this.connection!.read(buffer);
        if (!bytesRead) break;

        response += new TextDecoder().decode(buffer.subarray(0, bytesRead));

        // Check if we have a complete response
        if (response.match(/A\d{4} (OK|NO|BAD)/)) {
          break;
        }

        // Prevent infinite loop
        if (response.length > 1024 * 1024) { // 1MB max
          console.warn('Response too large, truncating');
          break;
        }
      }

      console.log('← Response length:', response.length);
      return response;
    }, timeoutMs);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accountId, fullSync = false, maxMessages = 50 }: SyncRequest = await req.json();

    // Get Supabase client
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

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email account not found',
          error: accountError?.message,
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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

    console.log('📧 Starting IMAP sync for:', account.email_address);

    // Decrypt password
    const imapPassword = await decryptPassword(account.imap_password);

    // Connect to IMAP
    const imap = new IMAPClient();
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Connect
      await imap.connect(
        account.imap_host,
        account.imap_port,
        account.imap_encryption === 'ssl' || account.imap_encryption === 'tls'
      );

      // Login
      await imap.login(account.imap_username, imapPassword);

      // Select INBOX
      const mailboxInfo = await imap.selectMailbox('INBOX');
      console.log('📬 Mailbox info:', mailboxInfo);

      // Fetch messages
      const start = fullSync ? Math.max(1, mailboxInfo.exists - maxMessages + 1) : mailboxInfo.exists - 10;
      const end = mailboxInfo.exists;

      if (end > 0) {
        const messages = await imap.fetchMessages(start, end);
        console.log(`📥 Fetched ${messages.length} messages`);

        // Store messages in database
        for (const message of messages) {
          try {
            // Create or update thread
            const threadId = `thread-${accountId}-${message.uid}`;
            
            await supabaseClient
              .from('email_threads')
              .upsert({
                id: threadId,
                account_id: accountId,
                thread_id: `imap-${message.uid}`,
                subject: message.subject,
                snippet: message.body.substring(0, 200),
                participants: [{ email: message.from, name: message.from }],
                message_count: 1,
                last_message_at: message.date,
                is_read: message.isRead,
                is_starred: message.isStarred,
                is_archived: false,
                has_attachments: false,
                labels: [],
              });

            // Insert message
            await supabaseClient
              .from('email_messages')
              .upsert({
                thread_id: threadId,
                message_id: `uid-${message.uid}`,
                from_email: message.from,
                from_name: message.from,
                to_emails: [{ email: account.email_address, name: account.display_name }],
                cc_emails: [],
                bcc_emails: [],
                subject: message.subject,
                body_text: message.body,
                body_html: `<p>${message.body}</p>`,
                received_at: message.date,
                is_read: message.isRead,
                is_draft: false,
                labels: [],
              }, {
                onConflict: 'message_id',
                ignoreDuplicates: true,
              });

            syncedCount++;
          } catch (error) {
            console.error('Error storing message:', error);
            errorCount++;
          }
        }
      }

      // Logout
      await imap.logout();

      // Update account
      await supabaseClient
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          connection_status: 'connected',
          last_error: null,
        })
        .eq('id', accountId);

      console.log('✅ Sync completed:', { syncedCount, errorCount });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully synced ${syncedCount} messages`,
          syncedCount,
          errorCount,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error: any) {
      console.error('❌ IMAP sync error:', error);

      // Update account with error
      await supabaseClient
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          connection_status: 'error',
          last_error: error.message,
          last_error_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      throw error;
    } finally {
      await imap.logout();
    }
  } catch (error: any) {
    console.error('IMAP sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
