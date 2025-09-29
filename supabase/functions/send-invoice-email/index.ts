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
  includePaymentLink?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, recipientEmail, recipientName, subject, message, includePaymentLink = true }: SendInvoiceEmailRequest = await req.json();
    
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

    // Generate payment link if requested and not already exists
    let paymentLinkUrl = invoice.payment_link_url;
    
    if (includePaymentLink && !paymentLinkUrl) {
      try {
        console.log('Generating payment link for invoice:', invoiceId);
        
        // Initialize Stripe
        const stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
        const stripeClient = new stripe(Deno.env.get("STRIPE_LIVE_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        // Check if customer exists in Stripe
        let customerId = null;
        if (invoice.customer_email) {
          const customers = await stripeClient.customers.list({ 
            email: invoice.customer_email, 
            limit: 1 
          });
          
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
          } else {
            // Create new customer
            const customer = await stripeClient.customers.create({
              email: invoice.customer_email,
              name: invoice.customer_name,
            });
            customerId = customer.id;
          }
        }

        // Create checkout session
        const session = await stripeClient.checkout.sessions.create({
          customer: customerId,
          customer_email: customerId ? undefined : invoice.customer_email,
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `Factuur ${invoice.invoice_number}`,
                  description: invoice.project_title || 'Factuur betaling',
                },
                unit_amount: Math.round(invoice.total_amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${req.headers.get("origin") || "https://smanscrm.nl"}/invoices/${invoiceId}?payment=success`,
          cancel_url: `${req.headers.get("origin") || "https://smanscrm.nl"}/invoices/${invoiceId}?payment=cancelled`,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
          },
          payment_intent_data: {
            metadata: {
              invoice_id: invoice.id,
              invoice_number: invoice.invoice_number,
            }
          }
        });

        paymentLinkUrl = session.url;

        // Store payment link in database
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ 
            payment_link_url: session.url,
            stripe_checkout_session_id: session.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoiceId);

        if (updateError) {
          console.error('Error storing payment link:', updateError);
        } else {
          console.log('Payment link generated and stored successfully');
        }

      } catch (stripeError) {
        console.error('Error generating payment link:', stripeError);
        // Continue with email without payment link
      }
    }

    // Generate PDF attachment
    let attachments = [];
    try {
      const pdfResponse = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId: invoiceId }
      });
      
      if (pdfResponse.data && pdfResponse.data.success) {
        const baseFilename = `factuur-${invoice.invoice_number}`;
        
        // Add main invoice PDF
        attachments.push({
          filename: pdfResponse.data.filename || `${baseFilename}.pdf`,
          content: pdfResponse.data.pdfData,
          type: pdfResponse.data.contentType || 'application/pdf'
        });
        
        console.log('PDF attachment generated successfully:', attachments.length, 'files');
      }
    } catch (pdfError) {
      console.error('Failed to generate PDF attachment:', pdfError);
      // Continue without attachment
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
          .invoice-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .payment-button { transition: all 0.3s ease; }
          .payment-button:hover { transform: translateY(-2px); box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15) !important; }
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
            
            <p>${message || 'Hierbij ontvangt u onze factuur.'}</p>
            
            <div class="invoice-details">
              <h3>Factuur Details:</h3>
              <p><strong>Factuurnummer:</strong> ${invoice.invoice_number}</p>
              <p><strong>Datum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
              <p><strong>Vervaldatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
              <p><strong>Project:</strong> ${invoice.project_title || 'Niet gespecificeerd'}</p>
              <p><strong>Totaalbedrag:</strong> €${invoice.total_amount.toFixed(2)}</p>
            </div>
            
            ${paymentLinkUrl ? `
            <div style="text-align: center; margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-radius: 12px; box-shadow: 0 8px 16px rgba(22, 163, 74, 0.3);">
              <h3 style="color: white; margin-bottom: 15px; font-size: 18px;">💳 Online Betalen</h3>
              <a href="${paymentLinkUrl}" 
                 style="background-color: white; 
                        color: #16a34a; 
                        padding: 15px 35px; 
                        text-decoration: none; 
                        border-radius: 50px; 
                        font-weight: bold; 
                        font-size: 18px; 
                        display: inline-block;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        transition: all 0.3s ease;">
                Betaal €${(invoice.total_amount || 0).toFixed(2)} Nu
              </a>
              <p style="margin-top: 15px; font-size: 14px; color: rgba(255,255,255,0.9);">
                ✅ Veilig betalen met iDEAL, creditcard of bancontact<br>
                ⚡ Direct verwerkt - geen wachttijden<br>
                🔒 100% beveiligd via Stripe
              </p>
            </div>
            ` : ''}
            
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