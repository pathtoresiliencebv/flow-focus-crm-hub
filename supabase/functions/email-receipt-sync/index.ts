import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { connect } from "https://deno.land/x/imap@v0.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailSettings {
  id: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  last_sync_at: string | null;
}

interface EmailMessage {
  uid: number;
  subject: string;
  from: string;
  date: Date;
  attachments: Array<{
    filename: string;
    content: Uint8Array;
    contentType: string;
  }>;
}

async function processEmailAttachment(
  supabase: any,
  attachment: { filename: string; content: Uint8Array; contentType: string },
  fromEmail: string
) {
  try {
    console.log(`Processing attachment: ${attachment.filename} from ${fromEmail}`);
    
    // Check if it's an image or PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(attachment.contentType)) {
      console.log(`Skipping non-receipt file type: ${attachment.contentType}`);
      return;
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = attachment.filename.split('.').pop() || 'bin';
    const fileName = `receipt-${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
    const filePath = `receipts/${fileName}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, attachment.content, {
        contentType: attachment.contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }

    console.log(`File uploaded successfully: ${filePath}`);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    // Insert into bonnetjes table
    const { data: bonnetjeData, error: bonnetjeError } = await supabase
      .from('bonnetjes')
      .insert({
        sender: fromEmail,
        file_name: attachment.filename,
        file_path: urlData.publicUrl
      })
      .select()
      .single();

    if (bonnetjeError) {
      console.error('Error inserting bonnetje:', bonnetjeError);
      return;
    }

    console.log(`Bonnetje created successfully:`, bonnetjeData);

    // Create notification for administrators
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'Administrator');

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin: any) => ({
        user_id: admin.id,
        title: 'Nieuw bonnetje ontvangen',
        message: `Een nieuw bonnetje is ontvangen van ${fromEmail}: ${attachment.filename}`,
        type: 'receipt',
        reference_type: 'bonnetje',
        reference_id: bonnetjeData.id
      }));

      await supabase
        .from('user_notifications')
        .insert(notifications);

      console.log(`Notifications sent to ${admins.length} administrators`);
    }

  } catch (error) {
    console.error('Error processing attachment:', error);
  }
}

async function syncEmailsViaIMAP(emailSettings: EmailSettings, supabase: any) {
  try {
    console.log(`Starting IMAP sync for ${emailSettings.email_address}`);

    // Connect to IMAP server
    const client = await connect({
      hostname: emailSettings.imap_host,
      port: emailSettings.imap_port,
      auth: {
        username: emailSettings.imap_username,
        password: emailSettings.imap_password,
      },
      tls: true,
    });

    console.log('Connected to IMAP server');

    // Select INBOX
    await client.select('INBOX');

    // Calculate date filter (last sync or last 24 hours)
    const sinceDate = emailSettings.last_sync_at 
      ? new Date(emailSettings.last_sync_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Search for recent emails with attachments
    const searchCriteria = [
      'UNSEEN', // Only unread emails
      'SINCE', sinceDate.toISOString().split('T')[0].replace(/-/g, '-')
    ];

    const messageIds = await client.search(searchCriteria);
    console.log(`Found ${messageIds.length} new messages`);

    let processedCount = 0;
    let attachmentCount = 0;

    // Process each message
    for (const uid of messageIds) {
      try {
        // Fetch message with attachments
        const message = await client.fetch(uid, {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          struct: true,
          envelope: true
        });

        if (!message || !message.struct) continue;

        // Extract message details
        const envelope = message.envelope;
        const subject = envelope.subject || 'No Subject';
        const fromAddress = envelope.from?.[0]?.mailbox && envelope.from?.[0]?.host 
          ? `${envelope.from[0].mailbox}@${envelope.from[0].host}`
          : 'unknown@unknown.com';

        console.log(`Processing message: ${subject} from ${fromAddress}`);

        // Check for attachments in message structure
        const attachments: Array<{filename: string; content: Uint8Array; contentType: string}> = [];
        
        function findAttachments(parts: any, depth = 0) {
          if (!parts) return;
          
          if (Array.isArray(parts)) {
            parts.forEach(part => findAttachments(part, depth + 1));
          } else if (parts.disposition && 
                     parts.disposition.type && 
                     parts.disposition.type.toLowerCase() === 'attachment') {
            
            const filename = parts.disposition.params?.filename || 
                           parts.params?.name || 
                           `attachment_${Date.now()}`;
            
            const contentType = parts.type && parts.subtype 
              ? `${parts.type.toLowerCase()}/${parts.subtype.toLowerCase()}`
              : 'application/octet-stream';

            // Only process image and PDF files
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (validTypes.includes(contentType)) {
              console.log(`Found attachment: ${filename} (${contentType})`);
              
              // Fetch attachment content
              try {
                const attachmentData = client.fetch(uid, {
                  bodies: [parts.partID || '1'],
                  struct: false
                });
                
                if (attachmentData && attachmentData.bodies) {
                  const body = attachmentData.bodies[parts.partID || '1'];
                  if (body) {
                    let content: Uint8Array;
                    
                    if (parts.encoding && parts.encoding.toLowerCase() === 'base64') {
                      // Decode base64
                      const decoder = new TextDecoder();
                      const base64String = decoder.decode(body);
                      const binaryString = atob(base64String.replace(/\s/g, ''));
                      content = new Uint8Array(binaryString.length);
                      for (let i = 0; i < binaryString.length; i++) {
                        content[i] = binaryString.charCodeAt(i);
                      }
                    } else {
                      content = new Uint8Array(body);
                    }
                    
                    attachments.push({
                      filename,
                      content,
                      contentType
                    });
                  }
                }
              } catch (fetchError) {
                console.error(`Error fetching attachment ${filename}:`, fetchError);
              }
            }
          } else if (parts.parts) {
            findAttachments(parts.parts, depth + 1);
          }
        }

        findAttachments(message.struct);

        // Process attachments
        for (const attachment of attachments) {
          await processEmailAttachment(supabase, attachment, fromAddress);
          attachmentCount++;
        }

        // Mark message as read
        await client.addFlags(uid, ['\\Seen']);
        processedCount++;

      } catch (messageError) {
        console.error(`Error processing message ${uid}:`, messageError);
      }
    }

    // Close IMAP connection
    await client.close();

    // Update sync status
    await supabase
      .from('user_email_settings')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'completed',
        is_syncing: false
      })
      .eq('id', emailSettings.id);

    console.log(`IMAP sync completed: ${processedCount} emails processed, ${attachmentCount} attachments found`);

    return {
      success: true,
      emailsProcessed: processedCount,
      attachmentsProcessed: attachmentCount
    };

  } catch (error) {
    console.error('IMAP sync error:', error);
    
    // Update error status
    await supabase
      .from('user_email_settings')
      .update({
        sync_status: 'error',
        sync_error_message: error.message,
        is_syncing: false
      })
      .eq('id', emailSettings.id);

    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Email receipt sync started');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email } = await req.json();

    // Get email settings for bonnetjes account
    const { data: emailSettings, error: settingsError } = await supabase
      .from('user_email_settings')
      .select('*')
      .eq('email_address', email || 'bonnetjes@smanscrm.nl')
      .eq('is_active', true)
      .single();

    if (settingsError || !emailSettings) {
      console.error('Email settings not found:', settingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email settings not found' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if already syncing
    if (emailSettings.is_syncing) {
      console.log('Sync already in progress, skipping');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Sync already in progress' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Mark as syncing
    await supabase
      .from('user_email_settings')
      .update({ is_syncing: true, sync_status: 'running' })
      .eq('id', emailSettings.id);

    // Perform IMAP sync
    const result = await syncEmailsViaIMAP(emailSettings, supabase);

    console.log('Email receipt sync completed successfully');

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Email receipt sync error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});