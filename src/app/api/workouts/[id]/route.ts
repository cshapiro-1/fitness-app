export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email?.toLowerCase().trim();
    if (!userId && userEmail) {
      const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
      userId = dbUser?.id;
    }
    if (!userId && !userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    
    if (params.id.startsWith("session-")) return NextResponse.json({ error: "Cannot modify legacy flat workouts. Please start a new workout." }, { status: 400 });

    const sessionToUpdate = await prisma.workoutSession.findUnique({
      where: { id: params.id },
      include: { client: true },
    });

    if (!sessionToUpdate) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const isCoach = (userId && sessionToUpdate.client.userId === userId) || (userId && sessionToUpdate.loggedById === userId);
    const isAthlete = userEmail && sessionToUpdate.client.email?.toLowerCase() === userEmail;
    const isAdmin = (session?.user as any)?.isAdmin === true;

    if (!isCoach && !isAthlete && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to modify this workout" }, { status: 403 });
    }

    if (body.exercises) {
      await prisma.workoutExercise.deleteMany({ where: { workoutSessionId: params.id } });
      const updated = await prisma.workoutSession.update({
        where: { id: params.id },
        data: {
          status: body.status,
          startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
          completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
          notes: body.notes !== undefined ? body.notes : undefined,
          exercises: {
            create: body.exercises.map((ex: any, i: number) => ({
              name: ex.name, order: i,
              category: ex.isBodyweight || ex.category === "BODYWEIGHT" ? "BODYWEIGHT" : "STRENGTH",
              sets: { create: (ex.sets || []).map((s: any, j: number) => ({ order: j, weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, notes: s.notes || null })) }
            }))
          }
        },
        include: { exercises: { include: { sets: true } } }
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.workoutSession.update({
      where: { id: params.id },
      data: { status: body.status, startedAt: body.startedAt ? new Date(body.startedAt) : undefined },
      include: { exercises: { include: { sets: true } } }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    let userEmail = session?.user?.email;
    if (!userId && userEmail) {
      const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
      userId = dbUser?.id;
    }
    if (!userId && !userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;

    if (params.id.startsWith("session-")) {
      const realId = params.id.replace("session-", "");
      await prisma.workout.deleteMany({ where: { id: realId } });
      return NextResponse.json({ success: true });
    }

    const sessionToDelete = await prisma.workoutSession.findUnique({
      where: { id: params.id },
      include: { client: true },
    });

    if (!sessionToDelete) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    // Check permission: user is coach of client, loggedBy user, or the client profile owner
    const isCoach = sessionToDelete.client.userId === userId || sessionToDelete.loggedById === userId;
    const isClientOwner = dbUser?.clientProfileId === sessionToDelete.clientId || (userEmail && sessionToDelete.client.email?.toLowerCase() === userEmail.toLowerCase());
    const isAdmin = (session?.user as any)?.isAdmin === true || dbUser?.isAdmin === true;

    if (!isCoach && !isClientOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete this workout" }, { status: 403 });
    }

    const shouldPurge = new URL(req.url).searchParams.get("purge") === "true";
    if (shouldPurge && (isCoach || isAdmin)) {
      await prisma.workoutSession.delete({ where: { id: params.id } });
      return NextResponse.json({ success: true, purged: true });
    }

    const deleterName = session?.user?.name || (isCoach ? "Coach" : "Athlete");
    const deleterRole = isCoach ? "TRAINER" : "CLIENT";
    const now = new Date();
    const formattedTimestamp = now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    const updated = await prisma.workoutSession.update({
      where: { id: params.id },
      data: {
        deletedAt: now,
        deletedByName: deleterName,
        deletedByRole: deleterRole,
        notes: sessionToDelete.notes
          ? `${sessionToDelete.notes} • [Workout deleted by ${deleterName} on ${formattedTimestamp}]`
          : `Workout deleted by ${deleterName} on ${formattedTimestamp}`,
      },
      include: {
        exercises: { include: { sets: true } },
      },
    });

    return NextResponse.json({ success: true, workout: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}