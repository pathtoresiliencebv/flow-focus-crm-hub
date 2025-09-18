import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONFIG-TEST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting Stripe configuration test");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Test authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Test Stripe Live Key
    const stripeKey = Deno.env.get("STRIPE_LIVE_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_LIVE_KEY is not configured");
    }
    logStep("STRIPE_LIVE_KEY found");

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2025-08-27.basil" 
    });

    // Test Stripe connection and get account info
    const account = await stripe.accounts.retrieve();
    logStep("Stripe account retrieved", { 
      id: account.id, 
      country: account.country,
      display_name: account.display_name 
    });

    // Test webhook secret
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const hasWebhookSecret = !!webhookSecret;
    logStep("Webhook secret check", { configured: hasWebhookSecret });

    // Get recent balance
    let balance = null;
    try {
      balance = await stripe.balance.retrieve();
      logStep("Balance retrieved", { 
        available: balance.available[0]?.amount || 0, 
        currency: balance.available[0]?.currency || 'eur' 
      });
    } catch (balanceError) {
      logStep("Balance retrieval failed", { error: balanceError.message });
    }

    // Test products and prices
    const products = await stripe.products.list({ limit: 5 });
    const prices = await stripe.prices.list({ limit: 5 });
    logStep("Products and prices retrieved", { 
      productCount: products.data.length, 
      priceCount: prices.data.length 
    });

    return new Response(JSON.stringify({
      success: true,
      account: {
        id: account.id,
        display_name: account.display_name,
        country: account.country,
        business_type: account.business_type,
        email: account.email
      },
      webhookConfigured: hasWebhookSecret,
      balance: balance ? {
        available: balance.available[0]?.amount || 0,
        currency: balance.available[0]?.currency || 'eur'
      } : null,
      products: products.data.map(p => ({
        id: p.id,
        name: p.name,
        active: p.active
      })),
      prices: prices.data.map(p => ({
        id: p.id,
        unit_amount: p.unit_amount,
        currency: p.currency,
        type: p.type
      })),
      testDate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-config-test", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      testDate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});