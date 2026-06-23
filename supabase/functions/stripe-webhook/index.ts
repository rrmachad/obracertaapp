import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Product ID to plan mapping (same as check-subscription)
const productToPlans: Record<string, string> = {
  // v4 BRL products (current - R$19,90 / R$37,90)
  "prod_UkpPpyTTfKQ8vd": "start",
  "prod_UkpR48UA8gv0jf": "gold",
  // v3 BRL products (legacy - prices in BRL)
  "prod_U11STgWm4m9tUW": "start",   // R$29,90/mês
  "prod_U11T4TqaTmwfdI": "gold",    // R$59,90/mês
  "prod_U11TuB6H4fpSp4": "premium", // R$99,90/mês
  // v2 USD products (legacy - prices in USD)
  "prod_TzYalnkoVY2mqM": "start",
  "prod_TzYak5DysG3KB5": "gold",
  "prod_TzYa2l84ZRs1VM": "premium",
  // Legacy products (backward compatibility)
  "prod_Ty5KXzCdaVfhhq": "start",
  "prod_Ty5KBT7EeOhDIf": "gold",
  "prod_Ty5Kt7Tbf3bw0b": "premium",
  "prod_TtQh5GnS7aHcXR": "start",
  "prod_TtQhVPtDIUeOT1": "gold",
  "prod_TtQhJHHgbtRVdm": "premium",
};

const planMaxUsers: Record<string, number> = {
  free: 1,
  start: 2,
  gold: 3,
  premium: 5,
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature found");

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Event verified", { type: event.type, id: event.id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, customerId: session.customer });

        if (session.mode === "subscription" && session.customer) {
          const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          
          if (customer.email) {
            // Find user by email
            const { data: users } = await supabaseClient.auth.admin.listUsers();
            const user = users?.users?.find(u => u.email === customer.email);

            if (user && session.subscription) {
              const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              const productId = subscription.items.data[0].price.product as string;
              const plan = productToPlans[productId] || "free";
              const maxUsers = planMaxUsers[plan] || 1;

              const { error } = await supabaseClient
                .from("subscriptions")
                .update({
                  plan,
                  max_users: maxUsers,
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                  status: "active",
                })
                .eq("user_id", user.id);

              logStep(error ? "DB update failed" : "Subscription activated", { 
                userId: user.id, plan, error: error?.message 
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) break;

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users?.users?.find(u => u.email === customer.email);
        if (!user) break;

        if (subscription.status === "active") {
          const productId = subscription.items.data[0].price.product as string;
          const plan = productToPlans[productId] || "free";
          const maxUsers = planMaxUsers[plan] || 1;

          const { error } = await supabaseClient
            .from("subscriptions")
            .update({
              plan,
              max_users: maxUsers,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              status: "active",
            })
            .eq("user_id", user.id);

          logStep(error ? "DB update failed" : "Plan updated", { userId: user.id, plan, error: error?.message });
        } else if (subscription.status === "canceled" || subscription.status === "unpaid" || subscription.status === "past_due") {
          const { error } = await supabaseClient
            .from("subscriptions")
            .update({
              plan: "free",
              max_users: 1,
              status: subscription.status,
            })
            .eq("user_id", user.id);

          logStep(error ? "DB update failed" : "Subscription deactivated", { 
            userId: user.id, status: subscription.status, error: error?.message 
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) break;

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users?.users?.find(u => u.email === customer.email);
        if (!user) break;

        const { error } = await supabaseClient
          .from("subscriptions")
          .update({
            plan: "free",
            max_users: 1,
            stripe_subscription_id: null,
            status: "canceled",
          })
          .eq("user_id", user.id);

        logStep(error ? "DB update failed" : "Subscription canceled → free", { 
          userId: user.id, error: error?.message 
        });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
