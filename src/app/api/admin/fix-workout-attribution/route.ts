export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAccess } from "@/lib/adminGuard";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    // 1. Add columns to PostgreSQL if needed using raw SQL
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedByRole" TEXT DEFAULT 'TRAINER';
        ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedById" TEXT;
        ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedByName" TEXT;
        ALTER TABLE "Workout" ADD COLUMN IF NOT EXISTS "loggedByRole" TEXT DEFAULT 'TRAINER';
        ALTER TABLE "Workout" ADD COLUMN IF NOT EXISTS "loggedById" TEXT;
        ALTER TABLE "Workout" ADD COLUMN IF NOT EXISTS "loggedByName" TEXT;
      `);
    } catch (e) {
      console.warn("Raw SQL alter notice:", e);
    }

    // 2. Backfill existing sessions
    const sessions = await prisma.workoutSession.findMany({
      include: {
        client: {
          include: { user: true },
        },
      },
    });

    let updatedCount = 0;
    for (const session of sessions) {
      const trainerName = session.client?.user?.name || "Coach";
      const trainerId = session.client?.user?.id || null;
      if (!session.loggedByName || !session.loggedByRole) {
        await prisma.workoutSession.update({
          where: { id: session.id },
          data: {
            loggedByRole: "TRAINER",
            loggedById: trainerId,
            loggedByName: trainerName,
          },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updatedSessionsCount: updatedCount,
      totalSessions: sessions.length,
    });
  } catch (error: any) {
    console.error("Backfill attribution error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
