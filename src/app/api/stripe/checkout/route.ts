export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, SUBSCRIPTION_PRICES } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rawPlan = body.plan;
    const plan = (rawPlan === "annual" ? "annual" : rawPlan === "lifetime" ? "lifetime" : "monthly") as "monthly" | "annual" | "lifetime";
    const selectedPlan = SUBSCRIPTION_PRICES[plan];

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "strkyr.fit";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const appBaseUrl = `${protocol}://${host}`;

    // REAL STRIPE CHECKOUT MODE
    if (stripe) {
      logger.info(`Creating real Stripe Checkout Session for user: ${session.user.id} (${plan})`);

      const lineItemPriceData: any = {
        currency: "usd",
        product_data: {
          name: selectedPlan.name,
          description: "Unlimited clients, workout builder, client portal, nutrition tracking & analytics.",
        },
        unit_amount: selectedPlan.amount,
      };

      if (selectedPlan.mode === "subscription" && "interval" in selectedPlan) {
        lineItemPriceData.recurring = {
          interval: selectedPlan.interval,
        };
      }

      const sessionPayload: any = {
        payment_method_types: ["card"],
        mode: selectedPlan.mode,
        customer_email: session.user.email || undefined,
        client_reference_id: session.user.id,
        line_items: [
          {
            price_data: lineItemPriceData,
            quantity: 1,
          },
        ],
        metadata: {
          userId: session.user.id,
          plan,
        },
        success_url: `${appBaseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&subscribed=true`,
        cancel_url: `${appBaseUrl}/dashboard?canceled=true`,
      };

      if (selectedPlan.mode === "subscription") {
        sessionPayload.subscription_data = {
          metadata: {
            userId: session.user.id,
            plan,
          },
        };
      }

      const checkoutSession = await stripe.checkout.sessions.create(sessionPayload);

      return NextResponse.json({
        success: true,
        url: checkoutSession.url,
      });
    }

    // SIMULATED / LOCAL DEV FALLBACK MODE
    logger.info(`[STRIPE_FALLBACK] No STRIPE_SECRET_KEY detected. Granting simulated ${plan} subscription.`);
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
      where: { id: session.user.id },
      data: {
        subscriptionStatus: "active",
        subscriptionProvider: "simulated",
        subscribedUntil,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully activated ${plan} subscription!`,
      url: "/dashboard?subscribed=true",
    });
  } catch (error: any) {
    logger.error("Checkout route error", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}