import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Nylas from "https://esm.sh/nylas@7.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadAttachmentRequest {
  accountId: string;
  messageId: string;
  attachmentId: string;
}

// Decryption helper function
async function decryptToken(encryptedToken: string): Promise<string> {
  const key = Deno.env.get('EMAIL_ENCRYPTION_KEY');
  if (!key) {
    throw new Error('EMAIL_ENCRYPTION_KEY not configured');
  }
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyData = encoder.encode(key.slice(0, 32));
  
  const combined = new Uint8Array(
    atob(encryptedToken).split('').map(char => char.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📎 Nylas Download Attachment started');

    const { accountId, messageId, attachmentId }: DownloadAttachmentRequest = await req.json();

    if (!accountId || !messageId || !attachmentId) {
      throw new Error('Missing required fields: accountId, messageId, attachmentId');
    }

    // Get Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('nylas_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Nylas account not found');
    }

    console.log('📎 Downloading attachment for account:', account.email_address);

    // Decrypt access token
    const accessToken = await decryptToken(account.access_token);

    // Initialize Nylas with account's access token
    const nylas = new Nylas({
      apiKey: Deno.env.get('NYLAS_API_KEY')!,
    });

    try {
      // Download attachment from Nylas
      console.log('🔄 Downloading attachment from Nylas...');
      const attachment = await nylas.attachments.get({
        identifier: account.grant_id,
        attachmentId: attachmentId,
      });

      console.log('✅ Attachment downloaded:', {
        id: attachment.id,
        filename: attachment.filename,
        size: attachment.size,
        contentType: attachment.contentType,
      });

      // Convert attachment data to base64 for transmission
      const base64Data = Buffer.from(attachment.data).toString('base64');

      return new Response(
        JSON.stringify({
          success: true,
          attachment: {
            id: attachment.id,
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            data: base64Data,
          },
          message: 'Attachment downloaded successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (downloadError: any) {
      console.error('❌ Download attachment error:', downloadError);
      throw downloadError;
    }

  } catch (error: any) {
    console.error('❌ Download attachment error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

