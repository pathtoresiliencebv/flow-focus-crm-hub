
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { invoiceData } = await req.json();
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate invoice exists and is unpaid
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("invoice_number", invoiceData.invoiceNumber)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceData.invoiceNumber}`);
    }

    if (invoice.status === 'betaald') {
      throw new Error("Invoice is already paid");
    }

    // Create payment link for invoice
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Factuur ${invoiceData.invoiceNumber}`,
              description: `Betaling voor factuur ${invoiceData.invoiceNumber} - ${invoiceData.customerName}`,
            },
            unit_amount: Math.round(invoiceData.total * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoiceData.invoiceNumber,
        customer_name: invoiceData.customerName,
        customer_email: invoiceData.customerEmail || '',
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${Deno.env.get("SITE_URL") || 'https://smanscrm.nl'}/payment/success?invoice=${invoiceData.invoiceNumber}`
        }
      },
      automatic_tax: {
        enabled: true,
      },
    });

    // Create payment record in database
    const { error: paymentError } = await supabase
      .from("invoice_payments")
      .insert({
        invoice_id: invoice.id,
        invoice_number: invoiceData.invoiceNumber,
        amount: invoiceData.total,
        payment_method: 'stripe',
        stripe_payment_id: paymentLink.id,
        status: 'pending',
        metadata: {
          stripe_payment_link_id: paymentLink.id,
          customer_email: invoiceData.customerEmail
        }
      });

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      // Continue anyway, webhook will handle the payment tracking
    }

    // Update invoice status to 'verzonden' if not already
    if (invoice.status === 'concept') {
      await supabase
        .from("invoices")
        .update({ status: 'verzonden', updated_at: new Date().toISOString() })
        .eq("id", invoice.id);
    }

    return new Response(JSON.stringify({ 
      paymentUrl: paymentLink.url,
      paymentLinkId: paymentLink.id,
      invoiceId: invoice.id,
      status: 'payment_link_created'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating payment link:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
