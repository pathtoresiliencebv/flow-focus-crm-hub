/**
 * SMTP SEND EMAIL
 * 
 * Send emails via SMTP server (e.g., smtp.hostnet.nl)
 * Supports HTML and plain text, CC, BCC, attachments (future)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptPassword } from '../_shared/emailEncryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  inReplyTo?: string;
  references?: string[];
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

// Simple SMTP Client
class SMTPClient {
  private connection: Deno.Conn | null = null;

  async connect(host: string, port: number, useTLS: boolean): Promise<void> {
    try {
      if (useTLS) {
        console.log(`🔐 Connecting to SMTP ${host}:${port} with TLS...`);
        this.connection = await withTimeout(
          Deno.connectTls({ hostname: host, port: port }),
          10000
        );
      } else {
        console.log(`🔓 Connecting to SMTP ${host}:${port} without TLS...`);
        this.connection = await withTimeout(
          Deno.connect({ hostname: host, port: port }) as Promise<Deno.Conn>,
          10000
        );
      }

      console.log(`✅ Connected to SMTP server ${host}:${port}`);
      
      // Read greeting
      const greeting = await this.readResponse();
      console.log('SMTP greeting:', greeting?.substring(0, 100));
      
      if (!greeting.startsWith('220')) {
        throw new Error('Invalid SMTP greeting');
      }
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      throw new Error(`Failed to connect to SMTP server: ${error.message}`);
    }
  }

  async ehlo(hostname: string = 'localhost'): Promise<void> {
    await this.sendCommand(`EHLO ${hostname}`);
    const response = await this.readResponse();
    
    if (!response.startsWith('250')) {
      throw new Error('EHLO failed');
    }
    console.log('✅ EHLO successful');
  }

  async startTLS(): Promise<void> {
    await this.sendCommand('STARTTLS');
    const response = await this.readResponse();
    
    if (!response.startsWith('220')) {
      throw new Error('STARTTLS failed');
    }
    
    // Upgrade connection to TLS
    const tlsConn = await Deno.startTls(this.connection!, {
      hostname: 'smtp.hostnet.nl', // TODO: Make dynamic
    });
    this.connection = tlsConn;
    
    // Re-send EHLO after TLS
    await this.ehlo();
  }

  async login(username: string, password: string): Promise<void> {
    await this.sendCommand('AUTH LOGIN');
    let response = await this.readResponse();
    
    if (!response.startsWith('334')) {
      throw new Error('AUTH LOGIN not supported');
    }

    // Send base64 encoded username
    const encodedUsername = btoa(username);
    await this.sendCommand(encodedUsername);
    response = await this.readResponse();
    
    if (!response.startsWith('334')) {
      throw new Error('Username rejected');
    }

    // Send base64 encoded password
    const encodedPassword = btoa(password);
    await this.sendCommand(encodedPassword);
    response = await this.readResponse();
    
    if (!response.startsWith('235')) {
      throw new Error('Authentication failed');
    }
    
    console.log('✅ SMTP authentication successful');
  }

  async sendEmail(
    from: string,
    to: string[],
    subject: string,
    body: string,
    options: {
      cc?: string[];
      bcc?: string[];
      isHtml?: boolean;
      inReplyTo?: string;
      references?: string[];
    } = {}
  ): Promise<void> {
    // MAIL FROM
    await this.sendCommand(`MAIL FROM:<${from}>`);
    let response = await this.readResponse();
    if (!response.startsWith('250')) {
      throw new Error('MAIL FROM rejected');
    }

    // RCPT TO (all recipients)
    const allRecipients = [...to, ...(options.cc || []), ...(options.bcc || [])];
    for (const recipient of allRecipients) {
      await this.sendCommand(`RCPT TO:<${recipient}>`);
      response = await this.readResponse();
      if (!response.startsWith('250')) {
        throw new Error(`Recipient ${recipient} rejected`);
      }
    }

    // DATA
    await this.sendCommand('DATA');
    response = await this.readResponse();
    if (!response.startsWith('354')) {
      throw new Error('DATA command rejected');
    }

    // Build email headers
    const date = new Date().toUTCString();
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${from.split('@')[1]}>`;
    
    let headers = `From: ${from}\r\n`;
    headers += `To: ${to.join(', ')}\r\n`;
    
    if (options.cc && options.cc.length > 0) {
      headers += `Cc: ${options.cc.join(', ')}\r\n`;
    }
    
    headers += `Subject: ${subject}\r\n`;
    headers += `Date: ${date}\r\n`;
    headers += `Message-ID: ${messageId}\r\n`;
    
    if (options.inReplyTo) {
      headers += `In-Reply-To: ${options.inReplyTo}\r\n`;
    }
    
    if (options.references && options.references.length > 0) {
      headers += `References: ${options.references.join(' ')}\r\n`;
    }
    
    headers += `MIME-Version: 1.0\r\n`;
    headers += `Content-Type: ${options.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8\r\n`;
    headers += `Content-Transfer-Encoding: 8bit\r\n`;
    headers += `\r\n`;
    
    // Send headers + body
    const fullMessage = headers + body + '\r\n.\r\n';
    await this.connection!.write(new TextEncoder().encode(fullMessage));
    
    response = await this.readResponse();
    if (!response.startsWith('250')) {
      throw new Error('Email sending failed');
    }
    
    console.log('✅ Email sent successfully');
  }

  async quit(): Promise<void> {
    if (!this.connection) return;
    
    try {
      await this.sendCommand('QUIT');
      await this.readResponse();
    } catch (error) {
      console.error('QUIT error:', error);
    } finally {
      try {
        this.connection?.close();
      } catch {}
      this.connection = null;
    }
  }

  private async sendCommand(command: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    
    console.log('→', command.substring(0, 50));
    await this.connection.write(new TextEncoder().encode(command + '\r\n'));
  }

  private async readResponse(timeoutMs: number = 10000): Promise<string> {
    if (!this.connection) throw new Error('Not connected');

    return await withTimeout((async () => {
      let response = '';
      const buffer = new Uint8Array(8192);

      while (true) {
        const bytesRead = await this.connection!.read(buffer);
        if (!bytesRead) break;

        response += new TextDecoder().decode(buffer.subarray(0, bytesRead));

        // Check for complete response (ends with \r\n)
        if (response.includes('\r\n')) {
          break;
        }

        if (response.length > 1024 * 1024) {
          console.warn('Response too large, truncating');
          break;
        }
      }

      console.log('← Response:', response.substring(0, 100));
      return response;
    })(), timeoutMs);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      accountId, 
      to, 
      cc, 
      bcc, 
      subject, 
      body, 
      isHtml = false,
      inReplyTo,
      references 
    }: SendEmailRequest = await req.json();

    // Validate required fields
    if (!accountId || !to || to.length === 0 || !subject) {
      throw new Error('Missing required fields: accountId, to, subject');
    }

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

    console.log('📧 Sending email from:', account.email_address);

    // Decrypt password using AES-256-GCM
    const smtpPassword = await decryptPassword(account.smtp_password);

    // Connect to SMTP
    const smtp = new SMTPClient();
    const useTLS = account.smtp_encryption === 'tls' || account.smtp_port === 587;
    
    await smtp.connect(account.smtp_host, account.smtp_port, false); // Start unencrypted
    await smtp.ehlo();
    
    if (useTLS && account.smtp_port === 587) {
      await smtp.startTLS();
    }
    
    await smtp.login(account.smtp_username, smtpPassword);
    
    await smtp.sendEmail(
      account.email_address,
      to,
      subject,
      body,
      { cc, bcc, isHtml, inReplyTo, references }
    );
    
    await smtp.quit();

    console.log('✅ Email sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('SMTP send error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
