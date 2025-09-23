import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Imap from "npm:imap";
import { inspect } from "npm:util";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email provider configurations
const PROVIDER_CONFIGS = {
  gmail: {
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false }
  },
  outlook: {
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp-mail.outlook.com', port: 587, secure: false }
  },
  yahoo: {
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 587, secure: false }
  }
};

async function detectEmailProvider(email: string): Promise<string> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain?.includes('gmail')) return 'gmail';
  if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) return 'outlook';
  if (domain?.includes('yahoo')) return 'yahoo';
  
  return 'imap'; // fallback to generic IMAP
}

async function syncViaIMAP(emailSettings: any, supabase: any) {
  return new Promise((resolve, reject) => {
    console.log(`Starting IMAP sync for ${emailSettings.email_address}`);
    
    const startTime = Date.now();
    
    // Create sync log entry
    const logEntry = {
      email_settings_id: emailSettings.id,
      sync_started_at: new Date().toISOString(),
      sync_status: 'running'
    };

    // Update settings to indicate syncing
    supabase
      .from('user_email_settings')
      .update({ is_syncing: true, sync_status: 'running' })
      .eq('id', emailSettings.id)
      .then(() => {
        return supabase
          .from('email_sync_logs')
          .insert(logEntry)
          .select()
          .single();
      })
      .then((logResult: any) => {
        const syncLog = logResult.data;

        const imap = new Imap({
          user: emailSettings.imap_username,
          password: emailSettings.imap_password,
          host: emailSettings.imap_host,
          port: emailSettings.imap_port,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
          connTimeout: 30000, // 30 seconds
          authTimeout: 30000, // 30 seconds
          keepalive: true
        });

    let emailsProcessed = 0;
    let emailsAdded = 0;

    imap.once('ready', () => {
      console.log('Connected to IMAP server');
      
      imap.openBox('INBOX', false, (err: any, box: any) => {
        if (err) {
          console.error('Error opening INBOX:', err);
          reject(err);
          return;
        }
        
        // Calculate date filter (last sync or last 7 days)
        const sinceDate = emailSettings.last_sync_at 
          ? new Date(emailSettings.last_sync_at)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        console.log(`Searching for emails since: ${sinceDate.toISOString()}`);

        // Search for recent emails
        const searchCriteria = [
          ['SINCE', sinceDate]
        ];

        imap.search(searchCriteria, (err: any, results: number[]) => {
          if (err) {
            console.error('Search error:', err);
            reject(err);
            return;
          }

          console.log(`Found ${results.length} messages`);
          
          if (results.length === 0) {
            imap.end();
            resolve({
              success: true,
              emailsProcessed: 0,
              emailsAdded: 0
            });
            return;
          }

          // Fetch message details
          const fetch = imap.fetch(results, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO)', 'TEXT'],
            struct: true
          });

          fetch.on('message', (msg: any, seqno: number) => {
            let headers: any = {};
            let bodyText = '';
            let bodyHtml = '';
            let attachments: Array<{filename: string; content: Buffer; contentType: string}> = [];

            msg.on('body', (stream: any, info: any) => {
              let buffer = '';
              stream.on('data', (chunk: any) => {
                buffer += chunk.toString('ascii');
              });
              stream.once('end', () => {
                if (info.which === 'TEXT') {
                  bodyText = buffer;
                } else {
                  headers = Imap.parseHeader(buffer);
                }
              });
            });

            msg.once('attributes', (attrs: any) => {
              // Process attachments if needed
              if (attrs.struct) {
                function processStruct(struct: any[], path: string = '') {
                  struct.forEach((part: any, index: number) => {
                    const partPath = path ? `${path}.${index + 1}` : `${index + 1}`;
                    
                    if (part.disposition?.type === 'attachment' || part.type === 'application' || part.type === 'image') {
                      const filename = part.disposition?.params?.filename || 
                                     part.params?.name || 
                                     `attachment_${Date.now()}_${index}`;
                      
                      const contentType = part.type && part.subtype 
                        ? `${part.type.toLowerCase()}/${part.subtype.toLowerCase()}`
                        : 'application/octet-stream';

                      attachments.push({
                        filename,
                        content: Buffer.alloc(0), // Placeholder - would fetch actual content
                        contentType
                      });
                    } else if (Array.isArray(part)) {
                      processStruct(part, partPath);
                    }
                  });
                }

                if (Array.isArray(attrs.struct)) {
                  processStruct(attrs.struct);
                }
              }
            });

            msg.once('end', async () => {
              try {
                emailsProcessed++;

                // Extract email data
                const subject = headers.subject?.[0] || 'No Subject';
                const fromHeader = headers.from?.[0] || 'Unknown';
                const toHeader = headers.to?.[0] || emailSettings.email_address;
                const messageId = headers['message-id']?.[0] || `imap-${seqno}-${Date.now()}`;
                const inReplyTo = headers['in-reply-to']?.[0] || null;
                const dateHeader = headers.date?.[0];
                
                // Parse from address and name
                const fromMatch = fromHeader.match(/^(.+?)\s*<(.+)>$/) || fromHeader.match(/^(.+)$/);
                const fromName = fromMatch && fromMatch.length > 2 ? fromMatch[1].trim().replace(/"/g, '') : null;
                const fromAddress = fromMatch && fromMatch.length > 2 ? fromMatch[2].trim() : fromMatch?.[1]?.trim() || fromHeader;

                // Parse date
                let receivedAt = new Date();
                if (dateHeader) {
                  const parsedDate = new Date(dateHeader);
                  if (!isNaN(parsedDate.getTime())) {
                    receivedAt = parsedDate;
                  }
                }

                const syncHash = `${messageId}-${emailSettings.id}`;

                // Check if email already exists
                const { data: existingEmail } = await supabase
                  .from('emails')
                  .select('id')
                  .eq('sync_hash', syncHash)
                  .single();

                if (!existingEmail) {
                  // Insert new email
                  const emailData = {
                    user_id: emailSettings.user_id,
                    email_settings_id: emailSettings.id,
                    subject: subject,
                    from_address: fromAddress,
                    from_name: fromName,
                    to_addresses: [toHeader],
                    body_text: bodyText.replace(/<[^>]*>/g, '').trim(),
                    body_html: bodyText.includes('<') ? bodyText : null,
                    folder: 'inbox',
                    is_read: false,
                    received_at: receivedAt.toISOString(),
                    provider_message_id: messageId,
                    sync_hash: syncHash,
                    in_reply_to: inReplyTo,
                    attachments: attachments.map(att => ({
                      filename: att.filename,
                      contentType: att.contentType,
                      size: att.content.length
                    }))
                  };

                  await supabase
                    .from('emails')
                    .insert(emailData);
                  
                  emailsAdded++;
                  console.log(`Added email: ${subject} from ${fromAddress}`);
                } else {
                  console.log(`Email already exists: ${subject}`);
                }

                // Check if all messages are processed
                if (emailsProcessed === results.length) {
                  imap.end();
                }
              } catch (error) {
                console.error(`Error processing email ${seqno}:`, error);
                emailsProcessed++;
                if (emailsProcessed === results.length) {
                  imap.end();
                }
              }
            });
          });

          fetch.once('error', (err: any) => {
            console.error('Fetch error:', err);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log('Fetch completed');
            setTimeout(() => {
              const syncDuration = Date.now() - startTime;
              
              // Update sync log
              supabase
                .from('email_sync_logs')
                .update({
                  sync_completed_at: new Date().toISOString(),
                  emails_processed: emailsProcessed,
                  emails_added: emailsAdded,
                  sync_status: 'completed',
                  sync_duration_ms: syncDuration
                })
                .eq('id', syncLog?.id)
                .then(() => {
                  // Update settings
                  return supabase
                    .from('user_email_settings')
                    .update({
                      last_sync_at: new Date().toISOString(),
                      sync_status: 'success',
                      sync_error_message: null,
                      is_syncing: false
                    })
                    .eq('id', emailSettings.id);
                })
                .then(() => {
                  console.log(`IMAP sync completed: ${emailsProcessed} emails processed, ${emailsAdded} emails added`);
                  resolve({
                    success: true,
                    emailsProcessed,
                    emailsAdded
                  });
                });
            }, 1000); // Wait 1 second for all processing to complete
          });
        });
      });
    });

        imap.once('error', (err: any) => {
          console.error('IMAP connection error:', err);
          
          const syncDuration = Date.now() - startTime;
          
          // Update sync log with error
          supabase
            .from('email_sync_logs')
            .update({
              sync_completed_at: new Date().toISOString(),
              sync_status: 'failed',
              error_message: err.message,
              sync_duration_ms: syncDuration
            })
            .eq('id', syncLog?.id)
            .then(() => {
              // Update error status
              return supabase
                .from('user_email_settings')
                .update({
                  sync_status: 'error',
                  sync_error_message: err.message,
                  is_syncing: false
                })
                .eq('id', emailSettings.id);
            })
            .then(() => {
              reject(err);
            });
        });

        imap.once('end', () => {
          console.log('IMAP connection ended');
        });

        imap.connect();
      })
      .catch((error: any) => {
        console.error('Error initializing IMAP sync:', error);
        reject(error);
      });
  });
}

async function initiateGmailOAuth(emailSettings: any, supabase: any) {
  // This would redirect to Google OAuth in a real implementation
  // For now, we'll simulate the OAuth flow
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  
  if (!clientId) {
    throw new Error('Google OAuth not configured');
  }

  // In production, this would be the actual OAuth URL
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `scope=https://www.googleapis.com/auth/gmail.readonly&` +
    `redirect_uri=https://your-app.com/oauth/callback`;

  return { oauthUrl, requiresUserAction: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, emailSettingsId, code } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'sync') {
      const { data: emailSettings } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('id', emailSettingsId)
        .single();

      if (!emailSettings) {
        throw new Error('Email settings not found');
      }

      // Detect provider if not set
      if (!emailSettings.provider_type || emailSettings.provider_type === 'imap') {
        const detectedProvider = await detectEmailProvider(emailSettings.email_address);
        await supabase
          .from('user_email_settings')
          .update({ provider_type: detectedProvider })
          .eq('id', emailSettingsId);
        emailSettings.provider_type = detectedProvider;
      }

      let result;
      
      switch (emailSettings.provider_type) {
        case 'gmail':
          if (!emailSettings.oauth_access_token) {
            result = await initiateGmailOAuth(emailSettings, supabase);
          } else {
            result = await syncViaIMAP(emailSettings, supabase);
          }
          break;
        case 'outlook':
          // Similar OAuth flow for Outlook
          result = await syncViaIMAP(emailSettings, supabase);
          break;
        default:
          result = await syncViaIMAP(emailSettings, supabase);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'oauth-callback') {
      // Handle OAuth callback
      // In production, this would exchange the code for tokens
      const { data: emailSettings } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('id', emailSettingsId)
        .single();

      if (emailSettings) {
        // Simulate token storage
        await supabase
          .from('user_email_settings')
          .update({
            oauth_access_token: 'simulated_access_token',
            oauth_refresh_token: 'simulated_refresh_token',
            oauth_token_expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
          })
          .eq('id', emailSettingsId);

        // Now sync emails
        const result = await syncViaIMAP(emailSettings, supabase);
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error) {
    console.error('Email sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});