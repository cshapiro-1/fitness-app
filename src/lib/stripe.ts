import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })
  : null;

export const SUBSCRIPTION_PRICES = {
  monthly: {
    amount: 2000, // $20.00 USD
    interval: "month" as const,
    name: "Trainer Pro (Monthly - Unlimited Clients)",
  },
  annual: {
    amount: 20000, // $200.00 USD ($40 discount)
    interval: "year" as const,
    name: "Trainer Pro (Annual - Unlimited Clients)",
  },
};
