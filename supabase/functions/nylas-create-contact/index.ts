import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Nylas from "https://esm.sh/nylas@7.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateContactRequest {
  accountId: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  jobTitle?: string;
  birthday?: string;
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
    console.log('👥 Nylas Create Contact started');

    const {
      accountId,
      email,
      name,
      company,
      phone,
      jobTitle,
      birthday,
    }: CreateContactRequest = await req.json();

    if (!accountId || !email) {
      throw new Error('Missing required fields: accountId, email');
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

    console.log('👥 Creating contact for account:', account.email_address);

    // Decrypt access token
    const accessToken = await decryptToken(account.access_token);

    // Initialize Nylas with account's access token
    const nylas = new Nylas({
      apiKey: Deno.env.get('NYLAS_API_KEY')!,
    });

    try {
      // Create contact in Nylas
      console.log('🔄 Creating contact in Nylas...');
      const contactData = {
        email,
        name: name || '',
        company: company || '',
        phone: phone || '',
        jobTitle: jobTitle || '',
        birthday: birthday || '',
      };

      const createdContact = await nylas.contacts.create({
        identifier: account.grant_id,
        requestBody: contactData,
      });

      console.log('✅ Contact created in Nylas:', createdContact.id);

      // Save contact to database
      const contactRecord = {
        nylas_account_id: accountId,
        nylas_contact_id: createdContact.id,
        email: createdContact.email || '',
        name: createdContact.name || '',
        company: createdContact.company || '',
        phone: createdContact.phone || '',
        notes: {
          job_title: createdContact.jobTitle || '',
          birthday: createdContact.birthday || '',
          source: 'manual',
          picture_url: createdContact.pictureUrl || '',
          raw_data: createdContact,
        },
      };

      const { data: savedContact, error: saveError } = await supabaseClient
        .from('nylas_contacts')
        .insert(contactRecord)
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving contact to database:', saveError);
        throw new Error(`Failed to save contact: ${saveError.message}`);
      }

      console.log('✅ Contact saved to database:', savedContact.id);

      return new Response(
        JSON.stringify({
          success: true,
          contact: {
            id: savedContact.id,
            nylas_contact_id: savedContact.nylas_contact_id,
            email: savedContact.email,
            name: savedContact.name,
            company: savedContact.company,
            phone: savedContact.phone,
          },
          message: 'Contact created successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (createError: any) {
      console.error('❌ Create contact error:', createError);
      throw createError;
    }

  } catch (error: any) {
    console.error('❌ Create contact error:', error);
    
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
