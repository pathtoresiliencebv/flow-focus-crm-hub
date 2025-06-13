
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
    
    const stripe = new Stripe(Deno.env.get("STIPE_TEST_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create payment link for invoice
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Factuur ${invoiceData.invoiceNumber}`,
              description: `Betaling voor factuur ${invoiceData.invoiceNumber}`,
            },
            unit_amount: Math.round(invoiceData.total * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_number: invoiceData.invoiceNumber,
        customer_name: invoiceData.customerName,
      },
    });

    return new Response(JSON.stringify({ 
      paymentUrl: paymentLink.url,
      paymentLinkId: paymentLink.id 
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
