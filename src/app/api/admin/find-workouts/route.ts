export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, clientProfileId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const clients = await prisma.client.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const sessions = await prisma.workoutSession.findMany({
      include: {
        exercises: { include: { sets: true }, orderBy: { order: "asc" } },
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const legacyWorkouts = await prisma.workout.findMany({
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      users,
      clients,
      sessions,
      legacyWorkouts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
