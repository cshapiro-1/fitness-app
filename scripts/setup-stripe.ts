/**
 * Programmatic Stripe Setup & Configuration Script for STRKYR
 * 
 * Usage:
 *   npx tsx scripts/setup-stripe.ts [STRIPE_SECRET_KEY]
 */

import Stripe from "stripe";

async function runStripeSetup() {
  const apiKey = process.argv[2] || process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    console.error(`
=============================================================================
❌ STRIPE_SECRET_KEY NOT PROVIDED
=============================================================================
Please pass your Stripe Secret Key (Test or Live):
  npx tsx scripts/setup-stripe.ts sk_test_... (or sk_live_...)

Alternatively, set STRIPE_SECRET_KEY in your environment variables.
=============================================================================
`);
    process.exit(1);
  }

  console.log("🚀 Initializing Stripe client...");
  const stripe = new Stripe(apiKey, {
    apiVersion: "2025-01-27.acacia" as any,
    typescript: true,
  });

  try {
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Successfully connected to Stripe Account: ${account.business_profile?.name || account.id} (Live Mode: ${apiKey.startsWith("sk_live")})`);

    // 1. Create or Find Products
    console.log("\n📦 Setting up Stripe Products & Pricing Plans...");

    const plans = [
      {
        id: "strkyr-coach-monthly",
        name: "STRKYR Coach Studio (Monthly)",
        description: "Unlimited athlete rosters, 1-click invite links, AI periodized routines, 3D anatomy cues & nutrition tracking.",
        amount: 1900, // $19.00
        currency: "usd",
        interval: "month" as const,
        mode: "recurring",
      },
      {
        id: "strkyr-coach-annual",
        name: "STRKYR Coach Studio (Annual)",
        description: "Annual coach pass with priority AI periodization, custom PDF workout exports & dedicated support.",
        amount: 20000, // $200.00
        currency: "usd",
        interval: "year" as const,
        mode: "recurring",
      },
      {
        id: "strkyr-coach-lifetime",
        name: "STRKYR Founder Coach Lifetime VIP Pass",
        description: "One-time purchase for unlimited athlete rosters and all future AI features forever.",
        amount: 29900, // $299.00
        currency: "usd",
        mode: "one_time",
      },
    ];

    for (const plan of plans) {
      // Search existing products
      const existingProducts = await stripe.products.search({
        query: `name:'${plan.name}'`,
      });

      let product: Stripe.Product;
      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0];
        console.log(`  ✓ Found existing product: ${product.name} (${product.id})`);
      } else {
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            app: "STRKYR",
            tier: "coach_pro",
          },
        });
        console.log(`  + Created product: ${product.name} (${product.id})`);
      }

      // Check or create Price
      const prices = await stripe.prices.list({ product: product.id, active: true });
      if (prices.data.length === 0) {
        const priceData: any = {
          product: product.id,
          unit_amount: plan.amount,
          currency: plan.currency,
        };
        if (plan.mode === "recurring") {
          priceData.recurring = { interval: plan.interval };
        }
        const createdPrice = await stripe.prices.create(priceData);
        console.log(`    + Created price: $${(plan.amount / 100).toFixed(2)} (${createdPrice.id})`);
      } else {
        console.log(`    ✓ Active price: $${(prices.data[0].unit_amount! / 100).toFixed(2)} (${prices.data[0].id})`);
      }
    }

    // 2. Programmatically Register Webhook Endpoint
    const webhookUrl = "https://www.strkyr.fit/api/stripe/webhook";
    console.log(`\n🔗 Configuring Production Webhook Endpoint (${webhookUrl})...`);

    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 20 });
    const matchingWebhook = existingWebhooks.data.find((w) => w.url === webhookUrl);

    let webhookSecret = "";
    if (matchingWebhook) {
      console.log(`  ✓ Webhook endpoint already registered: ${matchingWebhook.id} (${matchingWebhook.status})`);
      console.log(`  ℹ️ Note: If you don't have the webhook signing secret for this existing webhook, you can view or roll it in the Stripe Dashboard > Developers > Webhooks.`);
    } else {
      const createdWebhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [
          "checkout.session.completed",
          "customer.subscription.updated",
          "customer.subscription.deleted",
          "invoice.payment_succeeded",
          "invoice.payment_failed",
        ],
        description: "STRKYR Production Subscription & Checkout Webhook",
      });
      webhookSecret = createdWebhook.secret || "";
      console.log(`  + Created new webhook endpoint: ${createdWebhook.id}`);
      console.log(`  🔑 Signing Secret: ${webhookSecret}`);
    }

    console.log(`
=============================================================================
🎉 STRIPE PROGRAMMATIC SETUP COMPLETED SUCCESSFULLY!
=============================================================================

Add these environment variables to Vercel (or your .env.production file):

STRIPE_SECRET_KEY=${apiKey}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_${apiKey.startsWith("sk_live") ? "live" : "test"}_...
${webhookSecret ? `STRIPE_WEBHOOK_SECRET=${webhookSecret}` : "# STRIPE_WEBHOOK_SECRET=whsec_... (Retrieve from Stripe Dashboard > Webhooks)"}

Live App Domain: https://www.strkyr.fit
Webhook Target:  ${webhookUrl}
=============================================================================
`);
  } catch (error: any) {
    console.error("❌ Stripe setup failed:", error.message);
    process.exit(1);
  }
}

runStripeSetup();
