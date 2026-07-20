import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type IncomingSet = {
  weight: number;
  reps: number;
  notes?: string;
};

type IncomingExercise = {
  name: string;
  sets: IncomingSet[];
};

async function getOwnedClient(userId: string, clientId: string) {
  return prisma.client.findFirst({ where: { id: clientId, userId } });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const client = await getOwnedClient(session.user.id, clientId);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const workouts = await prisma.workoutSession.findMany({
    where: { clientId },
    orderBy: { completedAt: "desc" },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          sets: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  return NextResponse.json(workouts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, startedAt, completedAt, notes, exercises } = await req.json();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const client = await getOwnedClient(session.user.id, clientId);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json({ error: "At least one exercise is required" }, { status: 400 });
  }

  const normalizedExercises = (exercises as IncomingExercise[])
    .map((exercise, index) => {
      const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
      const normalizedSets = sets
        .map((setEntry, setIndex) => ({
          order: setIndex,
          weight: Number(setEntry.weight),
          reps: Number(setEntry.reps),
          notes: setEntry.notes?.trim() || null,
        }))
        .filter((setEntry) => Number.isFinite(setEntry.weight) && setEntry.weight >= 0 && Number.isFinite(setEntry.reps) && setEntry.reps > 0);

      return {
        order: index,
        name: exercise.name?.trim(),
        sets: normalizedSets,
      };
    })
    .filter((exercise) => exercise.name && exercise.sets.length > 0);

  if (normalizedExercises.length === 0) {
    return NextResponse.json({ error: "Each exercise must include at least one valid set" }, { status: 400 });
  }

  const workout = await prisma.workoutSession.create({
    data: {
      clientId,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      notes: notes?.trim() || null,
      exercises: {
        create: normalizedExercises.map((exercise) => ({
          name: exercise.name as string,
          order: exercise.order,
          sets: {
            create: exercise.sets,
          },
        })),
      },
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          sets: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  return NextResponse.json(workout);
}
