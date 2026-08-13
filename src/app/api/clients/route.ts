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

    // STRICT TENANT ISOLATION: Only fetch Client records belonging to this trainer's User ID
    const clients = await prisma.client.findMany({
      where: {
        user: {
          trainerId: trainerId,
        },
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

    // Format for Dashboard expectations
    const formattedClients = clients.map((c: any) => ({
      id: c.id,
      userId: c.userId,
      name: c.user?.name || c.name || "Client",
      email: c.user?.email || null,
      notes: c.user?.notes || c.notes || null,
      fitnessGoals: c.user?.fitnessGoals || null,
      status: c.user?.status || "PENDING",
      workouts: c.workouts || [],
      workoutSessions: c.workoutSessions || [],
      _count: c._count,
    }));

    return NextResponse.json(formattedClients);
  } catch (error) {
    console.error("Fetch clients error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/clients - Create User + Client Profile + Invite Link
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
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const fallbackEmail = email || `client_${Date.now()}_${crypto.randomBytes(4).toString("hex")}@placeholder.app`;

    // 1. Create User account assigned to trainer
    const user = await prisma.user.create({
      data: {
        name,
        email: fallbackEmail,
        notes: notes || null,
        trainerId: trainerId,
        role: "CLIENT",
        status: "PENDING",
      } as any,
    });

    // 2. Create Client profile linked to User (includes name)
    const clientData: any = {
      userId: user.id,
      name: name,
    };

    const client = await prisma.client.create({
      data: clientData as any,
      include: {
        user: true,
        workouts: true,
        workoutSessions: true,
        _count: { select: { workoutSessions: true } },
      },
    });

    // 3. Create Invitation Token
    let inviteUrl: string | null = null;
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitation = await (prisma as any).invitation.create({
        data: {
          token,
          clientId: client.id,
          trainerId: trainerId,
          expiresAt,
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      inviteUrl = `${baseUrl}/invite/${invitation.token}`;
    } catch (e) {
      console.error("Invite token warning:", e);
    }

    const formattedClient = {
      id: client.id,
      userId: client.userId,
      name: user.name,
      email: user.email,
      notes: (user as any).notes || null,
      fitnessGoals: (user as any).fitnessGoals || null,
      status: (user as any).status || "PENDING",
      workouts: [],
      workoutSessions: [],
      _count: { workoutSessions: 0 },
      inviteUrl,
    };

    return NextResponse.json(formattedClient);
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}