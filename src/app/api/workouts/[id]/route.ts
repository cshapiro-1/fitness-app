export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    
    if (params.id.startsWith("session-")) return NextResponse.json({ error: "Cannot modify legacy flat workouts. Please start a new workout." }, { status: 400 });

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
              sets: { create: ex.sets.map((s: any, j: number) => ({ order: j, weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, notes: s.notes || null })) }
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
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (params.id.startsWith("session-")) {
      const realId = params.id.replace("session-", "");
      await prisma.workout.deleteMany({ where: { id: realId } });
      return NextResponse.json({ success: true });
    }
    await prisma.workoutSession.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}