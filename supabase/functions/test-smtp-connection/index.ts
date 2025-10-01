import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestConnectionRequest {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: 'TLS' | 'SSL';
  imapHost: string;
  imapPort: number;
  imapUsername: string;
  imapPassword: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpSecure,
      imapHost,
      imapPort,
      imapUsername,
      imapPassword,
    }: TestConnectionRequest = await req.json();

    console.log('Testing SMTP connection to:', smtpHost);
    console.log('Testing IMAP connection to:', imapHost);

    // Test SMTP connection
    let smtpSuccess = false;
    let smtpError = null;

    try {
      // Using Deno's native TCP connection to test SMTP
      const smtpConn = await Deno.connect({
        hostname: smtpHost,
        port: smtpPort,
      });

      // Read initial greeting
      const buffer = new Uint8Array(1024);
      await smtpConn.read(buffer);
      const greeting = new TextDecoder().decode(buffer);
      console.log('SMTP greeting:', greeting);

      // Send EHLO command
      const ehloCmd = new TextEncoder().encode(`EHLO test.local\r\n`);
      await smtpConn.write(ehloCmd);
      
      await smtpConn.read(buffer);
      const ehloResponse = new TextDecoder().decode(buffer);
      console.log('SMTP EHLO response:', ehloResponse);

      // Send QUIT command
      const quitCmd = new TextEncoder().encode(`QUIT\r\n`);
      await smtpConn.write(quitCmd);
      
      smtpConn.close();
      smtpSuccess = true;
      console.log('SMTP connection successful');
    } catch (error: any) {
      console.error('SMTP connection failed:', error.message);
      smtpError = error.message;
    }

    // Test IMAP connection
    let imapSuccess = false;
    let imapError = null;

    try {
      // Using Deno's native TCP connection to test IMAP
      const imapConn = await Deno.connect({
        hostname: imapHost,
        port: imapPort,
      });

      // Read initial greeting
      const buffer = new Uint8Array(1024);
      await imapConn.read(buffer);
      const greeting = new TextDecoder().decode(buffer);
      console.log('IMAP greeting:', greeting);

      // Send LOGOUT command
      const logoutCmd = new TextEncoder().encode(`A001 LOGOUT\r\n`);
      await imapConn.write(logoutCmd);
      
      imapConn.close();
      imapSuccess = true;
      console.log('IMAP connection successful');
    } catch (error: any) {
      console.error('IMAP connection failed:', error.message);
      imapError = error.message;
    }

    // Return results
    if (smtpSuccess && imapSuccess) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Both SMTP and IMAP connections successful',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      const errors = [];
      if (!smtpSuccess) errors.push(`SMTP: ${smtpError}`);
      if (!imapSuccess) errors.push(`IMAP: ${imapError}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errors.join('; '),
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

  } catch (error: any) {
    console.error('Error in test-smtp-connection:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

