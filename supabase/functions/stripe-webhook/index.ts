import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      throw new Error("Missing Stripe signature or webhook secret");
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case "payment_link.payment_succeeded":
        await handlePaymentSuccess(supabase, event.data.object as Stripe.PaymentLink);
        break;
      
      case "payment_intent.payment_failed":
        await handlePaymentFailed(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      
      case "payment_intent.succeeded":
        await handlePaymentIntentSuccess(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSuccess(supabase, event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handlePaymentSuccess(supabase: any, paymentLink: Stripe.PaymentLink) {
  const invoiceNumber = paymentLink.metadata?.invoice_number;
  
  if (!invoiceNumber) {
    console.error("No invoice number in payment link metadata");
    return;
  }

  // Update invoice status to paid
  const { error: updateError } = await supabase
    .from("invoices")
    .update({ 
      status: "betaald",
      payment_date: new Date().toISOString(),
      payment_method: "stripe",
      stripe_payment_id: paymentLink.id
    })
    .eq("invoice_number", invoiceNumber);

  if (updateError) {
    console.error("Error updating invoice status:", updateError);
    return;
  }

  // Create payment record
  const { error: paymentError } = await supabase
    .from("invoice_payments")
    .insert({
      invoice_number: invoiceNumber,
      amount: paymentLink.line_items?.data[0]?.price?.unit_amount ? 
        paymentLink.line_items.data[0].price.unit_amount / 100 : 0,
      payment_method: "stripe",
      stripe_payment_id: paymentLink.id,
      status: "completed",
      paid_at: new Date().toISOString()
    });

  if (paymentError) {
    console.error("Error creating payment record:", paymentError);
  }

  console.log(`Payment succeeded for invoice: ${invoiceNumber}`);
}

async function handlePaymentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const invoiceNumber = paymentIntent.metadata?.invoice_number;
  
  if (!invoiceNumber) {
    console.error("No invoice number in payment intent metadata");
    return;
  }

  // Update invoice status to payment failed
  const { error } = await supabase
    .from("invoices")
    .update({ 
      status: "betaling_mislukt",
      payment_failure_reason: paymentIntent.last_payment_error?.message
    })
    .eq("invoice_number", invoiceNumber);

  if (error) {
    console.error("Error updating invoice for failed payment:", error);
  }

  console.log(`Payment failed for invoice: ${invoiceNumber}`);
}

async function handlePaymentIntentSuccess(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const invoiceNumber = paymentIntent.metadata?.invoice_number;
  
  if (!invoiceNumber) {
    return; // This might be handled by payment_link.payment_succeeded
  }

  // Update invoice status
  const { error } = await supabase
    .from("invoices")
    .update({ 
      status: "betaald",
      payment_date: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntent.id
    })
    .eq("invoice_number", invoiceNumber);

  if (error) {
    console.error("Error updating invoice for payment intent:", error);
  }
}

async function handleInvoicePaymentSuccess(supabase: any, invoice: Stripe.Invoice) {
  // Handle Stripe invoice payments if using Stripe invoicing
  console.log(`Stripe invoice payment succeeded: ${invoice.id}`);
}