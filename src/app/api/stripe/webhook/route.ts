export const dynamic = "force-dynamic";
﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    logger.info(`Stripe Webhook Received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data?.object;
        const userId = session?.client_reference_id || session?.metadata?.userId;
        if (userId) {
          const subscribedUntil = new Date();
          subscribedUntil.setDate(subscribedUntil.getDate() + 30);
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "active",
              subscribedUntil,
            },
          });
          logger.info(`Subscription activated for user: ${userId}`);
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
          logger.info(`Subscription canceled for user: ${userId}`);
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

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error("Stripe Webhook Error", error);
    return NextResponse.json({ error: error.message || "Webhook handler failed" }, { status: 500 });
  }
}