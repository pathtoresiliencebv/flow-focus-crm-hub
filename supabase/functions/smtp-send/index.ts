import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { accountId, to, subject, body, cc, bcc } = await req.json();

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found');
    }

    console.log('Sending email via SMTP:', account.smtp_host);

    // Connect to SMTP server
    const smtpConn = await Deno.connect({
      hostname: account.smtp_host,
      port: account.smtp_port,
    });

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Helper function to read response
    async function readResponse(): Promise<string> {
      const buffer = new Uint8Array(4096);
      const n = await smtpConn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n || 0));
      console.log('SMTP response:', response);
      return response;
    }

    // Helper function to send command
    async function sendCommand(command: string): Promise<string> {
      console.log('SMTP command:', command.replace(/AUTH PLAIN [^\r]+/, 'AUTH PLAIN ***'));
      await smtpConn.write(encoder.encode(command + '\r\n'));
      return await readResponse();
    }

    try {
      // Read greeting
      const greeting = await readResponse();
      if (!greeting.startsWith('220')) {
        throw new Error('SMTP connection failed');
      }

      // EHLO
      const ehloResponse = await sendCommand(`EHLO ${account.smtp_host}`);
      if (!ehloResponse.includes('250')) {
        throw new Error('EHLO failed');
      }

      // STARTTLS if using TLS on port 587
      if (account.smtp_secure && account.smtp_port === 587) {
        const tlsResponse = await sendCommand('STARTTLS');
        if (!tlsResponse.includes('220')) {
          throw new Error('STARTTLS failed');
        }
        // Note: In production, you'd need to upgrade to TLS connection here
        // For now, we'll continue without encryption (not recommended for production)
      }

      // AUTH LOGIN (Base64 encoded)
      const authResponse = await sendCommand('AUTH LOGIN');
      if (!authResponse.includes('334')) {
        throw new Error('AUTH LOGIN failed');
      }

      // Send username (Base64)
      const usernameB64 = btoa(account.smtp_username);
      const userResponse = await sendCommand(usernameB64);
      if (!userResponse.includes('334')) {
        throw new Error('Username authentication failed');
      }

      // Send password (Base64)
      const passwordB64 = btoa(account.smtp_password);
      const passResponse = await sendCommand(passwordB64);
      if (!passResponse.includes('235')) {
        throw new Error('Password authentication failed');
      }

      // MAIL FROM
      const mailFromResponse = await sendCommand(`MAIL FROM:<${account.email}>`);
      if (!mailFromResponse.includes('250')) {
        throw new Error('MAIL FROM failed');
      }

      // RCPT TO
      const recipients = [to, ...(cc || []), ...(bcc || [])];
      for (const recipient of recipients) {
        const rcptResponse = await sendCommand(`RCPT TO:<${recipient}>`);
        if (!rcptResponse.includes('250')) {
          throw new Error(`RCPT TO failed for ${recipient}`);
        }
      }

      // DATA
      const dataResponse = await sendCommand('DATA');
      if (!dataResponse.includes('354')) {
        throw new Error('DATA command failed');
      }

      // Build email
      const messageId = `<${crypto.randomUUID()}@${account.smtp_host}>`;
      const date = new Date().toUTCString();
      
      let emailContent = `From: ${account.display_name || account.email} <${account.email}>\r\n`;
      emailContent += `To: ${to}\r\n`;
      if (cc && cc.length > 0) {
        emailContent += `Cc: ${cc.join(', ')}\r\n`;
      }
      emailContent += `Subject: ${subject}\r\n`;
      emailContent += `Date: ${date}\r\n`;
      emailContent += `Message-ID: ${messageId}\r\n`;
      emailContent += `MIME-Version: 1.0\r\n`;
      emailContent += `Content-Type: text/html; charset=UTF-8\r\n`;
      emailContent += `\r\n`;
      emailContent += body;
      emailContent += `\r\n.\r\n`;

      // Send email content
      await smtpConn.write(encoder.encode(emailContent));
      const sendResponse = await readResponse();
      if (!sendResponse.includes('250')) {
        throw new Error('Email sending failed');
      }

      // QUIT
      await sendCommand('QUIT');
      smtpConn.close();

      // Store sent message in database
      // First create/get thread
      const { data: thread, error: threadError } = await supabaseClient
        .from('email_threads')
        .upsert({
          account_id: accountId,
          subject: subject,
          last_message_at: new Date().toISOString(),
          participants: [
            { email: account.email, name: account.display_name || account.email },
            { email: to, name: to.split('@')[0] }
          ],
        }, {
          onConflict: 'account_id,subject',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (!threadError && thread) {
        // Store message
        await supabaseClient
          .from('email_messages')
          .insert({
            thread_id: thread.id,
            account_id: accountId,
            external_id: messageId,
            from_email: account.email,
            from_name: account.display_name || account.email,
            to_email: to,
            cc_emails: cc || [],
            bcc_emails: bcc || [],
            subject: subject,
            body_html: body,
            sent_at: new Date().toISOString(),
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          messageId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      smtpConn.close();
      throw error;
    }

  } catch (error: any) {
    console.error('Error in smtp-send:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

