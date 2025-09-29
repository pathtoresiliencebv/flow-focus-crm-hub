import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    console.log('=== send-quote-email function started ===');
    console.log('Request method:', req.method);
    
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { quoteId, recipientEmail, recipientName, subject, message }: SendQuoteEmailRequest = requestBody;
    
    console.log('Parsed data:', { quoteId, recipientEmail, recipientName });
    
    // Check if Resend API key is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('Resend API key available:', !!resendApiKey);
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

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
    console.log('Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase service key available:', !!supabaseKey);
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get quote details
    console.log('Fetching quote with ID:', quoteId);
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    console.log('Quote fetch result:', { quote: !!quote, error: quoteError });

    if (quoteError || !quote) {
      console.error('Quote not found or error fetching quote:', quoteError);
      return new Response(
        JSON.stringify({ 
          error: 'Quote not found',
          details: quoteError?.message || 'No quote found with this ID'
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Quote found:', quote.quote_number);

    // Generate public URL
    const publicUrl = `https://pvesgvkyiaqmsudmmtkc.supabase.co/storage/v1/object/public/quote-attachments/quote-${quote.quote_number}.pdf`;
    console.log('Generated public URL:', publicUrl);

    // Create email HTML
    const emailSubject = subject || `Offerte ${quote.quote_number} - SMANS BV`;
    const emailMessage = message || "Hierbij ontvangt u de offerte zoals besproken.";
    
<<<<<<< HEAD
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Offerte ${quote.quote_number}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SMANS BV</h1>
        <p>Offerte ${quote.quote_number}</p>
      </div>
      <div class="content">
        <p>Beste ${recipientName},</p>
        <p>${emailMessage}</p>
        <p><strong>Offerte details:</strong></p>
        <ul>
          <li>Offertenummer: ${quote.quote_number}</li>
          <li>Project: ${quote.project_title || 'Niet gespecificeerd'}</li>
          <li>Totaalbedrag: €${parseFloat(quote.total_amount || 0).toFixed(2)}</li>
          <li>Geldig tot: ${new Date(quote.valid_until).toLocaleDateString('nl-NL')}</li>
        </ul>
        <p>Heeft u vragen over deze offerte? Neem dan gerust contact met ons op.</p>
        <p>Met vriendelijke groet,<br>SMANS BV</p>
      </div>
      <div class="footer">
        <p>SMANS BV | Email: info@smanscrm.nl | Website: www.smanscrm.nl</p>
      </div>
    </body>
    </html>
=======
    // Generate public link for the quote
    const publicUrl = `https://smanscrm.nl/quote/${publicToken}`;
    
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
            <strong>SMANS BV</strong><br>
            Team Verkoop</p>
          </div>
        </div>
      </body>
      </html>
>>>>>>> main
    `;

    console.log('Sending email via Resend...');
    
    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "SMANS BV <offerte@smanscrm.nl>",
      to: [recipientEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log('Email response:', emailResponse);

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

    // Update quote status to 'sent'
    console.log('Updating quote status to sent...');
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating quote status:', updateError);
    } else {
      console.log('Quote status updated to sent successfully');
    }

    console.log("Quote email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id
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