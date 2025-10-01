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

    const { accountId } = await req.json();

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found');
    }

    console.log('Syncing IMAP for account:', account.email);

    // Connect to IMAP server
    const imapConn = await Deno.connect({
      hostname: account.imap_host,
      port: account.imap_port,
    });

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Helper function to read response
    async function readResponse(): Promise<string> {
      const buffer = new Uint8Array(4096);
      const n = await imapConn.read(buffer);
      return decoder.decode(buffer.subarray(0, n || 0));
    }

    // Helper function to send command
    async function sendCommand(command: string): Promise<string> {
      await imapConn.write(encoder.encode(command + '\r\n'));
      return await readResponse();
    }

    try {
      // Read greeting
      const greeting = await readResponse();
      console.log('IMAP greeting:', greeting);

      // Login
      const loginResponse = await sendCommand(
        `A001 LOGIN ${account.imap_username} ${account.imap_password}`
      );
      console.log('Login response:', loginResponse);

      if (!loginResponse.includes('OK')) {
        throw new Error('IMAP login failed');
      }

      // Select INBOX
      const selectResponse = await sendCommand('A002 SELECT INBOX');
      console.log('Select response:', selectResponse);

      // Search for recent messages (last 50)
      const searchResponse = await sendCommand('A003 SEARCH ALL');
      console.log('Search response:', searchResponse);

      // Parse message IDs from search response
      const messageIds = searchResponse
        .match(/\* SEARCH (.+)/)?.[1]
        ?.split(' ')
        .filter(id => id && !isNaN(parseInt(id)))
        .map(id => parseInt(id))
        .slice(-50) || []; // Get last 50 messages

      console.log('Found message IDs:', messageIds);

      // Fetch messages
      const messages = [];
      for (const msgId of messageIds) {
        const fetchResponse = await sendCommand(
          `A${1000 + msgId} FETCH ${msgId} (ENVELOPE BODY[HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)] BODY[TEXT])`
        );
        
        // Parse the response (simplified parsing)
        const fromMatch = fetchResponse.match(/From: ([^\r\n]+)/i);
        const toMatch = fetchResponse.match(/To: ([^\r\n]+)/i);
        const subjectMatch = fetchResponse.match(/Subject: ([^\r\n]+)/i);
        const dateMatch = fetchResponse.match(/Date: ([^\r\n]+)/i);
        const messageIdMatch = fetchResponse.match(/Message-ID: ([^\r\n]+)/i);
        
        // Extract body (simplified)
        const bodyMatch = fetchResponse.match(/BODY\[TEXT\]\s*{[^}]*}\r?\n([\s\S]+?)\r?\n\)/);
        
        if (fromMatch && messageIdMatch) {
          messages.push({
            external_id: messageIdMatch[1].trim().replace(/[<>]/g, ''),
            from_email: fromMatch[1].trim(),
            to_email: toMatch?.[1].trim() || account.email,
            subject: subjectMatch?.[1].trim() || '(No Subject)',
            body_text: bodyMatch?.[1].trim() || '',
            body_html: null,
            received_at: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          });
        }
      }

      console.log(`Fetched ${messages.length} messages`);

      // Logout
      await sendCommand('A999 LOGOUT');
      imapConn.close();

      // Store messages in database
      if (messages.length > 0) {
        // First, get or create threads
        for (const msg of messages) {
          // Check if message already exists
          const { data: existingMsg } = await supabaseClient
            .from('email_messages')
            .select('id')
            .eq('external_id', msg.external_id)
            .single();

          if (existingMsg) continue; // Skip if already synced

          // Create or get thread
          const { data: thread, error: threadError } = await supabaseClient
            .from('email_threads')
            .upsert({
              account_id: accountId,
              subject: msg.subject,
              last_message_at: msg.received_at,
              participants: [
                { email: msg.from_email, name: msg.from_email.split('@')[0] }
              ],
            }, {
              onConflict: 'account_id,subject',
              ignoreDuplicates: false,
            })
            .select()
            .single();

          if (threadError) {
            console.error('Thread error:', threadError);
            continue;
          }

          // Create message
          const { error: msgError } = await supabaseClient
            .from('email_messages')
            .insert({
              thread_id: thread.id,
              account_id: accountId,
              external_id: msg.external_id,
              from_email: msg.from_email,
              from_name: msg.from_email.split('@')[0],
              subject: msg.subject,
              body_text: msg.body_text,
              body_html: msg.body_html,
              received_at: msg.received_at,
            });

          if (msgError) {
            console.error('Message error:', msgError);
          }
        }
      }

      // Update account last_synced_at
      await supabaseClient
        .from('email_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', accountId);

      return new Response(
        JSON.stringify({
          success: true,
          messageCount: messages.length,
          message: `Synced ${messages.length} messages`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      imapConn.close();
      throw error;
    }

  } catch (error: any) {
    console.error('Error in imap-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

