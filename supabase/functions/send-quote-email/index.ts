import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendQuoteEmailRequest {
  quoteId: string;
  recipientEmail: string;
  recipientName: string;
  subject?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, recipientEmail, recipientName, subject, message }: SendQuoteEmailRequest = await req.json();
    
    console.log('Sending quote email for ID:', quoteId, 'to:', recipientEmail);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quoteId)) {
      console.error('Invalid UUID format for quoteId:', quoteId);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid quote ID format',
          details: `Quote ID "${quoteId}" is not a valid UUID format`
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('Error fetching quote:', quoteError);
      return new Response(
        JSON.stringify({ 
          error: 'Quote not found',
          details: quoteError ? quoteError.message : 'No quote found with this ID',
          quoteId: quoteId
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate public token if not exists BEFORE creating email content
    let publicToken = quote.public_token;
    if (!publicToken) {
      console.log('Generating new public token for quote:', quoteId);
      const { data: tokenResult } = await supabase.rpc('generate_quote_public_token');
      publicToken = tokenResult;
      
      // Update the quote immediately with the new token
      const { error: tokenUpdateError } = await supabase
        .from('quotes')
        .update({ public_token: publicToken })
        .eq('id', quoteId);
        
      if (tokenUpdateError) {
        console.error('Error updating quote with public token:', tokenUpdateError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate public token' }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      console.log('Public token generated and saved:', publicToken);
    }
    
    // Generate public link for the quote - use dynamic domain
    const requestUrl = req.headers.get('origin') || req.headers.get('referer');
    let baseUrl = 'https://smanscrm.nl'; // fallback to production
    
    if (requestUrl) {
      try {
        const url = new URL(requestUrl);
        baseUrl = url.origin;
        console.log('Using dynamic base URL:', baseUrl);
      } catch (e) {
        console.warn('Could not parse request URL, using fallback:', requestUrl);
      }
    }
    
    const publicUrl = `${baseUrl}/quote/${publicToken}`;
    console.log('Generated public URL:', publicUrl);
    
    // Fetch company settings for default attachments (organization-based)
    // First get user's organization_id
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', quote.user_id)
      .maybeSingle();
    
    console.log('👤 User organization_id:', userProfile?.organization_id);
    
    // Fetch company settings - prefer organization-based, fallback to user-based
    let companySettingsQuery = supabase
      .from('company_settings')
      .select('default_attachments');
    
    if (userProfile?.organization_id) {
      companySettingsQuery = companySettingsQuery.eq('organization_id', userProfile.organization_id);
    } else {
      companySettingsQuery = companySettingsQuery.eq('user_id', quote.user_id);
    }
    
    const { data: companySettings } = await companySettingsQuery.maybeSingle();
    
    const defaultAttachments = (companySettings?.default_attachments as any[]) || [];
    console.log('📎 Default attachments from settings:', defaultAttachments.length);
    
    // Create email HTML content with prominent quote link
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Offerte ${quote.quote_number}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            background-color: #dc2626; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .quote-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://smanscrm.nl/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="Onderhoud en Service J.J.P. Smans" style="max-height: 60px; margin-bottom: 10px;">
            <h1>Onderhoud en Service J.J.P. Smans</h1>
            <h2>Offerte ${quote.quote_number}</h2>
          </div>
          
          <div class="content">
            <p>Beste ${recipientName},</p>
            
            <p>${message || 'Hierbij ontvangt u onze offerte. U kunt de offerte bekijken en digitaal goedkeuren via onderstaande link.'}</p>
            
            <div class="quote-details">
              <h3>Offerte Details:</h3>
              <p><strong>Offertenummer:</strong> ${quote.quote_number}</p>
              <p><strong>Datum:</strong> ${new Date(quote.quote_date).toLocaleDateString('nl-NL')}</p>
              <p><strong>Geldig tot:</strong> ${new Date(quote.valid_until).toLocaleDateString('nl-NL')}</p>
              <p><strong>Project:</strong> ${quote.project_title || 'Niet gespecificeerd'}</p>
              <p><strong>Totaalbedrag:</strong> €${quote.total_amount.toFixed(2)}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 12px; box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3);">
              <h3 style="color: white; margin-bottom: 15px; font-size: 18px;">📄 Online Offerte Bekijken</h3>
              <a href="${publicUrl}" 
                 style="background-color: white; 
                        color: #dc2626; 
                        padding: 15px 35px; 
                        text-decoration: none; 
                        border-radius: 50px; 
                        font-weight: bold; 
                        font-size: 18px; 
                        display: inline-block;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        transition: all 0.3s ease;">
                🔍 Bekijk Offerte & Onderteken
              </a>
              <p style="margin-top: 15px; font-size: 14px; color: rgba(255,255,255,0.9);">
                ✅ Direct online inzien en goedkeuren<br>
                ⚡ Digitaal ondertekenen mogelijk<br>
                🔒 Veilig en betrouwbaar
              </p>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⏰ Geldigheid:</strong> Deze offerte is geldig tot <strong>${new Date(quote.valid_until).toLocaleDateString('nl-NL')}</strong>. Na deze datum vervalt de offerte automatisch.</p>
            </div>
            
            <div style="background-color: #e0f2fe; border: 1px solid #0288d1; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #01579b;"><strong>💡 Tip:</strong> Klik op de knop hierboven om de offerte online in te zien en direct digitaal goed te keuren. U ontvangt dan automatisch een bevestiging.</p>
            </div>
            
            <p>Voor vragen over deze offerte kunt u contact met ons opnemen.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>Onderhoud en Service J.J.P. Smans</strong><br>
            Team Verkoop</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate PDF attachment
    let attachments = [];
    try {
      const pdfResponse = await supabase.functions.invoke('generate-quote-pdf', {
        body: { quoteId: quoteId }
      });
      
      if (pdfResponse.data && pdfResponse.data.success) {
        const baseFilename = `offerte-${quote.quote_number}`;
        
        // Add main quote PDF
        attachments.push({
          filename: pdfResponse.data.filename || `${baseFilename}.pdf`,
          content: pdfResponse.data.pdfData,
          type: pdfResponse.data.contentType || 'application/pdf'
        });
        
        // If quote is signed, also add signed version
        if (quote.client_signature_data && quote.client_signed_at) {
          const signedPdfResponse = await supabase.functions.invoke('generate-quote-pdf', {
            body: { quoteId: quoteId, includeSigned: true }
          });
          
          if (signedPdfResponse.data && signedPdfResponse.data.success) {
            attachments.push({
              filename: `${baseFilename}-ondertekend.pdf`,
              content: signedPdfResponse.data.pdfData,
              type: signedPdfResponse.data.contentType
            });
          }
        }
        
        console.log('PDF attachment(s) generated successfully:', attachments.length, 'files');
      }
    } catch (pdfError) {
      console.error('Failed to generate PDF attachment:', pdfError);
      // Continue without attachment
    }

    // Add default attachments from company settings
    if (defaultAttachments && defaultAttachments.length > 0) {
      console.log('📎 Adding default attachments:', defaultAttachments.length);
      
      for (const attachment of defaultAttachments) {
        try {
          console.log('⬇️ Downloading default attachment:', attachment.name);
          
          // Download attachment from Supabase Storage
          const response = await fetch(attachment.url);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            
            attachments.push({
              filename: attachment.name,
              content: base64,
              type: attachment.type || 'application/octet-stream'
            });
            
            console.log('✅ Added default attachment:', attachment.name);
          } else {
            console.warn('⚠️ Failed to download default attachment:', attachment.name, response.status);
          }
        } catch (error) {
          console.warn('⚠️ Could not add default attachment:', attachment.name, error);
          // Continue without this attachment - don't fail the entire email
        }
      }
    }
    
    console.log('📧 Total attachments to send:', attachments.length);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Onderhoud en Service J.J.P. Smans <info@smansonderhoud.nl>",
      to: [recipientEmail],
      subject: subject || `Offerte ${quote.quote_number} - Onderhoud en Service J.J.P. Smans`,
      html: emailHtml,
      attachments: attachments
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update quote status to 'sent' (token already generated above)
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating quote status:', updateError);
    }

    // ✨ AUTO-SAVE CUSTOMER EMAIL: Update customer record with email if customer_id exists
    if (quote.customer_id && recipientEmail) {
      console.log('💾 Saving customer email:', { customer_id: quote.customer_id, email: recipientEmail });
      
      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({ 
          email: recipientEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.customer_id);

      if (customerUpdateError) {
        console.error('⚠️ Could not update customer email:', customerUpdateError);
        // Don't fail the whole operation if customer update fails
      } else {
        console.log('✅ Customer email saved successfully');
      }
    }

    console.log("Quote email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        publicUrl: publicUrl 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-quote-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);