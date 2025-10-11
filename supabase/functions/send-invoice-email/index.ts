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
  recipientEmail?: string;
  recipientName?: string;
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
    
    console.log('Sending invoice email for ID:', invoiceId);

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
        JSON.stringify({ 
          error: 'Invoice not found',
          details: invoiceError ? invoiceError.message : 'No invoice found with this ID',
          invoiceId: invoiceId
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Use customer details from invoice if not provided in request
    const finalRecipientEmail = recipientEmail || invoice.customer_email;
    const finalRecipientName = recipientName || invoice.customer_name;

    if (!finalRecipientEmail) {
      console.error('No recipient email available');
      return new Response(
        JSON.stringify({ error: 'No recipient email available for this invoice' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Using recipient:', finalRecipientName, '<' + finalRecipientEmail + '>');

    // Always generate payment link if not already exists
    let paymentLinkUrl = invoice.payment_link_url;
    
    if (!paymentLinkUrl && includePaymentLink) {
      try {
        console.log('Generating payment link for invoice:', invoiceId);
        
        // Initialize Stripe
        const stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
        const stripeKey = Deno.env.get("STRIPE_LIVE_KEY");
        
        if (stripeKey) {
          const stripeClient = new stripe(stripeKey, {
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
        } else {
          console.warn('No STRIPE_LIVE_KEY configured, skipping payment link generation');
        }
      } catch (stripeError) {
        console.error('Error generating payment link:', stripeError);
        // Continue with email without payment link
      }
    }

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Factuur ${invoice.invoice_number}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #dc2626, #ef4444);
              color: white;
              padding: 30px 20px; 
              text-align: center;
            }
            .header img {
              max-height: 50px;
              margin-bottom: 15px;
              filter: brightness(0) invert(1);
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header h2 {
              margin: 10px 0 0 0;
              font-size: 18px;
              opacity: 0.9;
            }
            .content {
              padding: 30px 20px;
            }
            .invoice-details { 
              background: #f8fafc; 
              border-left: 4px solid #dc2626;
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 25px; 
            }
            .invoice-details h3 {
              margin-top: 0;
              color: #1f2937;
            }
            .message-content {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              white-space: pre-line;
            }
            .payment-section { 
              background: linear-gradient(135deg, #059669, #10b981);
              color: white;
              padding: 30px 20px; 
              border-radius: 12px; 
              text-align: center;
              margin-bottom: 25px;
            }
            .payment-button { 
              display: inline-block; 
              background: #ffffff;
              color: #059669;
              padding: 16px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 700;
              font-size: 16px;
              margin-top: 15px;
              transition: all 0.3s ease;
              border: 2px solid #ffffff;
            }
            .payment-button:hover {
              background: #f0fff4;
              transform: translateY(-1px);
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }
            .footer { 
              background: #f8fafc;
              padding: 20px; 
              text-align: center;
              font-size: 14px; 
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .company-info {
              margin-top: 15px;
              font-weight: 600;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://smanscrm.nl/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="SMANS BV">
              <h1>SMANS BV</h1>
              <h2>📧 Factuur ${invoice.invoice_number}</h2>
            </div>

            <div class="content">
              <p><strong>Beste ${finalRecipientName},</strong></p>

              <div class="message-content">
                ${message || 'Hierbij ontvangt u onze factuur. Bedankt voor uw vertrouwen in SMANS BV.'}
              </div>

              <div class="invoice-details">
                <h3>📋 Factuurgegevens</h3>
                <p><strong>Factuurnummer:</strong> ${invoice.invoice_number}</p>
                <p><strong>Factuurdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
                <p><strong>Vervaldatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
                <p><strong>Project:</strong> ${invoice.project_title || 'Niet gespecificeerd'}</p>
                <p><strong>Totaalbedrag:</strong> <span style="font-size: 18px; color: #059669; font-weight: 700;">€${invoice.total_amount.toFixed(2)}</span></p>
              </div>
              ${paymentLinkUrl ? `
              <div class="payment-section">
                <h3 style="margin-top: 0; font-size: 22px;">💳 Betaal Nu Online</h3>
                <p style="margin: 15px 0; font-size: 16px; opacity: 0.95;">
                  Betaal uw factuur direct en veilig online met iDEAL of creditcard.<br>
                  Uw betaling wordt direct verwerkt en u ontvangt automatisch een bevestiging.
                </p>
                <a href="${paymentLinkUrl}" class="payment-button">
                  🔒 Betaal €${invoice.total_amount.toFixed(2)}
                </a>
                <p style="font-size: 13px; margin-top: 20px; opacity: 0.8;">
                  Beveiligd door Stripe • SSL versleuteld • 100% veilig
                </p>
              </div>` : ''}
              
              <p>Voor vragen over deze factuur kunt u altijd contact met ons opnemen.</p>
              
              <p style="margin-top: 25px;">
                Met vriendelijke groet,<br>
                <strong>Onderhoud en Service J.J.P. Smans</strong><br>
                <span style="color: #6b7280;">Team Administratie</span>
              </p>
            </div>
            
            <div class="footer">
              <p>Deze email is automatisch gegenereerd vanuit ons factureringssysteem.</p>
              <p>Voor vragen over deze factuur kunt u contact met ons opnemen.</p>
              <div class="company-info">
                <strong>Onderhoud en Service J.J.P. Smans</strong><br>
                📧 info@smansonderhoud.nl • 📞 +31 (0)6 12345678
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

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

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Onderhoud en Service J.J.P. Smans <info@smansonderhoud.nl>",
      to: [finalRecipientEmail],
      subject: subject || `Factuur ${invoice.invoice_number} - Onderhoud en Service J.J.P. Smans`,
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

    // Update invoice status to 'sent'
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
    }

    // ✨ AUTO-SAVE CUSTOMER EMAIL: Update customer record with email if customer_id exists
    if (invoice.customer_id && finalRecipientEmail) {
      console.log('💾 Saving customer email:', { customer_id: invoice.customer_id, email: finalRecipientEmail });
      
      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({ 
          email: finalRecipientEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.customer_id);

      if (customerUpdateError) {
        console.error('⚠️ Could not update customer email:', customerUpdateError);
        // Don't fail the whole operation if customer update fails
      } else {
        console.log('✅ Customer email saved successfully');
      }
    }

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        recipientEmail: finalRecipientEmail,
        invoiceNumber: invoice.invoice_number,
        paymentLink: paymentLinkUrl
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
