/**
 * OX MAIL DEBUG
 * 
 * Debug function to test OX Mail API connection
 * and identify the exact issue
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Decrypt password using AES-256-GCM
 */
async function decryptPassword(encrypted: string): Promise<string> {
  if (!encrypted) {
    throw new Error('Encrypted password cannot be empty');
  }

  try {
    const keyString = Deno.env.get('EMAIL_ENCRYPTION_KEY');
    if (!keyString) {
      throw new Error('EMAIL_ENCRYPTION_KEY not set');
    }

    const keyData = new TextEncoder().encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const key = await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format');
    }
    
    const [ivBase64, encryptedBase64] = parts;
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      key,
      encryptedData
    );
    
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 OX Mail Debug started');
    
    const { accountId } = await req.json();
    console.log('🔍 Debug account:', accountId);

    // Get Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get account details
    console.log('🔍 Fetching account from database...');
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('❌ Account error:', accountError);
      throw new Error('Email account not found');
    }

    console.log('✅ Account found:', account.email_address);

    // Test password decryption
    console.log('🔐 Testing password decryption...');
    try {
      const password = await decryptPassword(account.imap_password);
      console.log('✅ Password decrypted successfully');
    } catch (decryptError) {
      console.error('❌ Password decryption failed:', decryptError);
      throw decryptError;
    }

    // Test OX Mail API connection
    console.log('🌐 Testing OX Mail API connection...');
    try {
      const testUrl = 'https://webmail.hostnet.nl/ajax/login?action=login';
      console.log('🔍 Testing URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: new URLSearchParams({
          name: account.email_address,
          password: await decryptPassword(account.imap_password),
        }),
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OX Mail API error:', errorText);
        throw new Error(`OX Mail API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 OX Mail response:', data);

      if (data.error) {
        console.error('❌ OX Mail login error:', data.error);
        throw new Error(`OX Mail login error: ${data.error}`);
      }

      console.log('✅ OX Mail API connection successful');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'OX Mail API connection successful',
          account: {
            email: account.email_address,
            hasPassword: !!account.imap_password
          },
          oxResponse: data,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (apiError: any) {
      console.error('❌ OX Mail API test failed:', apiError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: apiError.message,
          details: {
            account: account.email_address,
            hasPassword: !!account.imap_password,
            errorType: apiError.constructor.name
          },
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error: any) {
    console.error('🔍 Debug function error:', error);

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
