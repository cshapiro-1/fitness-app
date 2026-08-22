import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })
  : null;

export const SUBSCRIPTION_PRICES = {
  monthly: {
    amount: 1900, // $19.00 USD
    interval: "month" as const,
    name: "STRKYR Coach Studio (Monthly - Unlimited Clients)",
    mode: "subscription" as const,
  },
  annual: {
    amount: 20000, // $200.00 USD
    interval: "year" as const,
    name: "STRKYR Coach Studio (Annual)",
    mode: "subscription" as const,
  },
  lifetime: {
    amount: 29900, // $299.00 USD
    name: "STRKYR Founder Coach Lifetime VIP Pass",
    mode: "payment" as const,
  },
};
