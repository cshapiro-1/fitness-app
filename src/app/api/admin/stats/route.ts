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
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Self-healing: Ensure columns exist in live Postgres database and clean up legacy accounts
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSessionDurationSeconds" INTEGER DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginCount" INTEGER DEFAULT 1;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalSessionSeconds" INTEGER DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "lastSessionDurationSeconds" INTEGER DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "loginCount" INTEGER DEFAULT 1;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "totalSessionSeconds" INTEGER DEFAULT 0;`);

      // Delete legacy FitCoach service admin accounts
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: { in: ["service@fitcoach.pro", "admin@fitcoach.pro"] } },
            { name: { contains: "FitCoach", mode: "insensitive" } },
          ],
        },
      }).catch(() => null);
    } catch (schemaErr) {
      console.warn("Schema self-heal warning:", schemaErr);
    }

    const [
      totalUsers,
      totalTrainers,
      totalClients,
      totalWorkouts,
      completedWorkouts,
      inProgressSessions,
      totalPrograms,
      activeAssignedPrograms,
      completedPrograms,
      totalProgramAssignments,
      recent24hWorkouts,
      recent7dWorkouts,
      recent30dWorkouts,
      totalSetsCount,
      allTrainers,
      allClients,
      allUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ["TRAINER", "trainer"] } } }),
      prisma.client.count(),
      prisma.workoutSession.count({ where: { deletedAt: null } }),
      prisma.workoutSession.count({ where: { status: "COMPLETED", deletedAt: null } }),
      prisma.workoutSession.count({ where: { status: "IN_PROGRESS", deletedAt: null } }),
      prisma.trainingProgram?.count ? prisma.trainingProgram.count().catch(() => 0) : Promise.resolve(0),
      prisma.trainingProgram?.count ? prisma.trainingProgram.count({ where: { status: "IN_PROGRESS" } }).catch(() => 0) : Promise.resolve(0),
      prisma.trainingProgram?.count ? prisma.trainingProgram.count({ where: { status: "COMPLETED" } }).catch(() => 0) : Promise.resolve(0),
      prisma.workoutSession.count({ where: { programId: { not: null }, deletedAt: null } }).catch(() => 0),
      prisma.workoutSession.findMany({
        where: { createdAt: { gte: oneDayAgo }, deletedAt: null },
        select: { loggedById: true, client: { select: { userId: true } } },
      }),
      prisma.workoutSession.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null },
        select: { loggedById: true, client: { select: { userId: true } } },
      }),
      prisma.workoutSession.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
        select: { loggedById: true, client: { select: { userId: true } } },
      }),
      prisma.workoutSet.count(),
      prisma.user.findMany({
        where: { role: { in: ["TRAINER", "trainer", "ADMIN", "admin"] } },
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
          lastLoginAt: true,
          lastActiveAt: true,
          lastSessionDurationSeconds: true,
          loginCount: true,
          totalSessionSeconds: true,
          createdAt: true,
          loggedWorkouts: {
            select: { completedAt: true, startedAt: true, createdAt: true },
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              clients: true,
              loggedWorkouts: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          lastActiveAt: true,
          lastSessionDurationSeconds: true,
          loginCount: true,
          totalSessionSeconds: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          loginUser: {
            select: { id: true, name: true, email: true, createdAt: true, lastLoginAt: true, lastActiveAt: true, lastSessionDurationSeconds: true, loginCount: true, totalSessionSeconds: true },
          },
          workoutSessions: {
            select: { completedAt: true, startedAt: true, createdAt: true },
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              workoutSessions: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
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
          lastLoginAt: true,
          lastActiveAt: true,
          lastSessionDurationSeconds: true,
          loginCount: true,
          totalSessionSeconds: true,
          createdAt: true,
          _count: {
            select: {
              clients: true,
              loggedWorkouts: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Compute unique user IDs for DAU, WAU, MAU
    const dauSet = new Set<string>();
    recent24hWorkouts.forEach((w: any) => {
      if (w.loggedById) dauSet.add(w.loggedById);
      if (w.client?.userId) dauSet.add(w.client.userId);
    });
    const dau = Math.max(dauSet.size, 1); // at least current admin

    const wauSet = new Set<string>();
    recent7dWorkouts.forEach((w: any) => {
      if (w.loggedById) wauSet.add(w.loggedById);
      if (w.client?.userId) wauSet.add(w.client.userId);
    });
    const wau = Math.max(wauSet.size, dau);

    const mauSet = new Set<string>();
    recent30dWorkouts.forEach((w: any) => {
      if (w.loggedById) mauSet.add(w.loggedById);
      if (w.client?.userId) mauSet.add(w.client.userId);
    });
    const mau = Math.max(mauSet.size, wau);

    const stickinessRatio = mau > 0 ? Math.round((dau / mau) * 100) : 100;
    const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
    const avgClientsPerTrainer = totalTrainers > 0 ? Number((totalClients / totalTrainers).toFixed(1)) : 0;

    let activeSubscriptions = 0;
    let trialingUsers = 0;
    let expiredUsers = 0;

    const formattedTrainers = (allTrainers as any[]).map((u: any) => {
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

      const latestWorkoutDate = u.loggedWorkouts?.[0]?.completedAt || u.loggedWorkouts?.[0]?.startedAt || u.loggedWorkouts?.[0]?.createdAt;
      const hasRealSession = (u.lastSessionDurationSeconds || 0) > 0;
      const effectiveLastActive = hasRealSession ? (u.lastActiveAt || u.lastLoginAt) : (latestWorkoutDate || u.createdAt);
      const effectiveLastLogin = hasRealSession ? (u.lastLoginAt || effectiveLastActive) : (latestWorkoutDate || u.createdAt);

      const loginCount = u.loginCount || 1;
      const totalSessionSeconds = u.totalSessionSeconds || u.lastSessionDurationSeconds || 0;
      const avgSessionDurationSeconds = totalSessionSeconds > 0 ? Math.round(totalSessionSeconds / Math.max(1, loginCount)) : 0;

      const userEmail = (u.email || "").toLowerCase().trim();
      const isInternalAdmin = !!u.isAdmin || userEmail === "collin.shapiro1@gmail.com" || userEmail === "collin@strkyr.fit" || userEmail === "admin@strkyr.fit" || userEmail === "service@strkyr.fit";

      return {
        ...u,
        computedStatus,
        clientCount: u._count?.clients || 0,
        workoutsLoggedForClients: u._count?.loggedWorkouts || 0,
        lastLoginAt: effectiveLastLogin,
        lastActiveAt: effectiveLastActive,
        lastSessionDurationSeconds: u.lastSessionDurationSeconds || 0,
        loginCount,
        totalSessionSeconds,
        avgSessionDurationSeconds,
        isInternalAdmin,
      };
    });

    const formattedClients = (allClients as any[]).map((c: any) => {
      const clientWorkoutDate = c.workoutSessions?.[0]?.completedAt || c.workoutSessions?.[0]?.startedAt || c.workoutSessions?.[0]?.createdAt;
      const clientUser = c.loginUser;
      const clientHasRealSession = (clientUser?.lastSessionDurationSeconds || c.lastSessionDurationSeconds || 0) > 0;
      const clientLastActive = clientHasRealSession ? (clientUser?.lastActiveAt || c.lastActiveAt) : (clientWorkoutDate || c.createdAt);
      const clientLastLogin = clientHasRealSession ? (clientUser?.lastLoginAt || clientLastActive) : (clientWorkoutDate || c.createdAt);

      const loginCount = clientUser?.loginCount || c.loginCount || 1;
      const totalSessionSeconds = clientUser?.totalSessionSeconds || c.totalSessionSeconds || clientUser?.lastSessionDurationSeconds || c.lastSessionDurationSeconds || 0;
      const avgSessionDurationSeconds = totalSessionSeconds > 0 ? Math.round(totalSessionSeconds / Math.max(1, loginCount)) : 0;

      const clientEmail = (c.email || clientUser?.email || "").toLowerCase().trim();
      const isInternalAdmin = clientEmail === "collin.shapiro1@gmail.com" || clientEmail === "collin@strkyr.fit" || clientEmail === "admin@strkyr.fit" || clientEmail === "service@strkyr.fit";

      return {
        id: c.id,
        name: c.name,
        email: c.email || c.loginUser?.email || "No email",
        phone: c.phone,
        image: c.image,
        createdAt: c.createdAt,
        trainerId: c.user?.id,
        trainerName: c.user?.name || c.user?.email || "Unassigned",
        workoutsLogged: c._count?.workoutSessions || 0,
        isRegistered: !!c.loginUser,
        lastLoginAt: clientLastLogin,
        lastActiveAt: clientLastActive,
        lastSessionDurationSeconds: clientUser?.lastSessionDurationSeconds || c.lastSessionDurationSeconds || 0,
        loginCount,
        totalSessionSeconds,
        avgSessionDurationSeconds,
        isInternalAdmin,
      };
    });

    const formattedUsers = formattedTrainers;

    // Separate Organic Customers vs Internal Developer / Admin Accounts
    const organicTrainers = formattedTrainers.filter((t) => !t.isInternalAdmin);
    const organicClients = formattedClients.filter((c) => !c.isInternalAdmin);
    const adminTrainers = formattedTrainers.filter((t) => t.isInternalAdmin);
    const adminClients = formattedClients.filter((c) => c.isInternalAdmin);

    // 1. Organic Customer Metrics (Excluding Collin's Dev Usage)
    const organicTotalLogins = organicTrainers.reduce((acc, t) => acc + (t.loginCount || 1), 0) +
                               organicClients.reduce((acc, c) => acc + (c.loginCount || 1), 0);
    const organicActiveDurations = [
      ...organicTrainers.map((t) => t.avgSessionDurationSeconds || 0),
      ...organicClients.map((c) => c.avgSessionDurationSeconds || 0),
    ].filter((s) => s > 0);
    const organicAvgSessionSeconds = organicActiveDurations.length > 0
      ? Math.round(organicActiveDurations.reduce((a, b) => a + b, 0) / organicActiveDurations.length)
      : 0;
    const organicTotalAppTimeSeconds = organicTrainers.reduce((acc, t) => acc + (t.totalSessionSeconds || 0), 0) +
                                       organicClients.reduce((acc, c) => acc + (c.totalSessionSeconds || 0), 0);

    // Organic DAU / MAU
    const organicDauSet = new Set<string>();
    recent24hWorkouts.forEach((w: any) => {
      const isFromAdminTrainer = adminTrainers.some((at) => at.id === w.loggedById);
      const isFromAdminClient = adminTrainers.some((at) => at.id === w.client?.userId);
      if (w.loggedById && !isFromAdminTrainer) organicDauSet.add(w.loggedById);
      if (w.client?.userId && !isFromAdminClient) organicDauSet.add(w.client.userId);
    });
    const organicDau = organicDauSet.size;

    const organicMauSet = new Set<string>();
    recent30dWorkouts.forEach((w: any) => {
      const isFromAdminTrainer = adminTrainers.some((at) => at.id === w.loggedById);
      const isFromAdminClient = adminTrainers.some((at) => at.id === w.client?.userId);
      if (w.loggedById && !isFromAdminTrainer) organicMauSet.add(w.loggedById);
      if (w.client?.userId && !isFromAdminClient) organicMauSet.add(w.client.userId);
    });
    const organicMau = organicMauSet.size;
    const organicStickinessRatio = organicMau > 0 ? Math.round((organicDau / organicMau) * 100) : 0;

    // 2. Internal Admin / Developer Metrics (Collin's isolated usage)
    const adminTotalLogins = adminTrainers.reduce((acc, t) => acc + (t.loginCount || 1), 0) +
                             adminClients.reduce((acc, c) => acc + (c.loginCount || 1), 0);
    const adminActiveDurations = [
      ...adminTrainers.map((t) => t.avgSessionDurationSeconds || 0),
      ...adminClients.map((c) => c.avgSessionDurationSeconds || 0),
    ].filter((s) => s > 0);
    const adminAvgSessionSeconds = adminActiveDurations.length > 0
      ? Math.round(adminActiveDurations.reduce((a, b) => a + b, 0) / adminActiveDurations.length)
      : 0;
    const adminTotalAppTimeSeconds = adminTrainers.reduce((acc, t) => acc + (t.totalSessionSeconds || 0), 0) +
                                    adminClients.reduce((acc, c) => acc + (c.totalSessionSeconds || 0), 0);

    // 3. Combined Total Metrics
    const totalLogins = organicTotalLogins + adminTotalLogins;
    const allActiveDurations = [...organicActiveDurations, ...adminActiveDurations];
    const overallAvgSessionSeconds = allActiveDurations.length > 0
      ? Math.round(allActiveDurations.reduce((a, b) => a + b, 0) / allActiveDurations.length)
      : 0;
    const totalAppTimeSeconds = organicTotalAppTimeSeconds + adminTotalAppTimeSeconds;

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
          available = balance.available.reduce((sum, b) => sum + (b.currency === "usd" ? b.amount : 0), 0) / 100;
          pending = balance.pending.reduce((sum, b) => sum + (b.currency === "usd" ? b.amount : 0), 0) / 100;
        }

        let monthlyCount = 0;
        let annualCount = 0;
        let totalMrr = 0;

        if (subscriptions?.data) {
          subscriptions.data.forEach((sub: any) => {
            const item = sub.items?.data?.[0];
            const interval = item?.price?.recurring?.interval;
            const amount = (item?.price?.unit_amount || 0) / 100;

            if (interval === "month") {
              monthlyCount++;
              totalMrr += amount || 19;
            } else if (interval === "year") {
              annualCount++;
              totalMrr += Math.round((amount || 200) / 12);
            }
          });
        }

        const recentPayoutsFormatted = (payouts?.data || []).map((p: any) => ({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency.toUpperCase(),
          status: p.status,
          arrivalDate: new Date(p.arrival_date * 1000).toLocaleDateString(),
          method: p.type || "standard",
        }));

        const recentTransactionsFormatted = (charges?.data || []).map((c: any) => ({
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
        totalCompletedWorkouts: completedWorkouts,
        inProgressSessions,
        totalPrograms,
        activeAssignedPrograms,
        completedPrograms,
        totalProgramAssignments,
        totalSetsCount,
        dau: organicDau,
        wau,
        mau: organicMau,
        stickinessRatio: organicStickinessRatio,
        completionRate,
        avgClientsPerTrainer,
        activeSubscriptions: stripeBilling.connected ? stripeBilling.totalPayingSubscribers : activeSubscriptions,
        trialingUsers,
        expiredUsers,
        estimatedMRR,
        conversionRate,

        // Platform-wide combined metrics
        totalLogins,
        overallAvgSessionSeconds,
        totalAppTimeSeconds,

        // Organic Customer Metrics (Excluding Admin Dev Usage)
        organicTrainersCount: organicTrainers.length,
        organicClientsCount: organicClients.length,
        organicTotalLogins,
        organicAvgSessionSeconds,
        organicTotalAppTimeSeconds,
        organicDau,
        organicMau,
        organicStickinessRatio,

        // Internal Admin & Developer Metrics (Collin's Isolated Usage)
        adminTotalLogins,
        adminAvgSessionSeconds,
        adminTotalAppTimeSeconds,
      },
      stripeBilling,
      trainers: formattedTrainers,
      clients: formattedClients,
      users: formattedUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch admin statistics" }, { status: 500 });
  }
}