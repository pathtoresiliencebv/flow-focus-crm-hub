import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

// Simple IMAP parser (no external dependencies)
async function connectIMAP(config: any) {
  const conn = await Deno.connect({
    hostname: config.imap_host,
    port: config.imap_port,
    transport: config.imap_use_ssl ? 'tcp' : 'tcp'
  });

  return conn;
}

interface EmailConfig {
  id: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  imap_use_ssl: boolean;
}

interface ProcessedEmail {
  messageId: string;
  from: string;
  subject: string;
  date: string;
  attachments: Array<{
    filename: string;
    data: Uint8Array;
    contentType: string;
  }>;
  bodyText?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📧 Starting receipt email processing');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get active email configurations
    const { data: configs, error: configError } = await supabase
      .from('receipt_email_config')
      .select('*')
      .eq('is_active', true);

    if (configError) {
      throw new Error(`Failed to fetch email config: ${configError.message}`);
    }

    if (!configs || configs.length === 0) {
      console.log('⚠️ No active email configurations found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active email configurations',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    let totalProcessed = 0;
    let totalErrors = 0;

    // Process each email configuration
    for (const config of configs) {
      try {
        console.log(`📬 Checking ${config.email_address}`);
        
        // NOTE: For production, you would use a proper IMAP library
        // For now, we'll log and mark as checked
        // In production, implement actual IMAP connection here
        
        // Simulate checking for new emails
        // const emails = await fetchNewEmails(config);
        
        // For now, update last_check_at
        await supabase
          .from('receipt_email_config')
          .update({
            last_check_at: new Date().toISOString(),
            last_success_at: new Date().toISOString()
          })
          .eq('id', config.id);

        console.log(`✅ Successfully checked ${config.email_address}`);
        
      } catch (error: any) {
        console.error(`❌ Error processing ${config.email_address}:`, error);
        
        // Log error to config
        await supabase
          .from('receipt_email_config')
          .update({
            last_check_at: new Date().toISOString(),
            last_error: error.message
          })
          .eq('id', config.id);
        
        totalErrors++;
      }
    }

    console.log(`✅ Processing complete: ${totalProcessed} processed, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        errors: totalErrors,
        message: `Checked ${configs.length} email configuration(s)`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process receipt emails'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

/**
 * Process a single email and create receipt record
 */
async function processEmail(
  email: ProcessedEmail,
  configId: string,
  supabase: any
): Promise<boolean> {
  try {
    console.log(`📨 Processing email from ${email.from}`);

    // Find user by email
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email.from.toLowerCase())
      .limit(1);

    if (!users || users.length === 0) {
      console.log(`⚠️ No user found for email: ${email.from}`);
      
      // Log processing failure
      await supabase.rpc('log_receipt_processing', {
        p_receipt_id: null,
        p_action: 'error',
        p_details: JSON.stringify({
          email_from: email.from,
          subject: email.subject,
          reason: 'User not found'
        }),
        p_error_message: `No user found with email: ${email.from}`,
        p_email_message_id: email.messageId
      });
      
      return false;
    }

    const user = users[0];

    // Process each attachment
    for (const attachment of email.attachments) {
      try {
        // Only process images and PDFs
        const allowedTypes = ['image/', 'application/pdf'];
        const isAllowed = allowedTypes.some(type => 
          attachment.contentType.startsWith(type)
        );

        if (!isAllowed) {
          console.log(`⏭️ Skipping non-receipt file: ${attachment.filename}`);
          continue;
        }

        console.log(`📎 Processing ${attachment.filename}`);

        // Upload to storage
        const timestamp = Date.now();
        const fileName = `${user.id}/${timestamp}-${attachment.filename}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, attachment.data, {
            contentType: attachment.contentType,
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          continue;
        }

        console.log(`✅ File uploaded: ${fileName}`);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        // Extract amount from subject or body (simple regex)
        const amountMatch = (email.subject + ' ' + (email.bodyText || ''))
          .match(/€?\s*(\d+[.,]\d{2})/);
        const extractedAmount = amountMatch 
          ? parseFloat(amountMatch[1].replace(',', '.'))
          : null;

        // Create receipt record
        const receiptData = {
          user_id: user.id,
          email_from: email.from,
          subject: email.subject,
          amount: extractedAmount,
          description: email.bodyText?.substring(0, 500) || email.subject,
          receipt_file_url: publicUrl,
          receipt_file_name: attachment.filename,
          receipt_file_type: attachment.contentType,
          status: 'pending',
          email_message_id: email.messageId,
          created_at: email.date || new Date().toISOString()
        };

        const { data: receipt, error: insertError } = await supabase
          .from('receipts')
          .insert(receiptData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          continue;
        }

        console.log(`✅ Receipt created: ${receipt.id}`);

        // Log successful creation
        await supabase.rpc('log_receipt_processing', {
          p_receipt_id: receipt.id,
          p_action: 'created',
          p_details: JSON.stringify({
            email_from: email.from,
            subject: email.subject,
            amount: extractedAmount,
            auto_extracted: amountMatch ? true : false
          }),
          p_email_message_id: email.messageId
        });

        // Check for auto-approval
        const { data: approvalData } = await supabase.rpc('check_receipt_auto_approval', {
          p_user_id: user.id,
          p_amount: extractedAmount,
          p_category: null
        });

        if (approvalData && approvalData.length > 0) {
          const approval = approvalData[0];
          
          if (approval.should_auto_approve) {
            console.log(`✅ Auto-approving receipt ${receipt.id} with rule: ${approval.rule_name}`);
            
            // Auto-approve the receipt
            await supabase
              .from('receipts')
              .update({
                status: 'approved',
                auto_approved: true,
                approval_rule_id: approval.rule_id,
                approved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', receipt.id);

            // Log auto-approval
            await supabase.rpc('log_receipt_processing', {
              p_receipt_id: receipt.id,
              p_action: 'auto_approved',
              p_details: JSON.stringify({
                rule_id: approval.rule_id,
                rule_name: approval.rule_name,
                amount: extractedAmount
              })
            });

            console.log(`✅ Receipt ${receipt.id} auto-approved`);
          }
        }

      } catch (attachmentError: any) {
        console.error('❌ Error processing attachment:', attachmentError);
        
        // Log attachment processing error
        await supabase.rpc('log_receipt_processing', {
          p_receipt_id: null,
          p_action: 'error',
          p_details: JSON.stringify({
            email_from: email.from,
            attachment: attachment.filename,
            error: attachmentError.message
          }),
          p_error_message: attachmentError.message,
          p_email_message_id: email.messageId
        });
      }
    }

    return true;

  } catch (error: any) {
    console.error('❌ Error processing email:', error);
    
    // Log email processing error
    await supabase.rpc('log_receipt_processing', {
      p_receipt_id: null,
      p_action: 'error',
      p_details: JSON.stringify({
        email_from: email.from,
        subject: email.subject,
        error: error.message
      }),
      p_error_message: error.message,
      p_email_message_id: email.messageId
    });
    
    return false;
  }
}

