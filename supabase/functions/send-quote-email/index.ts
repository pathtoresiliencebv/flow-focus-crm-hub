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

    // Generate public link for the quote
    const publicUrl = `https://smanscrm.nl/quote/${quote.public_token}`;
    
    // Create email HTML content
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
            <img src="https://smanscrm.nl/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="SMANS" style="max-height: 60px; margin-bottom: 10px;">
            <h1>SMANS BV</h1>
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
            
            <div style="text-align: center;">
              <a href="${publicUrl}" class="button">📄 Bekijk en Goedkeur Offerte</a>
            </div>
            
            <p><strong>Let op:</strong> Deze offerte is geldig tot ${new Date(quote.valid_until).toLocaleDateString('nl-NL')}. Na deze datum vervalt de offerte automatisch.</p>
            
            <p>Voor vragen over deze offerte kunt u contact met ons opnemen.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>SMANS BV</strong><br>
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
          type: pdfResponse.data.contentType
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

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "SMANS BV <offerte@smanscrm.nl>",
      to: [recipientEmail],
      subject: subject || `Offerte ${quote.quote_number} - SMANS BV`,
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

    // Generate public token if not exists
    let publicToken = quote.public_token;
    if (!publicToken) {
      const { data: tokenResult } = await supabase.rpc('generate_quote_public_token');
      publicToken = tokenResult;
    }

    // Update quote status to 'sent' and ensure public token exists
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ 
        status: 'sent',
        public_token: publicToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating quote status:', updateError);
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