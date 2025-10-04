/**
 * IMAP CACHE SYNC - Store ALL emails in Supabase
 * 
 * Syncs ALL folders (Inbox, Sent, Drafts, Trash, etc) from IMAP to Supabase
 * Stores emails in email_messages table for fast frontend access
 * 
 * Usage:
 * 1. First sync: Fetches ALL emails from ALL folders
 * 2. Incremental: Only new emails since last sync
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Password decryption (inline to avoid module issues)
async function decryptPassword(encrypted: string): Promise<string> {
  if (!encrypted) throw new Error('Encrypted password cannot be empty');
  
  const keyString = Deno.env.get('EMAIL_ENCRYPTION_KEY');
  if (!keyString) throw new Error('EMAIL_ENCRYPTION_KEY not set');
  
  const keyData = new TextEncoder().encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const key = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  
  const parts = encrypted.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted password format');
  
  const [ivBase64, encryptedBase64] = parts;
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, encryptedData);
  return new TextDecoder().decode(decryptedBuffer);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  accountId: string;
  fullSync?: boolean; // If true, sync ALL folders completely
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

// IMAP Client with folder support
class IMAPClient {
  private connection: Deno.Conn | null = null;
  private tagCounter = 0;

  async connect(host: string, port: number, useTLS: boolean): Promise<void> {
    try {
      if (useTLS) {
        console.log(`🔐 Connecting to ${host}:${port} with TLS...`);
        this.connection = await withTimeout(
          Deno.connectTls({ hostname: host, port: port }),
          10000
        );
      } else {
        console.log(`🔓 Connecting to ${host}:${port} without TLS...`);
        this.connection = await withTimeout(
          Deno.connect({ hostname: host, port: port }) as Promise<Deno.Conn>,
          10000
        );
      }

      console.log(`✅ Connected to IMAP server ${host}:${port}`);
      const greeting = await this.readResponse(10000, false);
      console.log('IMAP greeting:', greeting?.substring(0, 100));
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

  /**
   * LIST all folders on the server
   */
  async listFolders(): Promise<string[]> {
    const tag = this.nextTag();
    await this.sendCommand(tag, 'LIST "" "*"');
    const response = await this.readResponse();
    
    const folders: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      // Parse: * LIST (\HasNoChildren) "/" "INBOX"
      const match = line.match(/\* LIST \([^\)]*\) "([^"]*)" "([^"]*)"/);
      if (match) {
        folders.push(match[2]);
      }
    }
    
    console.log('📂 Found folders:', folders);
    return folders;
  }

  async selectMailbox(mailbox: string): Promise<{ exists: number; recent: number }> {
    const tag = this.nextTag();
    await this.sendCommand(tag, `SELECT "${mailbox}"`);
    const response = await this.readResponse();

    if (!response.includes(`${tag} OK`)) {
      throw new Error(`Failed to select mailbox: ${mailbox}`);
    }

    const existsMatch = response.match(/\* (\d+) EXISTS/);
    const recentMatch = response.match(/\* (\d+) RECENT/);

    return {
      exists: existsMatch ? parseInt(existsMatch[1]) : 0,
      recent: recentMatch ? parseInt(recentMatch[1]) : 0,
    };
  }

  /**
   * Fetch ALL messages from a folder
   */
  async fetchAllMessages(start: number, end: number, folder: string): Promise<any[]> {
    if (end < start || end === 0) return [];
    
    const messages: any[] = [];
    
    // Fetch in batches of 50 to avoid timeout
    const batchSize = 50;
    for (let i = start; i <= end; i += batchSize) {
      const batchEnd = Math.min(i + batchSize - 1, end);
      console.log(`📥 Fetching ${folder} messages ${i}-${batchEnd} of ${end}...`);
      
      const batch = await this.fetchMessagesBatch(i, batchEnd, folder);
      messages.push(...batch);
    }
    
    return messages;
  }

  private async fetchMessagesBatch(start: number, end: number, folder: string): Promise<any[]> {
    const tag = this.nextTag();
    const range = `${start}:${end}`;
    
    // Fetch envelope + body
    await this.sendCommand(tag, `FETCH ${range} (UID FLAGS INTERNALDATE ENVELOPE BODY.PEEK[TEXT])`);
    const response = await this.readResponse(60000); // 60s timeout

    return this.parseMessages(response, folder);
  }

  private parseMessages(response: string, folder: string): any[] {
    const messages: any[] = [];
    const messageBlocks = response.split(/\r?\n\* \d+ FETCH/).slice(1);

    for (const block of messageBlocks) {
      try {
        const message = this.parseMessage(block, folder);
        if (message) {
          messages.push(message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }

    return messages;
  }

  private parseMessage(block: string, folder: string): any | null {
    const uidMatch = block.match(/UID (\d+)/);
    if (!uidMatch) return null;

    const uid = parseInt(uidMatch[1]);
    
    // Parse FLAGS
    const flagsMatch = block.match(/FLAGS \(([^\)]*)\)/);
    const flags = flagsMatch ? flagsMatch[1].split(' ').filter(f => f) : [];
    
    // Parse INTERNALDATE
    const dateMatch = block.match(/INTERNALDATE "([^"]*)"/);
    const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
    
    // Parse ENVELOPE (very basic - production needs proper RFC822 parser)
    const envelopeMatch = block.match(/ENVELOPE \(([^\)]+)\)/);
    let from = '';
    let subject = '(No subject)';
    
    if (envelopeMatch) {
      const envelope = envelopeMatch[1];
      // Extract subject (first quoted string in envelope)
      const subjectMatch = envelope.match(/"([^"]*)"/);
      if (subjectMatch && subjectMatch[1]) {
        subject = subjectMatch[1];
      }
      
      // Extract from (very basic)
      const fromMatch = envelope.match(/\(\("([^"]*)" NIL "([^"]*)" "([^"]*)"\)\)/);
      if (fromMatch) {
        const name = fromMatch[1] || '';
        const mailbox = fromMatch[2] || '';
        const host = fromMatch[3] || '';
        from = name ? `${name} <${mailbox}@${host}>` : `${mailbox}@${host}`;
      }
    }
    
    // Parse BODY[TEXT]
    const bodyMatch = block.match(/BODY\[TEXT\] \{(\d+)\}\r?\n([\s\S]*)/);
    let body = '';
    if (bodyMatch) {
      const bodyLength = parseInt(bodyMatch[1]);
      body = bodyMatch[2].substring(0, bodyLength);
    }

    return {
      uid,
      folder,
      flags,
      date,
      from,
      subject,
      body,
      isRead: flags.includes('\\Seen'),
      isStarred: flags.includes('\\Flagged'),
      isAnswered: flags.includes('\\Answered'),
      isDraft: flags.includes('\\Draft'),
      isDeleted: flags.includes('\\Deleted'),
    };
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

    return await withTimeout((async () => {
      let response = '';
      const buffer = new Uint8Array(8192);

      while (true) {
        const bytesRead = await this.connection!.read(buffer);
        if (!bytesRead) break;

        response += new TextDecoder().decode(buffer.subarray(0, bytesRead));

        if (expectTag) {
          if (response.match(/A\d{4} (OK|NO|BAD)/)) {
            break;
          }
        } else {
          if (response.includes('\r\n') || response.includes('\n')) {
            break;
          }
        }

        if (response.length > 10 * 1024 * 1024) {
          console.warn('Response too large, truncating');
          break;
        }
        
        if (!expectTag && response.length > 0 && bytesRead < buffer.length) {
          break;
        }
      }

      return response;
    })(), timeoutMs);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accountId, fullSync = true }: SyncRequest = await req.json();

    // Get account from Supabase
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    console.log('📧 Starting CACHE sync for:', account.email_address);
    console.log('  IMAP settings:', {
      host: account.imap_host,
      port: account.imap_port,
      username: account.imap_username,
      encryption: account.imap_encryption
    });

    // Decrypt password
    if (!account.imap_password) {
      throw new Error('IMAP password not found in account settings');
    }
    
    let imapPassword: string;
    try {
      console.log('🔐 Decrypting IMAP password...');
      imapPassword = await decryptPassword(account.imap_password);
      console.log('✅ Password decrypted successfully');
    } catch (decryptError: any) {
      console.error('❌ Password decryption failed:', decryptError);
      throw new Error(`Failed to decrypt IMAP password: ${decryptError.message}`);
    }

    // Connect to IMAP
    const imap = new IMAPClient();
    try {
      await imap.connect(account.imap_host, account.imap_port, true);
    } catch (connError: any) {
      console.error('❌ IMAP connection failed:', connError);
      throw new Error(`IMAP connection failed: ${connError.message}`);
    }
    
    try {
      await imap.login(account.imap_username, imapPassword);
    } catch (loginError: any) {
      console.error('❌ IMAP login failed:', loginError);
      throw new Error(`IMAP authentication failed: ${loginError.message}`);
    }

    // Get all folders
    const folders = await imap.listFolders();
    console.log(`📂 Found ${folders.length} folders:`, folders);

    let totalSynced = 0;

    // Sync each folder
    for (const folder of folders) {
      console.log(`\n📁 Syncing folder: ${folder}`);
      
      const mailboxInfo = await imap.selectMailbox(folder);
      console.log(`  Messages: ${mailboxInfo.exists}, Recent: ${mailboxInfo.recent}`);

      if (mailboxInfo.exists === 0) continue;

      // Fetch ALL messages in this folder
      // TEMP: Only fetch 10 messages to test
      const maxToFetch = Math.min(10, mailboxInfo.exists);
      console.log(`  🧪 TEST MODE: Fetching only ${maxToFetch} messages`);
      
      const messages = await imap.fetchAllMessages(1, maxToFetch, folder);
      console.log(`  ✅ Fetched ${messages.length} messages`);

      // Save to Supabase email_messages
      for (const msg of messages) {
        try {
          // Validate date
          let receivedAt: string;
          try {
            receivedAt = msg.date ? new Date(msg.date).toISOString() : new Date().toISOString();
          } catch {
            receivedAt = new Date().toISOString();
          }

          const { error: insertError } = await supabaseClient
            .from('email_messages')
            .upsert({
              id: `${accountId}:${folder}:${msg.uid}`,
              user_id: account.user_id,
              direction: folder.toLowerCase().includes('sent') ? 'outbound' : 'inbound',
              from_email: msg.from || 'unknown@unknown.com',
              to_email: [account.email_address],
              subject: msg.subject || '(No subject)',
              body_text: msg.body || '',
              body_html: msg.body || '',
              status: msg.isRead ? 'read' : 'unread',
              is_starred: msg.isStarred || false,
              folder: folder.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              external_message_id: `${folder}:${msg.uid}`,
              received_at: receivedAt,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
            });

          if (insertError) {
            console.error('❌ Error saving message:', insertError, 'Message:', msg);
          } else {
            totalSynced++;
          }
        } catch (err) {
          console.error('❌ Exception saving message:', err, 'Message:', msg);
        }
      }
    }

    await imap.logout();

    // Update account last_sync_at
    await supabaseClient
      .from('email_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', accountId);

    console.log(`\n✅ Cache sync completed: ${totalSynced} messages synced across ${folders.length} folders`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalSynced} messages from ${folders.length} folders`,
        totalMessages: totalSynced,
        folders: folders.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ IMAP cache sync error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

