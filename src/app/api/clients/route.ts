export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// GET /api/clients - STRICTLY ISOLATED to authenticated trainer
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let trainerId = (session.user as any).id;
    if (!trainerId && session.user.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      trainerId = dbUser?.id;
    }

    if (!trainerId) {
      return NextResponse.json([]);
    }

    // STRICT TENANT ISOLATION: Only fetch Client records belonging to this trainer
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { userId: trainerId },
          { user: { trainerId: trainerId } },
        ],
      },
      include: {
        user: true,
        workouts: true,
        workoutSessions: {
          include: {
            exercises: {
              include: {
                sets: true,
              },
            },
          },
          orderBy: { startedAt: "desc" },
        },
        _count: {
          select: { workoutSessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

    // Format for Dashboard expectations
    const formattedClients = clients.map((c: any) => ({
      id: c.id,
      userId: c.userId,
      name: c.name || c.user?.name || "Client",
      email: c.email || c.user?.email || null,
      notes: c.notes || c.user?.notes || null,
      inviteStatus: c.inviteStatus || "NOT_SENT",
      inviteToken: c.inviteToken || null,
      inviteUrl: c.inviteToken ? (baseUrl ? `${baseUrl}/invite/${c.inviteToken}` : `/invite/${c.inviteToken}`) : null,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      workouts: c.workouts || [],
      workoutSessions: c.workoutSessions || [],
      _count: c._count || { workoutSessions: 0 },
    }));

    return NextResponse.json(formattedClients);
  } catch (error) {
    console.error("Fetch clients error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/clients - Create Client Profile + Invite Link
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let trainerId = (session.user as any).id;
    if (!trainerId && session.user.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      trainerId = dbUser?.id;
    }

    if (!trainerId) {
      return NextResponse.json({ error: "Trainer user not found" }, { status: 400 });
    }

    const { name, notes, email } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");

    // Create Client record linked to this trainer (userId: trainerId)
    const client = await prisma.client.create({
      data: {
        userId: trainerId,
        name: name.trim(),
        notes: notes?.trim() || null,
        email: email?.trim() || null,
        inviteToken: token,
        inviteStatus: "PENDING",
        invitedAt: new Date(),
      },
      include: {
        user: true,
        workouts: true,
        workoutSessions: true,
        _count: { select: { workoutSessions: true } },
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const inviteUrl = baseUrl ? `${baseUrl}/invite/${token}` : `/invite/${token}`;

    const formattedClient = {
      id: client.id,
      userId: client.userId,
      name: client.name,
      email: client.email,
      notes: client.notes,
      inviteStatus: client.inviteStatus,
      inviteToken: client.inviteToken,
      inviteUrl,
      createdAt: client.createdAt.toISOString(),
      workouts: client.workouts || [],
      workoutSessions: client.workoutSessions || [],
      _count: client._count || { workoutSessions: 0 },
    };

    return NextResponse.json(formattedClient);
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}