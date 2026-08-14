export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        workouts: true,
        workoutSessions: {
          include: {
            exercises: { include: { sets: true } },
          },
        },
      },
    });

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, clientProfileId: true },
    });

    const allSessions = await prisma.workoutSession.findMany({
      include: {
        client: {
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        },
        exercises: { include: { sets: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const allLegacyWorkouts = await prisma.workout.findMany({
      include: {
        client: {
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users,
      clients,
      allSessions,
      allLegacyWorkouts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
