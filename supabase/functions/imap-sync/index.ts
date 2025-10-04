/**
 * IMAP Fetch Emails - LIVE MODE (NO DATABASE STORAGE)
 * 
 * Fetches emails directly from IMAP server and returns them
 * Does NOT store emails in database - pure Roundcube-style live reading
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

      // Read greeting (untagged response)
      const greeting = await this.readResponse(10000, false);
      console.log('IMAP greeting:', 
        typeof greeting === 'string' && greeting.length > 0 
          ? greeting.substring(0, Math.min(greeting.length, 100)) 
          : `(invalid greeting: ${typeof greeting}, value: ${String(greeting).substring(0, 50)})`
      );
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
    
    // KEEP SIMPLE QUERY - just add BODYSTRUCTURE for attachment detection
    await this.sendCommand(tag, `FETCH ${range} (UID FLAGS BODYSTRUCTURE BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)] BODY.PEEK[TEXT]<0.500>)`);
    const response = await this.readResponse(60000); // Longer timeout for many emails

    return this.parseMessages(response);
  }

  private parseMessages(response: string): any[] {
    const messages: any[] = [];
    
    try {
      // Split into individual FETCH responses
      const messageBlocks = response.split(/\r?\n\* \d+ FETCH/).slice(1);
      console.log(`📦 Parsing ${messageBlocks.length} message blocks...`);

      for (let i = 0; i < messageBlocks.length; i++) {
        const block = messageBlocks[i];
        
        try {
          // Extract UID (REQUIRED)
          const uidMatch = block.match(/UID (\d+)/);
          if (!uidMatch) {
            console.warn(`⚠️ Message ${i + 1}: No UID found, skipping`);
            continue;
          }
          const uid = parseInt(uidMatch[1]);

          // Extract FLAGS
          const flagsMatch = block.match(/FLAGS \(([^\)]*)\)/);
          const flags = flagsMatch ? flagsMatch[1].split(' ').filter(f => f) : [];

          // Extract FROM header (robust)
          let from = 'Onbekend';
          const fromMatch = block.match(/From:\s*([^\r\n]+)/i);
          if (fromMatch) {
            from = fromMatch[1].trim();
            // Extract email from "Name <email>" format
            const emailMatch = from.match(/<([^>]+)>/);
            if (emailMatch) {
              from = emailMatch[1];
            }
          }

          // Extract SUBJECT header (robust)
          let subject = '(Geen onderwerp)';
          const subjectMatch = block.match(/Subject:\s*([^\r\n]+)/i);
          if (subjectMatch) {
            subject = subjectMatch[1].trim();
            // Decode if encoded (=?UTF-8?...)
            if (subject.includes('=?')) {
              // Basic decode - remove encoding markers
              subject = subject.replace(/=\?[^?]+\?[BQ]\?([^?]+)\?=/gi, '$1');
            }
          }

          // Extract DATE header
          let date = new Date().toISOString();
          const dateMatch = block.match(/Date:\s*([^\r\n]+)/i);
          if (dateMatch) {
            try {
              date = new Date(dateMatch[1].trim()).toISOString();
            } catch {
              // Keep default if date parsing fails
            }
          }

          // Extract BODY (first 500 chars)
          let body = '';
          const bodyMatch = block.match(/BODY\[TEXT\](?:<\d+\.\d+>)?\s*(?:\{(\d+)\})?\r?\n?([\s\S]*)/);
          if (bodyMatch) {
            const bodyText = bodyMatch[2] || '';
            body = bodyText.substring(0, 500).trim();
          }

          // Simple attachment detection from BODYSTRUCTURE
          const attachments: any[] = [];
          const structureMatch = block.match(/BODYSTRUCTURE \(([^\)]+\))/);
          if (structureMatch) {
            const structure = structureMatch[1];
            // Look for "name" or "filename" in structure (indicates attachment)
            if (structure.includes('"name"') || structure.includes('"filename"')) {
              // Extract filename if possible
              const nameMatch = structure.match(/(?:"name"|"filename")\s+"([^"]+)"/i);
              attachments.push({
                filename: nameMatch ? nameMatch[1] : 'bijlage',
                name: nameMatch ? nameMatch[1] : 'bijlage',
              });
            }
          }

          // Create message object compatible with frontend
          messages.push({
            id: `${uid}`,
            uid,
            flags,
            from_email: from,
            to_email: [], // Not fetched for performance
            subject,
            date,
            body_text: body,
            body_html: null,
            attachments: attachments.length > 0 ? attachments : null,
            status: flags.includes('\\Seen') ? 'read' : 'unread',
            is_starred: flags.includes('\\Flagged'),
            folder: 'inbox',
            received_at: date,
            external_message_id: `uid:${uid}`,
          });

          if (i < 5 || i % 50 === 0) {
            console.log(`✅ Parsed message ${i + 1}/${messageBlocks.length}: ${subject.substring(0, 40)}`);
          }
        } catch (error) {
          console.error(`❌ Error parsing message ${i + 1}:`, error);
          // Continue with next message instead of failing completely
        }
      }

      console.log(`✅ Successfully parsed ${messages.length}/${messageBlocks.length} messages`);
    } catch (error) {
      console.error('❌ Fatal parsing error:', error);
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

  private async readResponse(timeoutMs: number = 10000, expectTag: boolean = true): Promise<string> {
    if (!this.connection) throw new Error('Not connected');

    // ✅ FIX: Call the async function immediately to get a Promise!
    return await withTimeout((async () => {
      let response = '';
      const buffer = new Uint8Array(8192);

      while (true) {
        const bytesRead = await this.connection!.read(buffer);
        if (!bytesRead) break;

        response += new TextDecoder().decode(buffer.subarray(0, bytesRead));

        // Check if we have a complete response
        if (expectTag) {
          // Tagged response (command responses)
          if (response.match(/A\d{4} (OK|NO|BAD)/)) {
            break;
          }
        } else {
          // Untagged response (greetings, etc.)
          if (response.includes('\r\n') || response.includes('\n')) {
            break;
          }
        }

        // Prevent infinite loop
        if (response.length > 1024 * 1024) { // 1MB max
          console.warn('Response too large, truncating');
          break;
        }
        
        // If we have SOME data and expectTag is false, don't wait forever
        if (!expectTag && response.length > 0 && bytesRead < buffer.length) {
          // Likely end of greeting
          break;
        }
      }

      console.log('← Response length:', response.length, 'expectTag:', expectTag);
      return response;
    })(), timeoutMs); // ✅ Note the () after the arrow function!
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accountId, fullSync = false, maxMessages = 200 }: SyncRequest = await req.json();

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
      // Default: laatste maxMessages (200), fullSync: alles
      const start = fullSync 
        ? 1  // Fetch ALLE messages
        : Math.max(1, mailboxInfo.exists - maxMessages + 1);  // Laatste 200 messages
      const end = mailboxInfo.exists;

      let messages: any[] = [];
      
      if (end > 0) {
        messages = await imap.fetchMessages(start, end);
        console.log(`📥 Fetched ${messages.length} messages (LIVE - not stored)`);
        syncedCount = messages.length;
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

      console.log('✅ Fetch completed:', { messageCount: syncedCount });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully fetched ${syncedCount} messages`,
          messages, // Return messages directly
          mailboxInfo,
          messageCount: syncedCount,
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
