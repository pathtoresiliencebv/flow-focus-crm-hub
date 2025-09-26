import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceNumber, customerEmail } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("invoice_number", invoiceNumber)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceNumber}`);
    }

    // Check if invoice is already paid
    if (invoice.status === 'betaald') {
      throw new Error("Invoice is already paid");
    }

    // Get or create payment link
    let paymentUrl = '';
    const { data: existingPayment } = await supabase
      .from("invoice_payments")
      .select("*")
      .eq("invoice_number", invoiceNumber)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingPayment?.metadata?.stripe_payment_link_id) {
      // Use existing payment link
      paymentUrl = `https://buy.stripe.com/${existingPayment.metadata.stripe_payment_link_id}`;
    } else {
      // Create new payment link via existing function
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-invoice-payment', {
        body: {
          invoiceData: {
            invoiceNumber: invoice.invoice_number,
            customerName: invoice.customer_name,
            customerEmail: customerEmail,
            total: invoice.total_amount
          }
        }
      });

      if (paymentError) throw paymentError;
      paymentUrl = paymentData.paymentUrl;
    }

    // Send reminder email
    const emailBody = `
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333;">Betalingsherinnering</h2>
        
        <p>Beste ${invoice.customer_name},</p>
        
        <p>Dit is een vriendelijke herinnering voor de betaling van factuur <strong>${invoice.invoice_number}</strong>.</p>
        
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Factuurgegevens:</h3>
          <p><strong>Factuurnummer:</strong> ${invoice.invoice_number}</p>
          <p><strong>Factuurdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
          <p><strong>Vervaldatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
          <p><strong>Bedrag:</strong> €${invoice.total_amount.toFixed(2)}</p>
          ${invoice.project_title ? `<p><strong>Project:</strong> ${invoice.project_title}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Betaal nu online
          </a>
        </div>
        
        <p>U kunt deze factuur eenvoudig online betalen via de bovenstaande link. Na betaling ontvangt u direct een bevestiging.</p>
        
        <p>Heeft u vragen of is er een probleem met de betaling? Neem dan contact met ons op.</p>
        
        <p>Met vriendelijke groet,<br>
        Smans CRM</p>
        
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          Deze email is automatisch gegenereerd. Reageer niet op deze email.
        </p>
      </div>
    </body>
    </html>
    `;

    // Send email via send-email function
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: customerEmail,
        subject: `Betalingsherinnering factuur ${invoice.invoice_number}`,
        html: emailBody,
        text: `Betalingsherinnering voor factuur ${invoice.invoice_number}. Betaal online: ${paymentUrl}`
      }
    });

    if (emailError) {
      console.error("Error sending reminder email:", emailError);
      throw emailError;
    }

    // Update invoice status to herinnering and log the reminder
    await supabase
      .from("invoices")
      .update({ 
        status: 'herinnering',
        updated_at: new Date().toISOString()
      })
      .eq("invoice_number", invoiceNumber);

    // Log the reminder in invoice_payments table
    await supabase
      .from("invoice_payments")
      .update({
        metadata: {
          ...existingPayment?.metadata,
          reminder_sent_at: new Date().toISOString(),
          reminder_count: (existingPayment?.metadata?.reminder_count || 0) + 1
        }
      })
      .eq("invoice_number", invoiceNumber);

    return new Response(JSON.stringify({
      success: true,
      message: "Payment reminder sent successfully",
      paymentUrl: paymentUrl
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error sending payment reminder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});