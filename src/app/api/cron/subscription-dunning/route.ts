export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendTrialExpiryReminderEmail,
  sendLapsedSubscriptionReminderEmail,
  sendQuarterlyFeedbackEmail,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    // Allow if matching CRON_SECRET or in non-production/test environments
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const stats = {
      trialExpiryNoticesSent: 0,
      lapsedRemindersSent: 0,
      quarterlyFeedbackSent: 0,
    };

    // 1. Find trainers whose trial expires in ~2 days (between 1 and 2.5 days from now)
    const trainersOnTrial = await prisma.user.findMany({
      where: {
        role: { in: ["TRAINER", "trainer"] },
        emailNotifications: true,
        email: { not: null },
      },
    });

    for (const trainer of trainersOnTrial) {
      if (!trainer.email) continue;

      const trialEnds = trainer.trialEndsAt;
      const subUntil = trainer.subscribedUntil;
      const isSubscribed = subUntil && subUntil.getTime() > now.getTime();

      if (isSubscribed) {
        // Active subscriber — check for 90-day / quarterly feedback
        const daysActive = Math.floor((now.getTime() - trainer.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysActive > 0 && daysActive % 90 === 0) {
          const sent = await sendQuarterlyFeedbackEmail({
            recipientEmail: trainer.email,
            recipientName: trainer.name || "Coach",
            role: "TRAINER",
          });
          if (sent) stats.quarterlyFeedbackSent++;
        }
      } else if (trialEnds) {
        const msRemaining = trialEnds.getTime() - now.getTime();
        const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

        // 2-day trial reminder (1 <= daysRemaining <= 2)
        if (daysRemaining > 0 && daysRemaining <= 2) {
          const sent = await sendTrialExpiryReminderEmail({
            recipientEmail: trainer.email,
            recipientName: trainer.name || "Coach",
            daysRemaining,
          });
          if (sent) stats.trialExpiryNoticesSent++;
        } else if (daysRemaining <= 0) {
          // Lapsed trainer: exact days since expiry
          const daysLapsed = Math.max(1, Math.floor((now.getTime() - trialEnds.getTime()) / (1000 * 60 * 60 * 24)));
          // Day 3, or once a week thereafter (Day 10, Day 17, Day 24, etc.)
          if (daysLapsed === 3 || (daysLapsed > 3 && (daysLapsed - 3) % 7 === 0)) {
            const sent = await sendLapsedSubscriptionReminderEmail({
              recipientEmail: trainer.email,
              recipientName: trainer.name || "Coach",
              daysLapsed,
            });
            if (sent) stats.lapsedRemindersSent++;
          }
        }
      }
    }

    // Also check active clients for quarterly feedback surveys
    const clients = await prisma.client.findMany({
      where: {
        emailNotifications: true,
        email: { not: null },
      },
    });

    for (const client of clients) {
      if (!client.email) continue;
      const daysActive = Math.floor((now.getTime() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysActive > 0 && daysActive % 90 === 0) {
        const sent = await sendQuarterlyFeedbackEmail({
          recipientEmail: client.email,
          recipientName: client.name || "Athlete",
          role: "CLIENT",
        });
        if (sent) stats.quarterlyFeedbackSent++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error("Subscription Dunning Cron Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process dunning" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
