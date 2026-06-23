import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapping de planos para price IDs do Stripe (USD - padrão)
const planPrices: Record<string, string> = {
  start: "price_1T1ZT9DaZO2bVcEocF85HvE9",
  gold: "price_1T1ZTNDaZO2bVcEoNZ0I2aAN",
  premium: "price_1T1ZTbDaZO2bVcEo2L157ZsN",
};

// Mapping de planos para price IDs do Stripe (BRL)
const planPricesBRL: Record<string, string> = {
  start: "price_1TlJkLDaZO2bVcEo3NatnxRx",
  gold: "price_1TlJm9DaZO2bVcEoZyEsOVQl",
  premium: "price_1T2zQLDaZO2bVcEoRulgHg6W",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { plan, currency } = await req.json();
    logStep("Request body parsed", { plan, currency });

    if (!plan || !planPrices[plan]) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Seleciona o price ID correto com base na moeda
    const useBRL = currency === 'BRL';
    const priceId = useBRL ? planPricesBRL[plan] : planPrices[plan];
    logStep("Price selected", { priceId, currency: useBRL ? 'BRL' : 'USD' });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer, will create new");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/?upgrade=success&plan=${plan}`,
      cancel_url: `${req.headers.get("origin")}/?upgrade=cancelled`,
      metadata: {
        user_id: user.id,
        plan: plan,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
