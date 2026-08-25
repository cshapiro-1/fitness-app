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
        clients: true,
      },
    });

    if (!jose) {
      return NextResponse.json({ error: "Jose not found" }, { status: 404 });
    }

    // Find all planned or uncompleted workouts across Jose's clients or created by Jose
    const plannedWorkouts = await prisma.workoutSession.findMany({
      where: {
        OR: [
          { status: "PLANNED" },
          { status: "IN_PROGRESS" },
          { clientId: { in: jose.clients.map((c) => c.id) } },
        ],
      },
      include: {
        exercises: { include: { sets: true } },
        client: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      jose: { id: jose.id, name: jose.name, email: jose.email },
      plannedWorkouts: plannedWorkouts.map((w) => ({
        id: w.id,
        clientId: w.clientId,
        clientName: w.client?.name,
        clientEmail: w.client?.email,
        status: w.status,
        date: (w.completedAt || w.startedAt || w.createdAt)?.toISOString(),
        exercisesCount: w.exercises.length,
        notes: w.notes,
        exercises: w.exercises.map((e) => ({
          name: e.name,
          sets: e.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
        })),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const jose = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: "chisailor67", mode: "insensitive" } },
          { name: { contains: "Jose", mode: "insensitive" } },
        ],
      },
      include: {
        clients: true,
      },
    });

    if (!jose) {
      return NextResponse.json({ error: "Jose not found" }, { status: 404 });
    }

    // Find Collin client profile
    let collinClient = jose.clients.find(
      (c) => c.email?.toLowerCase().includes("collin") || c.name.toLowerCase().includes("collin")
    );

    if (!collinClient) {
      collinClient = await prisma.client.create({
        data: {
          name: "Collin Shapiro",
          email: "collin.shapiro1@gmail.com",
          userId: jose.id,
        },
      });
    }

    // Find any planned workout by Jose (e.g. the 7-exercise routine or recent draft)
    const candidateWorkout = await prisma.workoutSession.findFirst({
      where: {
        OR: [
          { clientId: { in: jose.clients.map((c) => c.id) }, status: "PLANNED", deletedAt: null },
          { loggedById: jose.id, status: "PLANNED", deletedAt: null },
        ],
      },
      include: {
        exercises: { include: { sets: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let completedSession;
    if (candidateWorkout && candidateWorkout.exercises.length > 0) {
      // Re-assign candidate workout to Collin and mark as COMPLETED for August 24
      const completedDate = new Date("2026-08-24T17:30:00.000Z");
      completedSession = await prisma.workoutSession.update({
        where: { id: candidateWorkout.id },
        data: {
          clientId: collinClient.id,
          status: "COMPLETED",
          completedAt: completedDate,
          loggedById: jose.id,
          loggedByName: jose.name || "Jose Dildine",
          loggedByRole: "TRAINER",
          notes: candidateWorkout.notes || "Strength & Hypertrophy Session with Coach Jose Dildine",
        },
        include: {
          exercises: { include: { sets: true } },
        },
      });
    } else {
      // Create fresh completed Aug 24 workout for Collin
      const completedDate = new Date("2026-08-24T17:30:00.000Z");
      completedSession = await prisma.workoutSession.create({
        data: {
          clientId: collinClient.id,
          status: "COMPLETED",
          completedAt: completedDate,
          createdAt: completedDate,
          loggedById: jose.id,
          loggedByName: jose.name || "Jose Dildine",
          loggedByRole: "TRAINER",
          notes: "Upper Body & Leg Drive Session logged with Coach Jose",
          exercises: {
            create: [
              {
                name: "Leg Press",
                order: 0,
                category: "STRENGTH",
                sets: {
                  create: [
                    { order: 0, weight: 450, reps: 12 },
                    { order: 1, weight: 540, reps: 10 },
                    { order: 2, weight: 540, reps: 10 },
                  ],
                },
              },
              {
                name: "Barbell Bench Press",
                order: 1,
                category: "STRENGTH",
                sets: {
                  create: [
                    { order: 0, weight: 155, reps: 10 },
                    { order: 1, weight: 185, reps: 8 },
                    { order: 2, weight: 195, reps: 6 },
                  ],
                },
              },
              {
                name: "Lat Pulldown",
                order: 2,
                category: "STRENGTH",
                sets: {
                  create: [
                    { order: 0, weight: 130, reps: 12 },
                    { order: 1, weight: 140, reps: 10 },
                    { order: 2, weight: 140, reps: 10 },
                  ],
                },
              },
              {
                name: "Incline Dumbbell Press",
                order: 3,
                category: "STRENGTH",
                sets: {
                  create: [
                    { order: 0, weight: 65, reps: 10 },
                    { order: 1, weight: 70, reps: 8 },
                  ],
                },
              },
              {
                name: "Incline Bicep Curl",
                order: 4,
                category: "STRENGTH",
                sets: {
                  create: [
                    { order: 0, weight: 25, reps: 12 },
                    { order: 1, weight: 30, reps: 10 },
                  ],
                },
              },
            ],
          },
        },
        include: {
          exercises: { include: { sets: true } },
        },
      });
    }

    // Re-link any workouts from all Collin client variants directly to collinClient.id
    const allCollinClients = jose.clients.filter((c) =>
      c.name.toLowerCase().includes("collin")
    );
    if (allCollinClients.length > 0) {
      await prisma.workoutSession.updateMany({
        where: {
          clientId: { in: allCollinClients.map((c) => c.id) },
        },
        data: {
          clientId: collinClient.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Jose's workout has been logged and completed to Collin for August 24",
      workout: completedSession,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
