export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      let computedStatus: "trial" | "active" | "expired" = "expired";

      if (u.subscribedUntil && new Date(u.subscribedUntil) > now) {
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

    const estimatedMRR = activeSubscriptions * 10;
    const conversionRate = totalTrainers > 0 ? Math.round((activeSubscriptions / totalTrainers) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTrainers,
        totalClients,
        totalWorkouts,
        activeSubscriptions,
        trialingUsers,
        expiredUsers,
        estimatedMRR,
        conversionRate,
      },
      users: formattedUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch admin statistics" }, { status: 500 });
  }
}