import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkoutSessionStatus } from "@/generated/prisma";

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

type AuthSession = {
  user: {
    id: string;
    role: "TRAINER" | "CLIENT";
    clientProfileId?: string | null;
  };
} | null;

async function resolveAccessibleClient(session: AuthSession, requestedClientId: string | null) {
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  if (session.user.role === "CLIENT") {
    if (!session.user.clientProfileId) {
      return { error: NextResponse.json({ error: "No client profile linked" }, { status: 403 }) };
    }
    if (requestedClientId && requestedClientId !== session.user.clientProfileId) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { clientId: session.user.clientProfileId };
  }

  if (!requestedClientId) {
    return { error: NextResponse.json({ error: "clientId required" }, { status: 400 }) };
  }

  const client = await getOwnedClient(session.user.id, requestedClientId);
  if (!client) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { clientId: requestedClientId };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const access = await resolveAccessibleClient(session, req.nextUrl.searchParams.get("clientId"));
  if ("error" in access) {
    return access.error;
  }

  const workouts = await prisma.workoutSession.findMany({
    where: { clientId: access.clientId },
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
  if (session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { clientId, startedAt, completedAt, notes, exercises, status } = await req.json();
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

  const normalizedStatus = status && Object.values(WorkoutSessionStatus).includes(status)
    ? (status as WorkoutSessionStatus)
    : WorkoutSessionStatus.COMPLETED;

  const normalizedStartedAt = normalizedStatus === WorkoutSessionStatus.PLANNED
    ? null
    : (startedAt ? new Date(startedAt) : new Date());

  const normalizedCompletedAt = normalizedStatus === WorkoutSessionStatus.COMPLETED
    ? (completedAt ? new Date(completedAt) : new Date())
    : null;

  const workout = await prisma.workoutSession.create({
    data: {
      clientId,
      status: normalizedStatus,
      startedAt: normalizedStartedAt,
      completedAt: normalizedCompletedAt,
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
