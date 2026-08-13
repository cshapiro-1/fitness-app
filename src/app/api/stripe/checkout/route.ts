export const dynamic = "force-dynamic";
﻿import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body; // "monthly" | "annual"

    // Calculate subscription period
    const now = new Date();
    const subscribedUntil = new Date(now);
    if (plan === "annual") {
      subscribedUntil.setFullYear(subscribedUntil.getFullYear() + 1);
    } else {
      subscribedUntil.setMonth(subscribedUntil.getMonth() + 1);
    }

    // Grant active subscription
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionStatus: "active",
        subscribedUntil,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully activated ${plan} subscription!`,
      url: "/dashboard?subscribed=true",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}