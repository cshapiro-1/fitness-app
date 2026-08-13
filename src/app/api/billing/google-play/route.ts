export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// POST /api/billing/google-play
// Handles both:
// 1. Client purchase token verification (called from Android App / TWA Digital Goods API)
// 2. Google Play Real-Time Developer Notifications (RTDN Webhooks from Google Cloud Pub/Sub)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Check if this is a Google Cloud Pub/Sub RTDN Webhook
    if (body.message && body.message.data) {
      const decodedData = Buffer.from(body.message.data, "base64").toString("utf-8");
      const rtdn = JSON.parse(decodedData);
      logger.info(`Google Play RTDN Notification: ${JSON.stringify(rtdn)}`);

      const { subscriptionNotification } = rtdn;
      if (subscriptionNotification) {
        const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;
        // Types:
        // 1 = RECOVERED, 2 = RENEWED, 3 = CANCELED, 4 = PURCHASED, 5 = ON_HOLD,
        // 6 = IN_GRACE_PERIOD, 7 = RESTARTED, 12 = REVOKED, 13 = EXPIRED
        if (purchaseToken) {
          const user = await prisma.user.findFirst({
            where: { subscriptionId: purchaseToken },
          });

          if (user) {
            if (notificationType === 2 || notificationType === 4 || notificationType === 1) {
              const renewalDate = new Date();
              renewalDate.setMonth(renewalDate.getMonth() + 1);
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  subscriptionStatus: "active",
                  subscriptionProvider: "google_play",
                  subscribedUntil: renewalDate,
                },
              });
              logger.info(`Google Play subscription renewed for user: ${user.id}`);
            } else if (notificationType === 3 || notificationType === 12 || notificationType === 13) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  subscriptionStatus: "expired",
                },
              });
              logger.info(`Google Play subscription expired/canceled for user: ${user.id}`);
            }
          }
        }
      }
      return NextResponse.json({ status: "acknowledged" });
    }

    // 2. Direct client verification (User finished Google Play purchase flow)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId = (session.user as any).id;
    if (!userId && session.user.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = dbUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { purchaseToken, productId, plan } = body;
    if (!purchaseToken) {
      return NextResponse.json({ error: "Purchase token is required" }, { status: 400 });
    }

    // Calculate subscription expiration (Monthly vs Annual)
    const now = new Date();
    const subscribedUntil = new Date(now);
    if (plan === "annual" || productId?.includes("annual") || productId?.includes("yearly")) {
      subscribedUntil.setFullYear(subscribedUntil.getFullYear() + 1);
    } else {
      subscribedUntil.setMonth(subscribedUntil.getMonth() + 1);
    }

    // Grant active Google Play subscription
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "active",
        subscriptionProvider: "google_play",
        subscriptionId: purchaseToken,
        subscribedUntil,
      },
    });

    logger.info(`Google Play subscription verified for user: ${userId}, valid until: ${subscribedUntil.toISOString()}`);

    return NextResponse.json({
      success: true,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscribedUntil: updatedUser.subscribedUntil,
      subscriptionProvider: updatedUser.subscriptionProvider,
    });
  } catch (error: any) {
    logger.error("Google Play billing error", error);
    return NextResponse.json({ error: error.message || "Failed to process Google Play purchase" }, { status: 500 });
  }
}
