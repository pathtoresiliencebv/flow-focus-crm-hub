import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function decryptPassword(encrypted: string): Promise<string> {
  if (!encrypted) throw new Error('Encrypted password cannot be empty');
  
  const keyString = Deno.env.get('EMAIL_ENCRYPTION_KEY');
  if (!keyString) throw new Error('EMAIL_ENCRYPTION_KEY not set');
  
  console.log('🔑 Key exists, length:', keyString.length);
  
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🧪 TEST DECRYPT - START');
    
    const { accountId } = await req.json();
    console.log('Account ID:', accountId);

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

    console.log('✅ Account found:', account.email_address);
    console.log('📧 IMAP Host:', account.imap_host);
    console.log('🔢 IMAP Port:', account.imap_port);
    console.log('👤 Username:', account.imap_username);
    console.log('🔒 Password encrypted length:', account.imap_password?.length);

    if (!account.imap_password) {
      throw new Error('No password found');
    }

    console.log('🔐 Attempting decryption...');
    const decrypted = await decryptPassword(account.imap_password);
    console.log('✅ Decryption SUCCESS! Password length:', decrypted.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Decryption successful',
        accountEmail: account.email_address,
        imapHost: account.imap_host,
        imapPort: account.imap_port,
        passwordDecrypted: true,
        decryptedLength: decrypted.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ TEST ERROR:', error);
    console.error('Stack:', error.stack);
    console.error('Message:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

