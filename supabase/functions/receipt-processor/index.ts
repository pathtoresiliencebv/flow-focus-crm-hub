import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailReceipt {
  from: string;
  subject: string;
  messageId: string;
  attachments: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  textContent?: string;
  htmlContent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing incoming email receipt...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const emailData: EmailReceipt = await req.json();
    console.log('Email data:', { from: emailData.from, subject: emailData.subject });

    // Process each attachment as a receipt
    for (const attachment of emailData.attachments) {
      // Only process image files as receipts
      if (!attachment.contentType.startsWith('image/')) {
        console.log(`Skipping non-image attachment: ${attachment.filename}`);
        continue;
      }

      try {
        // Upload attachment to storage
        const fileName = `${Date.now()}_${attachment.filename}`;
        const filePath = `email-receipts/${fileName}`;
        
        // Convert base64 to blob
        const fileBuffer = Uint8Array.from(atob(attachment.content), c => c.charCodeAt(0));
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, fileBuffer, {
            contentType: attachment.contentType,
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        console.log('File uploaded successfully:', uploadData);

        // Extract potential amount from email content
        const emailText = emailData.textContent || emailData.htmlContent || '';
        const amountMatch = emailText.match(/€?\s*(\d+[.,]\d{2})/);
        const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

        // Create receipt record in database
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .insert({
            user_id: null, // Will need to be updated by admin
            email_from: emailData.from,
            subject: emailData.subject,
            amount: extractedAmount,
            description: emailData.subject || attachment.filename,
            category: 'Email Import',
            receipt_file_url: filePath,
            receipt_file_name: attachment.filename,
            receipt_file_type: attachment.contentType,
            status: 'pending',
            email_message_id: emailData.messageId
          });

        if (receiptError) {
          console.error('Database error:', receiptError);
          continue;
        }

        console.log('Receipt created successfully:', receiptData);

        // Send notification to administrators
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['Administrator', 'Administratie']);

        if (admins && admins.length > 0) {
          const notifications = admins.map(admin => ({
            user_id: admin.id,
            title: 'Nieuw bonnetje via email',
            message: `Bonnetje ontvangen van ${emailData.from}: ${emailData.subject}`,
            type: 'receipt',
            reference_type: 'receipt',
            reference_id: (receiptData as any)?.[0]?.id
          }));

          await supabase
            .from('user_notifications')
            .insert(notifications);
        }

      } catch (attachmentError) {
        console.error('Error processing attachment:', attachmentError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email processed successfully',
        attachmentsProcessed: emailData.attachments.length
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error processing email receipt:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process email receipt'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);