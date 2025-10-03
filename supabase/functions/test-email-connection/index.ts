/**
 * Test Email Connection Edge Function
 * 
 * Tests both SMTP and IMAP connections with provided credentials
 * Used during email account setup to validate configuration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestConnectionRequest {
  smtp?: {
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: 'tls' | 'ssl' | 'none';
  };
  imap?: {
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: 'ssl' | 'tls' | 'none';
  };
  testEmail?: string; // Email address to send test email to
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const requestData: TestConnectionRequest = await req.json();
    const results: any = {
      smtp: null,
      imap: null,
      overall: 'unknown',
    };

    // Test SMTP if provided
    if (requestData.smtp) {
      console.log('Testing SMTP connection:', {
        host: requestData.smtp.host,
        port: requestData.smtp.port,
        username: requestData.smtp.username,
      });

      try {
        const smtpClient = new SMTPClient({
          connection: {
            hostname: requestData.smtp.host,
            port: requestData.smtp.port,
            tls: requestData.smtp.encryption !== 'none',
            auth: {
              username: requestData.smtp.username,
              password: requestData.smtp.password,
            },
          },
        });

        // Try to connect
        await smtpClient.connect();
        
        // Optionally send a test email
        if (requestData.testEmail) {
          await smtpClient.send({
            from: requestData.smtp.username,
            to: requestData.testEmail,
            subject: '✅ SMTP Test Email - Connection Successful',
            content: 'This is a test email sent from your CRM system.\n\nYour SMTP configuration is working correctly!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d9230f;">✅ SMTP Test Successful!</h2>
                <p>This is a test email sent from your <strong>Flow Focus CRM</strong> system.</p>
                <p>Your SMTP configuration is working correctly!</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                  Sent on: ${new Date().toLocaleString()}<br>
                  From: ${requestData.smtp.username}<br>
                  Server: ${requestData.smtp.host}:${requestData.smtp.port}
                </p>
              </div>
            `,
          });
          console.log('✅ Test email sent successfully');
        }

        await smtpClient.close();

        results.smtp = {
          success: true,
          message: 'SMTP connection successful' + (requestData.testEmail ? ' (test email sent)' : ''),
          details: {
            host: requestData.smtp.host,
            port: requestData.smtp.port,
            encryption: requestData.smtp.encryption,
          },
        };
      } catch (error) {
        console.error('SMTP test failed:', error);
        results.smtp = {
          success: false,
          message: 'SMTP connection failed',
          error: error.message,
          details: {
            host: requestData.smtp.host,
            port: requestData.smtp.port,
            encryption: requestData.smtp.encryption,
          },
        };
      }
    }

    // Test IMAP if provided
    if (requestData.imap) {
      console.log('Testing IMAP connection:', {
        host: requestData.imap.host,
        port: requestData.imap.port,
        username: requestData.imap.username,
      });

      try {
        // For Deno, we'll use a simple socket connection test
        // Full IMAP client would require more complex library
        
        const connection = await Deno.connect({
          hostname: requestData.imap.host,
          port: requestData.imap.port,
          transport: requestData.imap.encryption === 'none' ? 'tcp' : 'tls',
        });

        // Read server greeting
        const buffer = new Uint8Array(1024);
        const bytesRead = await connection.read(buffer);
        const greeting = new TextDecoder().decode(buffer.subarray(0, bytesRead || 0));
        
        console.log('IMAP greeting:', greeting);

        // Send LOGIN command
        const loginCommand = `a001 LOGIN ${requestData.imap.username} ${requestData.imap.password}\r\n`;
        await connection.write(new TextEncoder().encode(loginCommand));

        // Read response
        const responseBuffer = new Uint8Array(1024);
        const responseBytes = await connection.read(responseBuffer);
        const response = new TextDecoder().decode(responseBuffer.subarray(0, responseBytes || 0));
        
        console.log('IMAP login response:', response);

        const success = response.includes('a001 OK');

        if (success) {
          // Send LOGOUT command
          await connection.write(new TextEncoder().encode('a002 LOGOUT\r\n'));
        }

        connection.close();

        results.imap = {
          success,
          message: success ? 'IMAP connection successful' : 'IMAP authentication failed',
          details: {
            host: requestData.imap.host,
            port: requestData.imap.port,
            encryption: requestData.imap.encryption,
            greeting: greeting.substring(0, 100),
          },
        };
      } catch (error) {
        console.error('IMAP test failed:', error);
        results.imap = {
          success: false,
          message: 'IMAP connection failed',
          error: error.message,
          details: {
            host: requestData.imap.host,
            port: requestData.imap.port,
            encryption: requestData.imap.encryption,
          },
        };
      }
    }

    // Determine overall result
    if (results.smtp && results.imap) {
      results.overall = results.smtp.success && results.imap.success ? 'success' : 'partial';
    } else if (results.smtp) {
      results.overall = results.smtp.success ? 'success' : 'failed';
    } else if (results.imap) {
      results.overall = results.imap.success ? 'success' : 'failed';
    }

    return new Response(
      JSON.stringify({
        success: results.overall === 'success' || results.overall === 'partial',
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Test connection error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

