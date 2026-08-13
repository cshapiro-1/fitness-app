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

    let trainerId: string | null = null;
    let trainerEmail = session.user.email?.toLowerCase().trim() || null;

    if (trainerEmail) {
      const dbUser = await prisma.user.findUnique({ where: { email: trainerEmail } });
      if (dbUser) {
        trainerId = dbUser.id;
      }
    }

    if (!trainerId) {
      trainerId = (session.user as any).id || null;
    }

    if (!trainerId && !trainerEmail) {
      return NextResponse.json([]);
    }

    // STRICT TENANT ISOLATION: Fetch all clients created by or associated with this trainer
    let clients = await prisma.client.findMany({
      where: {
        OR: [
          ...(trainerId ? [{ userId: trainerId }] : []),
          ...(trainerId ? [{ user: { id: trainerId } }] : []),
          ...(trainerEmail ? [{ user: { email: trainerEmail } }] : []),
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

    // If new trainer with no client records, automatically ensure self-profile "My Workouts"
    if (clients.length === 0 && trainerId) {
      try {
        const selfClient = await prisma.client.create({
          data: {
            userId: trainerId,
            name: "My Workouts",
            notes: "Personal workout tracking",
            inviteStatus: "ACCEPTED",
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
            },
            _count: { select: { workoutSessions: true } },
          },
        });
        clients = [selfClient];
      } catch (e) {
        console.error("Auto self client creation error:", e);
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

    // Format for Dashboard expectations
    const formattedClients = clients.map((c: any) => {
      const isSelfProfile = c.name === "My Workouts";
      return {
        id: c.id,
        userId: c.userId,
        name: c.name || (isSelfProfile ? c.user?.name : "Client"),
        image: isSelfProfile ? (c.image || c.user?.image || null) : (c.image || c.loginUser?.image || null),
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

// POST /api/clients - Create Client Profile
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let trainerId: string | null = null;
    let trainerEmail = session.user.email?.toLowerCase().trim() || null;

    if (trainerEmail) {
      const dbUser = await prisma.user.findUnique({ where: { email: trainerEmail } });
      if (dbUser) {
        trainerId = dbUser.id;
      }
    }

    if (!trainerId) {
      trainerId = (session.user as any).id || null;
    }

    if (!trainerId) {
      return NextResponse.json({ error: "Trainer user profile not found" }, { status: 400 });
    }

    const { name, image, email, phone, notes, fitnessGoals } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    // Create Client record linked to this trainer (userId: trainerId)
    const client = await prisma.client.create({
      data: {
        userId: trainerId,
        name: name.trim(),
        image: image?.trim() || null,
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
        workoutSessions: {
          include: {
            exercises: {
              include: {
                sets: true,
              },
            },
          },
        },
        _count: { select: { workoutSessions: true } },
      },
    });

    const formattedClient = {
      id: client.id,
      userId: client.userId,
      name: client.name,
      image: client.image,
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