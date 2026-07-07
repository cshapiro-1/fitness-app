import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: session.user.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const workouts = await prisma.workout.findMany({
    where: { clientId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(workouts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId, exercise, weight, sets, reps, date, notes } = await req.json();
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: session.user.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const workout = await prisma.workout.create({
    data: { clientId, exercise: exercise.trim(), weight: Number(weight), sets: Number(sets), reps: Number(reps), date, notes },
  });
  return NextResponse.json(workout);
}
