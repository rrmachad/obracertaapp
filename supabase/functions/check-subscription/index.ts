import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapping de product IDs para planos (v4 BRL + v3 BRL + v2 USD + legacy)
const productToPlans: Record<string, string> = {
  // v4 BRL products (current - R$19,90 / R$37,90)
  "prod_UkpPpyTTfKQ8vd": "start",      // Autônomo R$19,90/mês
  "prod_UkpR48UA8gv0jf": "gold",       // Construtora R$37,90/mês
  // v3 BRL products (legacy - prices in BRL)
  "prod_U11STgWm4m9tUW": "start",      // Autônomo R$29,90/mês
  "prod_U11T4TqaTmwfdI": "gold",       // Construtora R$59,90/mês
  "prod_U11TuB6H4fpSp4": "premium",    // Business R$99,90/mês
  // v2 USD products (legacy - prices in USD)
  "prod_TzYalnkoVY2mqM": "start",      // Autônomo v2
  "prod_TzYak5DysG3KB5": "gold",       // Construtora v2
  "prod_TzYa2l84ZRs1VM": "premium",    // Business v2
  // Legacy products (backward compatibility)
  "prod_Ty5KXzCdaVfhhq": "start",      // Autônomo v1
  "prod_Ty5KBT7EeOhDIf": "gold",       // Construtora v1
  "prod_Ty5Kt7Tbf3bw0b": "premium",    // Business v1
  "prod_TtQh5GnS7aHcXR": "start",      // Start original
  "prod_TtQhVPtDIUeOT1": "gold",       // Gold original
  "prod_TtQhJHHgbtRVdm": "premium",    // Premium original
};

const planMaxUsers: Record<string, number> = {
  free: 1,
  start: 2,
  gold: 3,
  premium: 5,
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Always fetch DB subscription first — needed for trial checks
    const { data: dbSub } = await supabaseClient
      .from("subscriptions")
      .select("plan, max_users, status, trial_ends_at, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const now = new Date();
    const trialEndsAt = dbSub?.trial_ends_at ? new Date(dbSub.trial_ends_at) : null;
    const isTrialActive = trialEndsAt !== null && trialEndsAt > now;
    const isTrialExpired = trialEndsAt !== null && trialEndsAt <= now;

    // Expire trial in DB and downgrade to free
    const expireTrial = async () => {
      logStep("Trial expired, downgrading to free", { userId: user.id });
      await supabaseClient
        .from("subscriptions")
        .update({ plan: "free", max_users: 1, trial_ends_at: null })
        .eq("user_id", user.id);
    };

    // ── Check Stripe ────────────────────────────────────────────────────────────
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      // No Stripe customer at all — rely on trial or free
      if (isTrialActive) {
        logStep("No Stripe customer, trial active", { trial_ends_at: dbSub!.trial_ends_at });
        return new Response(JSON.stringify({
          subscribed: false,
          plan: "gold",
          on_trial: true,
          trial_ends_at: dbSub!.trial_ends_at,
          max_users: 3,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }
      if (isTrialExpired) await expireTrial();
      logStep("No customer, no active trial, returning free");
      return new Response(JSON.stringify({ subscribed: false, plan: "free", max_users: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active Stripe subscription found");

      // Manually activated plan (non-trial, non-free, set directly in DB)
      if (dbSub && dbSub.plan !== "free" && dbSub.status === "active" && !dbSub.trial_ends_at) {
        logStep("Manually activated plan in DB, respecting it", { plan: dbSub.plan });
        return new Response(JSON.stringify({
          subscribed: true,
          plan: dbSub.plan,
          max_users: dbSub.max_users,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }

      // Trial takes priority over free if active
      if (isTrialActive) {
        logStep("No active Stripe subscription, trial active", { trial_ends_at: dbSub!.trial_ends_at });
        return new Response(JSON.stringify({
          subscribed: false,
          plan: "gold",
          on_trial: true,
          trial_ends_at: dbSub!.trial_ends_at,
          max_users: 3,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }

      if (isTrialExpired) await expireTrial();
      logStep("No active subscription, no active trial, returning free");
      return new Response(JSON.stringify({ subscribed: false, plan: "free", max_users: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // ── Active Stripe subscription — always takes priority over trial ────────────
    const subscription = subscriptions.data[0];
    const productId = subscription.items.data[0].price.product as string;
    const plan = productToPlans[productId] || "free";
    const maxUsers = planMaxUsers[plan];
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

    logStep("Active Stripe subscription found, overrides trial", {
      subscriptionId: subscription.id, productId, plan, maxUsers,
    });

    // Update DB — clear trial_ends_at since user is now a paying subscriber
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        plan,
        max_users: maxUsers,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: "active",
        trial_ends_at: null, // user converted to paid — trial no longer relevant
      })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Warning: Failed to update subscription in DB", { error: updateError.message });
    } else {
      logStep("Subscription updated in database (trial cleared if present)");
    }

    return new Response(JSON.stringify({
      subscribed: true,
      plan,
      max_users: maxUsers,
      subscription_end: subscriptionEnd,
      stripe_customer_id: customerId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
