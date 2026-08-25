export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const jose = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: "chisailor67", mode: "insensitive" } },
          { name: { contains: "Jose", mode: "insensitive" } },
        ],
      },
      include: {
        clients: {
          include: {
            _count: {
              select: { workoutSessions: true },
            },
            workoutSessions: {
              select: {
                id: true,
                notes: true,
                status: true,
                createdAt: true,
                startedAt: true,
                completedAt: true,
                loggedByName: true,
                loggedByRole: true,
                _count: { select: { exercises: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!jose) {
      const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
      return NextResponse.json({ error: "Jose Dildine not found in database", allUsers }, { status: 404 });
    }

    const clientSummaries = jose.clients.map((c) => {
      const workouts = c.workoutSessions;
      const importedWorkouts = workouts.filter((w) =>
        (w.notes && (w.notes.toLowerCase().includes("import") || w.notes.toLowerCase().includes("sms") || w.notes.toLowerCase().includes("text"))) ||
        w._count.exercises > 0
      );

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalWorkouts: workouts.length,
        hasHistory: workouts.length > 0,
        workouts: workouts.map((w) => ({
          id: w.id,
          date: (w.completedAt || w.startedAt || w.createdAt)?.toISOString().split("T")[0],
          status: w.status,
          exercisesCount: w._count.exercises,
          loggedBy: w.loggedByName || w.loggedByRole || "System",
          notes: w.notes,
        })),
      };
    });

    const totalWorkouts = clientSummaries.reduce((sum, c) => sum + c.totalWorkouts, 0);

    return NextResponse.json({
      coach: {
        id: jose.id,
        name: jose.name,
        email: jose.email,
        totalClients: jose.clients.length,
        totalWorkoutsAcrossRoster: totalWorkouts,
      },
      clients: clientSummaries,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to inspect Jose's clients" }, { status: 500 });
  }
}
