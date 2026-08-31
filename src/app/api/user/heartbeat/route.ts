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

    const durationSeconds = typeof body.durationSeconds === "number" ? Math.max(0, Math.min(body.durationSeconds, 86400)) : 0;
    const now = new Date();

    const userWhere = session.user.id
      ? { id: session.user.id }
      : { email: session.user.email!.toLowerCase().trim() };

    const user = await prisma.user.findUnique({
      where: userWhere,
      select: { id: true, clientProfileId: true, lastLoginAt: true, lastSessionDurationSeconds: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: now,
        ...(durationSeconds > 0
          ? {
              lastSessionDurationSeconds: durationSeconds,
              totalSessionSeconds: { increment: Math.max(1, Math.min(durationSeconds, 60)) },
            }
          : {}),
      },
      select: { id: true, lastActiveAt: true, lastSessionDurationSeconds: true, totalSessionSeconds: true },
    });

    if (user.clientProfileId) {
      await prisma.client.update({
        where: { id: user.clientProfileId },
        data: {
          lastActiveAt: now,
          ...(durationSeconds > 0
            ? {
                lastSessionDurationSeconds: durationSeconds,
                totalSessionSeconds: { increment: Math.max(1, Math.min(durationSeconds, 60)) },
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
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Heartbeat error" }, { status: 500 });
  }
}
