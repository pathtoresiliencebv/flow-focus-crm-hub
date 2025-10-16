import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendConfirmationEmailRequest {
  quoteId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId }: SendConfirmationEmailRequest = await req.json();
    
    console.log('Sending quote confirmation email for ID:', quoteId);

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
        JSON.stringify({ error: 'Quote not found' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Only send confirmation if quote is approved and has customer email
    if (quote.status !== 'approved' || !quote.customer_email) {
      console.log('Quote not approved or no customer email:', quote.status, quote.customer_email);
      return new Response(
        JSON.stringify({ success: false, message: 'Quote not approved or no customer email' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate public link for the quote
    const publicUrl = `https://smanscrm.nl/quote/${quote.public_token}`;
    
    // Create confirmation email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bevestiging Goedkeuring Offerte ${quote.quote_number}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            background-color: #22c55e; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .quote-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .success-badge { 
            background-color: #22c55e; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 5px; 
            display: inline-block; 
            margin: 10px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://smanscrm.nl/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="Onderhoud en Service J.J.P. Smans" style="max-height: 60px; margin-bottom: 10px;">
            <h1>Onderhoud en Service J.J.P. Smans</h1>
            <div class="success-badge">✓ OFFERTE GOEDGEKEURD</div>
          </div>
          
          <div class="content">
            <p>Beste ${quote.customer_name},</p>
            
            <p><strong>Bedankt voor de goedkeuring van offerte ${quote.quote_number}!</strong></p>
            
            <p>Uw digitale handtekening is succesvol ontvangen en de offerte is nu definitief goedgekeurd. Wij gaan direct aan de slag met de voorbereidingen voor uw project.</p>
            
            <div class="quote-details">
              <h3>Goedgekeurde Offerte:</h3>
              <p><strong>Offertenummer:</strong> ${quote.quote_number}</p>
              <p><strong>Project:</strong> ${quote.project_title || 'Niet gespecificeerd'}</p>
              <p><strong>Totaalbedrag:</strong> €${((quote.total_amount || 0) + (quote.vat_amount || 0)).toFixed(2)}</p>
              <p><strong>Goedgekeurd op:</strong> ${new Date(quote.client_signed_at).toLocaleDateString('nl-NL')}</p>
              <p><strong>Ondertekend door:</strong> ${quote.client_name}</p>
            </div>
            
            <p>U kunt uw goedgekeurde offerte bekijken en als PDF downloaden via onderstaande link:</p>
            
            <div style="text-align: center;">
              <a href="${publicUrl}" class="button">📄 Bekijk Goedgekeurde Offerte & Download PDF</a>
            </div>
            
            <h3>Wat gebeurt er nu?</h3>
            <p>• Wij hebben automatisch een project aangemaakt in ons systeem<br>
            • U ontvangt binnenkort een concept factuur<br>
            • Ons team neemt contact met u op voor de planning<br>
            • U kunt altijd uw offerte en project status bekijken via bovenstaande link</p>
            
            <p>Voor vragen over uw project kunt u contact met ons opnemen.</p>
            
            <p>Hartelijk dank voor uw vertrouwen in Onderhoud en Service J.J.P. Smans!</p>
            
            <div style="border-top: 3px solid #22c55e; margin-top: 30px; padding-top: 20px;">
              <p style="margin: 0 0 10px 0;">Met vriendelijke groet,</p>
              <p style="margin: 0 0 20px 0;">
                <strong style="font-size: 16px; color: #22c55e;">Onderhoud en Service J.J.P. Smans</strong><br>
                <span style="color: #666; font-size: 14px;">Team Verkoop & Projectbeheer</span>
              </p>
              <p style="margin: 0; font-size: 13px; color: #888; line-height: 1.8;">
                📧 info@smansonderhoud.nl<br>
                📞 +31 (0)6 12345678<br>
                🌐 www.smansonderhoud.nl
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send confirmation email via Resend
    const emailResponse = await resend.emails.send({
      from: "Onderhoud en Service J.J.P. Smans <info@smansonderhoud.nl>",
      to: [quote.customer_email],
      subject: `Bevestiging: Offerte ${quote.quote_number} goedgekeurd - Onderhoud en Service J.J.P. Smans`,
      html: emailHtml
    });

    if (emailResponse.error) {
      console.error("Error sending confirmation email:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Quote confirmation email sent successfully:", emailResponse);

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
    console.error("Error in send-quote-confirmation-email function:", error);
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


