export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
        loginUser: true,
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
    const formattedClients = clients.map((c: any) => {
      const isSelfProfile = c.name === "My Workouts";
      return {
        id: c.id,
        userId: c.userId,
        name: c.name || (isSelfProfile ? c.user?.name : "Client"),
        // CRITICAL FIX: Do not fall back to c.user.email/phone (which is the trainer's account)
        email: isSelfProfile ? (c.email || c.user?.email || null) : (c.email || c.loginUser?.email || null),
        phone: isSelfProfile ? (c.phone || c.user?.phone || null) : (c.phone || c.loginUser?.phone || null),
        notes: isSelfProfile ? (c.notes || c.user?.notes || null) : (c.notes || null),
        fitnessGoals: isSelfProfile ? (c.fitnessGoals || c.user?.fitnessGoals || null) : (c.fitnessGoals || c.loginUser?.fitnessGoals || null),
        inviteStatus: isSelfProfile ? "ACCEPTED" : (c.inviteStatus || "NOT_SENT"),
        inviteToken: c.inviteToken || null,
        inviteUrl: c.inviteToken ? (baseUrl ? `${baseUrl}/invite/${c.inviteToken}` : `/invite/${c.inviteToken}`) : null,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        workouts: c.workouts || [],
        workoutSessions: c.workoutSessions || [],
        _count: c._count || { workoutSessions: 0 },
      };
    });

    return NextResponse.json(formattedClients);
  } catch (error) {
    console.error("Fetch clients error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/clients - Create Client Profile (default NOT_SENT invite)
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

    const { name, email, phone, notes, fitnessGoals } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    // Create Client record linked to this trainer (userId: trainerId)
    // Default inviteStatus is NOT_SENT, inviteToken is null
    const client = await prisma.client.create({
      data: {
        userId: trainerId,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        fitnessGoals: fitnessGoals?.trim() || null,
        inviteToken: null,
        inviteStatus: "NOT_SENT",
      },
      include: {
        user: true,
        loginUser: true,
        workouts: true,
        workoutSessions: true,
        _count: { select: { workoutSessions: true } },
      },
    });

    const formattedClient = {
      id: client.id,
      userId: client.userId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      notes: client.notes,
      fitnessGoals: client.fitnessGoals,
      inviteStatus: client.inviteStatus,
      inviteToken: null,
      inviteUrl: null,
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