export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const now = new Date();

    const [totalUsers, totalTrainers, totalClients, totalWorkouts, allUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TRAINER" } }),
      prisma.client.count(),
      prisma.workoutSession.count(),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isAdmin: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          subscribedUntil: true,
          createdAt: true,
          _count: {
            select: { clients: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    let activeSubscriptions = 0;
    let trialingUsers = 0;
    let expiredUsers = 0;

    const formattedUsers = allUsers.map((u: any) => {
      let computedStatus: "trial" | "active" | "expired" | "client_free" = "expired";

      if (u.role === "CLIENT") {
        computedStatus = "client_free";
      } else if (u.subscribedUntil && new Date(u.subscribedUntil) > now) {
        computedStatus = "active";
        activeSubscriptions++;
      } else if (u.trialEndsAt && new Date(u.trialEndsAt) > now) {
        computedStatus = "trial";
        trialingUsers++;
      } else {
        expiredUsers++;
      }

      return {
        ...u,
        computedStatus,
        clientCount: u._count.clients,
      };
    });

    // Real-time Live Stripe Billing Metrics
    let stripeBilling: any = {
      connected: false,
      availableBalance: 0,
      pendingBalance: 0,
      monthlySubscribers: 0,
      annualSubscribers: 0,
      totalPayingSubscribers: 0,
      realMRR: 0,
      projectedARR: 0,
      recentPayouts: [],
      recentTransactions: [],
    };

    if (stripe) {
      try {
        const [balance, subscriptions, charges, payouts] = await Promise.all([
          stripe.balance.retrieve().catch(() => null),
          stripe.subscriptions.list({ status: "active", limit: 100 }).catch(() => null),
          stripe.charges.list({ limit: 10 }).catch(() => null),
          stripe.payouts.list({ limit: 5 }).catch(() => null),
        ]);

        let available = 0;
        let pending = 0;
        if (balance) {
          available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
          pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;
        }

        let monthlyCount = 0;
        let annualCount = 0;
        let totalMrr = 0;

        if (subscriptions?.data) {
          subscriptions.data.forEach((sub) => {
            const item = sub.items.data[0];
            const unitAmount = item?.price?.unit_amount || 0;
            const interval = item?.price?.recurring?.interval;

            if (interval === "year") {
              annualCount++;
              totalMrr += Math.round((unitAmount / 100) / 12);
            } else {
              monthlyCount++;
              totalMrr += Math.round(unitAmount / 100);
            }
          });
        }

        const recentPayoutsFormatted = (payouts?.data || []).map((p) => ({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency.toUpperCase(),
          status: p.status,
          arrivalDate: new Date(p.arrival_date * 1000).toLocaleDateString(),
          method: p.method,
        }));

        const recentTransactionsFormatted = (charges?.data || []).map((c) => ({
          id: c.id,
          amount: c.amount / 100,
          currency: c.currency.toUpperCase(),
          paid: c.paid,
          status: c.status,
          customerEmail: c.billing_details?.email || c.receipt_email || "Customer",
          created: new Date(c.created * 1000).toLocaleDateString(),
        }));

        stripeBilling = {
          connected: true,
          availableBalance: available,
          pendingBalance: pending,
          monthlySubscribers: monthlyCount,
          annualSubscribers: annualCount,
          totalPayingSubscribers: monthlyCount + annualCount,
          realMRR: totalMrr,
          projectedARR: totalMrr * 12,
          recentPayouts: recentPayoutsFormatted,
          recentTransactions: recentTransactionsFormatted,
        };
      } catch (stripeErr) {
        console.error("Stripe metrics query error:", stripeErr);
      }
    }

    const estimatedMRR = stripeBilling.connected ? stripeBilling.realMRR : (activeSubscriptions * 19);
    const conversionRate = totalTrainers > 0 ? Math.round((activeSubscriptions / totalTrainers) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTrainers,
        totalClients,
        totalWorkouts,
        activeSubscriptions: stripeBilling.connected ? stripeBilling.totalPayingSubscribers : activeSubscriptions,
        trialingUsers,
        expiredUsers,
        estimatedMRR,
        conversionRate,
      },
      stripeBilling,
      users: formattedUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch admin statistics" }, { status: 500 });
  }
}