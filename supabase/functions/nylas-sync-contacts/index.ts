import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Nylas from "https://esm.sh/nylas@7.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncContactsRequest {
  accountId: string;
  fullSync?: boolean;
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
    console.log('👥 Nylas Contact Sync started');

    const { accountId, fullSync = false }: SyncContactsRequest = await req.json();

    if (!accountId) {
      throw new Error('Account ID is required');
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

    console.log('👥 Syncing contacts for account:', account.email_address);

    // Decrypt access token
    const accessToken = await decryptToken(account.access_token);

    // Initialize Nylas with account's access token
    const nylas = new Nylas({
      apiKey: Deno.env.get('NYLAS_API_KEY')!,
    });

    let syncedCount = 0;

    try {
      // Fetch contacts from Nylas
      console.log('🔄 Fetching contacts from Nylas...');
      const contacts = await nylas.contacts.list({
        identifier: account.grant_id,
        queryParams: {
          limit: 1000, // Maximum contacts to sync
        },
      });

      console.log(`👥 Found ${contacts.data.length} contacts to sync`);

      // Process each contact
      for (const contact of contacts.data) {
        try {
          // Check if contact already exists
          const { data: existingContact } = await supabaseClient
            .from('nylas_contacts')
            .select('id')
            .eq('nylas_account_id', accountId)
            .eq('nylas_contact_id', contact.id)
            .single();

          if (existingContact) {
            console.log('⏭️ Contact already exists, updating:', contact.id);
            
            // Update existing contact
            const contactData = {
              email: contact.email || '',
              name: contact.name || '',
              company: contact.company || '',
              phone: contact.phone || '',
              notes: {
                job_title: contact.jobTitle || '',
                birthday: contact.birthday || '',
                source: contact.source || '',
                picture_url: contact.pictureUrl || '',
                raw_data: contact,
              },
            };

            const { error: updateError } = await supabaseClient
              .from('nylas_contacts')
              .update(contactData)
              .eq('id', existingContact.id);

            if (updateError) {
              console.error('❌ Error updating contact:', updateError);
              continue;
            }
          } else {
            // Create new contact
            const contactData = {
              nylas_account_id: accountId,
              nylas_contact_id: contact.id,
              email: contact.email || '',
              name: contact.name || '',
              company: contact.company || '',
              phone: contact.phone || '',
              notes: {
                job_title: contact.jobTitle || '',
                birthday: contact.birthday || '',
                source: contact.source || '',
                picture_url: contact.pictureUrl || '',
                raw_data: contact,
              },
            };

            const { error: insertError } = await supabaseClient
              .from('nylas_contacts')
              .insert(contactData);

            if (insertError) {
              console.error('❌ Error inserting contact:', insertError);
              continue;
            }
          }

          syncedCount++;

        } catch (contactError) {
          console.error('❌ Error processing contact:', contactError);
          continue;
        }
      }

      console.log('✅ Contact sync completed:', {
        contacts: syncedCount,
      });

      return new Response(
        JSON.stringify({
          success: true,
          contactCount: syncedCount,
          message: `Synced ${syncedCount} contacts`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (syncError: any) {
      console.error('❌ Contact sync error:', syncError);
      throw syncError;
    }

  } catch (error: any) {
    console.error('❌ Contact sync error:', error);
    
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



