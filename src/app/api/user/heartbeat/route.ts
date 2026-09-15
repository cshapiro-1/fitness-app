export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const rawDuration = typeof body.activeDurationSeconds === "number"
      ? body.activeDurationSeconds
      : typeof body.durationSeconds === "number"
      ? body.durationSeconds
      : 0;

    // Hard ceiling: Cap single session active duration at 7,200 seconds (2 hours)
    const durationSeconds = Math.max(0, Math.min(rawDuration, 7200));

    const isIdle = body.isIdle === true;
    const isExplicitNewSession = body.isNewSession === true;
    const now = new Date();

    // Incremental active delta: capped at 60s per heartbeat, only accumulated when NOT idle
    const deltaSeconds = !isIdle && typeof body.deltaActiveSeconds === "number"
      ? Math.max(0, Math.min(body.deltaActiveSeconds, 60))
      : !isIdle && durationSeconds > 0
      ? Math.max(1, Math.min(durationSeconds, 60))
      : 0;

    const userWhere = session.user.id
      ? { id: session.user.id }
      : { email: session.user.email!.toLowerCase().trim() };

    const user = await prisma.user.findUnique({
      where: userWhere,
      select: {
        id: true,
        clientProfileId: true,
        lastLoginAt: true,
        lastActiveAt: true,
        lastSessionDurationSeconds: true,
        sessionCount: true,
        loginCount: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const minutesSinceLastActive = user.lastActiveAt
      ? (now.getTime() - new Date(user.lastActiveAt).getTime()) / (1000 * 60)
      : 999;
    const shouldIncrementSession = isExplicitNewSession || minutesSinceLastActive >= 15;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: now,
        ...(shouldIncrementSession ? { sessionCount: { increment: 1 } } : {}),
        ...(durationSeconds > 0
          ? {
              lastSessionDurationSeconds: durationSeconds,
            }
          : {}),
        ...(deltaSeconds > 0
          ? {
              totalSessionSeconds: { increment: deltaSeconds },
            }
          : {}),
      },
      select: {
        id: true,
        lastActiveAt: true,
        lastSessionDurationSeconds: true,
        totalSessionSeconds: true,
        sessionCount: true,
      },
    });

    if (user.clientProfileId) {
      await prisma.client.update({
        where: { id: user.clientProfileId },
        data: {
          lastActiveAt: now,
          ...(shouldIncrementSession ? { sessionCount: { increment: 1 } } : {}),
          ...(durationSeconds > 0
            ? {
                lastSessionDurationSeconds: durationSeconds,
              }
            : {}),
          ...(deltaSeconds > 0
            ? {
                totalSessionSeconds: { increment: deltaSeconds },
              }
            : {}),
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      lastActiveAt: updatedUser.lastActiveAt,
      lastSessionDurationSeconds: updatedUser.lastSessionDurationSeconds,
      totalSessionSeconds: updatedUser.totalSessionSeconds,
      sessionCount: updatedUser.sessionCount,
      isIdle,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Heartbeat error" }, { status: 500 });
  }
}
