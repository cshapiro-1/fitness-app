export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "strkyr.fit";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const returnUrl = `${protocol}://${host}/dashboard`;

    if (!stripe) {
      return NextResponse.json({
        url: returnUrl,
        message: "Stripe is currently in simulated mode.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "User has no email" }, { status: 400 });
    }

    // Lookup Stripe Customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = newCustomer.id;
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    logger.error("Stripe Portal error", error);
    return NextResponse.json({ error: error.message || "Failed to open billing portal" }, { status: 500 });
  }
}
