import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "TRAINER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let selfProfile = session.user.clientProfileId
    ? await prisma.client.findFirst({
        where: { id: session.user.clientProfileId, userId: session.user.id },
        include: { _count: { select: { workoutSessions: true } } },
      })
    : null;

  if (!selfProfile) {
    selfProfile = await prisma.client.findFirst({
      where: { userId: session.user.id, name: "My Workouts" },
      include: { _count: { select: { workoutSessions: true } } },
    });
  }

  if (!selfProfile) {
    selfProfile = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: "My Workouts",
        email: session.user.email?.trim().toLowerCase() || null,
        notes: "Personal trainer workouts",
      },
      include: { _count: { select: { workoutSessions: true } } },
    });
  }

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id, id: { not: selfProfile.id } },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { workoutSessions: true } } },
  });

  return NextResponse.json([selfProfile, ...clients]);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "TRAINER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, notes, email } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const normalizedEmail = email?.trim()?.toLowerCase() || null;
  if (normalizedEmail) {
    const existingClientEmail = await prisma.client.findFirst({ where: { email: normalizedEmail }, select: { id: true } });
    if (existingClientEmail) {
      return NextResponse.json({ error: "Client email already in use" }, { status: 409 });
    }
  }

  const client = await prisma.client.create({
    data: { userId: session.user.id, name: name.trim(), notes, email: normalizedEmail },
  });
  return NextResponse.json(client);
}
