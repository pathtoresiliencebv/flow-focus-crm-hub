/**
 * Test Email Connection Edge Function
 * 
 * Tests both SMTP and IMAP connections with provided credentials
 * Used during email account setup to validate configuration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
        encryption: requestData.smtp.encryption,
      });

      try {
        // Use basic TCP/TLS connection test
        let connection: Deno.Conn;
        
        // For STARTTLS (port 587), start with plain connection
        if (requestData.smtp.port === 587 || requestData.smtp.encryption === 'tls') {
          console.log('🔓 Testing SMTP with STARTTLS on port 587...');
          connection = await Deno.connect({
            hostname: requestData.smtp.host,
            port: requestData.smtp.port,
          }) as Deno.TcpConn;
          
          // Read greeting
          const buffer = new Uint8Array(1024);
          const bytesRead = await connection.read(buffer);
          const greeting = new TextDecoder().decode(buffer.subarray(0, bytesRead || 0));
          console.log('SMTP greeting:', greeting.substring(0, 100));
          
          if (!greeting.startsWith('220')) {
            throw new Error('Invalid SMTP greeting');
          }
          
          // Send EHLO
          await connection.write(new TextEncoder().encode('EHLO localhost\r\n'));
          const ehloBuffer = new Uint8Array(2048);
          const ehloBytes = await connection.read(ehloBuffer);
          const ehloResponse = new TextDecoder().decode(ehloBuffer.subarray(0, ehloBytes || 0));
          console.log('EHLO response:', ehloResponse.substring(0, 100));
          
          // Send STARTTLS
          await connection.write(new TextEncoder().encode('STARTTLS\r\n'));
          const tlsBuffer = new Uint8Array(1024);
          const tlsBytes = await connection.read(tlsBuffer);
          const tlsResponse = new TextDecoder().decode(tlsBuffer.subarray(0, tlsBytes || 0));
          console.log('STARTTLS response:', tlsResponse.substring(0, 100));
          
          if (!tlsResponse.startsWith('220')) {
            throw new Error('STARTTLS not supported or failed');
          }
          
          // Upgrade to TLS
          const tlsConn = await Deno.startTls(connection, {
            hostname: requestData.smtp.host,
          });
          connection = tlsConn;
          
          // Send EHLO again after TLS
          await connection.write(new TextEncoder().encode('EHLO localhost\r\n'));
          const ehlo2Buffer = new Uint8Array(2048);
          await connection.read(ehlo2Buffer);
          
          console.log('✅ SMTP STARTTLS connection successful');
        } else if (requestData.smtp.encryption === 'ssl' || requestData.smtp.port === 465) {
          // Direct TLS connection (port 465)
          console.log('🔐 Testing SMTP with direct TLS on port 465...');
          connection = await Deno.connectTls({
            hostname: requestData.smtp.host,
            port: requestData.smtp.port,
          });
          
          const buffer = new Uint8Array(1024);
          const bytesRead = await connection.read(buffer);
          const greeting = new TextDecoder().decode(buffer.subarray(0, bytesRead || 0));
          
          if (!greeting.startsWith('220')) {
            throw new Error('Invalid SMTP greeting');
          }
          
          console.log('✅ SMTP SSL connection successful');
        } else {
          // Plain connection (no encryption)
          console.log('🔓 Testing SMTP without encryption...');
          connection = await Deno.connect({
            hostname: requestData.smtp.host,
            port: requestData.smtp.port,
          }) as Deno.TcpConn;
          
          const buffer = new Uint8Array(1024);
          const bytesRead = await connection.read(buffer);
          const greeting = new TextDecoder().decode(buffer.subarray(0, bytesRead || 0));
          
          if (!greeting.startsWith('220')) {
            throw new Error('Invalid SMTP greeting');
          }
          
          console.log('✅ SMTP plain connection successful');
        }
        
        connection.close();

        results.smtp = {
          success: true,
          message: 'SMTP connection successful',
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
        // For Deno Edge Runtime, we need to use fetch API or basic TCP
        // Deno.connect() has limited support in Edge Functions
        
        // Use TLS connection for IMAP
        let connection: Deno.TcpConn;
        
        if (requestData.imap.encryption === 'none') {
          // Plain TCP connection
          connection = await Deno.connect({
            hostname: requestData.imap.host,
            port: requestData.imap.port,
          }) as Deno.TcpConn;
        } else {
          // TLS connection (default for IMAP)
          connection = await Deno.connectTls({
            hostname: requestData.imap.host,
            port: requestData.imap.port,
          });
        }

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

