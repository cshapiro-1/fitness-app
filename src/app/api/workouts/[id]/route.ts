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

async function findAccessibleWorkout(userId: string, role: "TRAINER" | "CLIENT", clientProfileId: string | null | undefined, workoutId: string) {
  if (role === "CLIENT") {
    if (!clientProfileId) return null;
    return prisma.workoutSession.findFirst({ where: { id: workoutId, clientId: clientProfileId } });
  }

  return prisma.workoutSession.findFirst({
    where: {
      id: workoutId,
      client: { userId },
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "TRAINER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const workout = await findAccessibleWorkout(session.user.id, session.user.role, session.user.clientProfileId, id);
  if (!workout)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.workoutSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const workout = await findAccessibleWorkout(session.user.id, session.user.role, session.user.clientProfileId, id);
  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, startedAt, completedAt, notes, exercises } = await req.json();
  const normalizedStatus = status && Object.values(WorkoutSessionStatus).includes(status)
    ? (status as WorkoutSessionStatus)
    : workout.status;

  const normalizedExercises = Array.isArray(exercises)
    ? (exercises as IncomingExercise[])
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
      .filter((exercise) => exercise.name && exercise.sets.length > 0)
    : null;

  if (Array.isArray(exercises) && (!normalizedExercises || normalizedExercises.length === 0)) {
    return NextResponse.json({ error: "Each exercise must include at least one valid set" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (normalizedExercises) {
      await tx.workoutExercise.deleteMany({ where: { workoutSessionId: id } });
    }

    return tx.workoutSession.update({
      where: { id },
      data: {
        status: normalizedStatus,
        startedAt: startedAt === undefined ? undefined : (startedAt ? new Date(startedAt) : null),
        completedAt: completedAt === undefined ? undefined : (completedAt ? new Date(completedAt) : null),
        notes: notes === undefined ? undefined : (notes?.trim() || null),
        exercises: normalizedExercises
          ? {
              create: normalizedExercises.map((exercise) => ({
                name: exercise.name as string,
                order: exercise.order,
                sets: {
                  create: exercise.sets,
                },
              })),
            }
          : undefined,
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
  });

  return NextResponse.json(updated);
}
