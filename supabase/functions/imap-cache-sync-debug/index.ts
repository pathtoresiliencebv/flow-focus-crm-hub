import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Password decryption
async function decryptPassword(encrypted: string): Promise<string> {
  console.log('🔐 [DECRYPT] Starting decryption...');
  if (!encrypted) throw new Error('Encrypted password cannot be empty');
  
  const keyString = Deno.env.get('EMAIL_ENCRYPTION_KEY');
  if (!keyString) throw new Error('EMAIL_ENCRYPTION_KEY not set');
  
  console.log('🔐 [DECRYPT] Key found, length:', keyString.length);
  
  const keyData = new TextEncoder().encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const key = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  
  const parts = encrypted.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted password format');
  
  const [ivBase64, encryptedBase64] = parts;
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, encryptedData);
  const result = new TextDecoder().decode(decryptedBuffer);
  
  console.log('✅ [DECRYPT] Password decrypted, length:', result.length);
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 [START] imap-cache-sync-debug v1');
    
    const { accountId } = await req.json();
    console.log('📝 [INPUT] Account ID:', accountId);

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log('🔍 [DB] Fetching account from database...');
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('❌ [DB] Account not found:', accountError);
      throw new Error('Email account not found');
    }

    console.log('✅ [DB] Account found:', account.email_address);
    console.log('📧 [CONFIG] IMAP:', account.imap_host, account.imap_port, account.imap_encryption);

    if (!account.imap_password) {
      throw new Error('IMAP password not found');
    }

    console.log('🔐 [AUTH] Decrypting password...');
    const imapPassword = await decryptPassword(account.imap_password);
    console.log('✅ [AUTH] Password decrypted');

    console.log('🔌 [IMAP] Connecting to', account.imap_host);
    const conn = await Deno.connectTls({
      hostname: account.imap_host,
      port: account.imap_port,
    });
    console.log('✅ [IMAP] Connected!');

    // Read greeting
    const buffer = new Uint8Array(1024);
    const bytesRead = await conn.read(buffer);
    const greeting = new TextDecoder().decode(buffer.subarray(0, bytesRead || 0));
    console.log('📬 [IMAP] Greeting:', greeting.substring(0, 100));

    // Login
    console.log('🔑 [IMAP] Logging in as', account.imap_username);
    const loginCmd = `A0001 LOGIN "${account.imap_username}" "${imapPassword}"\r\n`;
    await conn.write(new TextEncoder().encode(loginCmd));
    
    const loginBuffer = new Uint8Array(1024);
    const loginBytesRead = await conn.read(loginBuffer);
    const loginResponse = new TextDecoder().decode(loginBuffer.subarray(0, loginBytesRead || 0));
    console.log('📬 [IMAP] Login response:', loginResponse.substring(0, 200));

    if (!loginResponse.includes('A0001 OK')) {
      throw new Error('IMAP authentication failed');
    }
    console.log('✅ [IMAP] Login successful!');

    // List folders
    console.log('📂 [IMAP] Listing folders...');
    const listCmd = 'A0002 LIST "" "*"\r\n';
    await conn.write(new TextEncoder().encode(listCmd));
    
    const listBuffer = new Uint8Array(8192);
    let listResponse = '';
    while (true) {
      const listBytesRead = await conn.read(listBuffer);
      if (!listBytesRead) break;
      listResponse += new TextDecoder().decode(listBuffer.subarray(0, listBytesRead));
      if (listResponse.includes('A0002 OK')) break;
    }
    
    const folders: string[] = [];
    const lines = listResponse.split('\n');
    for (const line of lines) {
      const match = line.match(/\* LIST \([^\)]*\) "([^"]*)" "([^"]*)"/);
      if (match) {
        folders.push(match[2]);
      }
    }
    
    console.log('✅ [IMAP] Found', folders.length, 'folders:', folders);

    // Logout
    console.log('👋 [IMAP] Logging out...');
    const logoutCmd = 'A0003 LOGOUT\r\n';
    await conn.write(new TextEncoder().encode(logoutCmd));
    conn.close();

    console.log('✅ [COMPLETE] Debug sync successful!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Debug sync completed',
        account: account.email_address,
        folders: folders,
        foldersCount: folders.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ [ERROR] Caught exception:', error);
    console.error('❌ [ERROR] Name:', error.name);
    console.error('❌ [ERROR] Message:', error.message);
    console.error('❌ [ERROR] Stack:', error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        name: error.name,
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

