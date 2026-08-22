export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let event: any;

    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (stripe && webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        logger.error(`⚠️ Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
      }
    }

    logger.info(`Stripe Webhook Received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data?.object;
        const userId = session?.client_reference_id || session?.metadata?.userId;
        const customerId = session?.customer as string;
        const subscriptionId = session?.subscription as string;
        const plan = session?.metadata?.plan;

        if (userId) {
          const now = new Date();
          const subscribedUntil = new Date(now);
          if (plan === "annual") {
            subscribedUntil.setFullYear(subscribedUntil.getFullYear() + 1);
          } else if (plan === "lifetime") {
            subscribedUntil.setFullYear(subscribedUntil.getFullYear() + 75);
          } else {
            subscribedUntil.setMonth(subscribedUntil.getMonth() + 1);
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "active",
              subscriptionProvider: "stripe",
              subscriptionId: subscriptionId || undefined,
              subscribedUntil,
            },
          });
          logger.info(`Subscription activated for user: ${userId} (${plan || "monthly"})`);
        }
        break;
      }

      case "customer.subscription.updated":
      case "invoice.payment_succeeded": {
        const sub = event.data?.object;
        const userId = sub?.metadata?.userId || sub?.subscription_details?.metadata?.userId;
        const periodEnd = sub?.current_period_end;

        if (userId && periodEnd) {
          const subscribedUntil = new Date(periodEnd * 1000);
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "active",
              subscribedUntil,
            },
          });
          logger.info(`Subscription renewed for user: ${userId} until ${subscribedUntil.toISOString()}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data?.object;
        const userId = subscription?.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "expired",
            },
          });
          logger.info(`Subscription canceled/expired for user: ${userId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data?.object;
        const userId = invoice?.subscription_details?.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "past_due",
            },
          });
          logger.warn(`Invoice payment failed for user: ${userId}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error: any) {
    logger.error("Stripe Webhook Error", error);
    return NextResponse.json({ error: error.message || "Webhook handler failed" }, { status: 500 });
  }
}