import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceEmailRequest {
  invoiceId: string;
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
    const { invoiceId, recipientEmail, recipientName, subject, message }: SendInvoiceEmailRequest = await req.json();
    
    console.log('Sending invoice email for ID:', invoiceId, 'to:', recipientEmail);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Error fetching invoice:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Factuur ${invoice.invoice_number}</title>
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
          .invoice-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://smanscrm.nl/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="SMANS" style="max-height: 60px; margin-bottom: 10px;">
            <h1>SMANS BV</h1>
            <h2>Factuur ${invoice.invoice_number}</h2>
          </div>
          
          <div class="content">
            <p>Beste ${recipientName},</p>
            
            <p>${message || 'Hierbij ontvangt u onze factuur. De betaling is binnen 14 dagen na factuurdatum gewenst.'}</p>
            
            <div class="invoice-details">
              <h3>Factuur Details:</h3>
              <p><strong>Factuurnummer:</strong> ${invoice.invoice_number}</p>
              <p><strong>Factuurdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
              <p><strong>Vervaldatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
              <p><strong>Project:</strong> ${invoice.project_title || 'Niet gespecificeerd'}</p>
              <p><strong>Totaalbedrag:</strong> €${invoice.total_amount.toFixed(2)}</p>
            </div>
            
            <p><strong>Betalingsgegevens:</strong><br>
            IBAN: NL91 ABNA 0417 1643 00<br>
            BIC: ABNANL2A<br>
            Ten name van: SMANS BV<br>
            Onder vermelding van: ${invoice.invoice_number}</p>
            
            <p>Voor vragen over deze factuur kunt u contact met ons opnemen.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>SMANS BV</strong><br>
            Team Administratie</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "SMANS BV <factuur@smanscrm.nl>",
      to: [recipientEmail],
      subject: subject || `Factuur ${invoice.invoice_number} - SMANS BV`,
      html: emailHtml,
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

    // Update invoice status to 'verzonden'
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'verzonden',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
    }

    console.log("Invoice email sent successfully:", emailResponse);

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
    console.error("Error in send-invoice-email function:", error);
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