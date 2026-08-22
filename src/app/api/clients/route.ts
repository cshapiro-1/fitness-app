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

    // Check if trainer has a self-profile ("My Workouts")
    let hasSelfProfile = clients.some((c: any) => c.name === "My Workouts");

    if (!hasSelfProfile && trainerId) {
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
        clients.unshift(selfClient);
      } catch (e) {
        console.error("Auto self client creation error:", e);
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

    const formattedClients = clients.map((c: any) => {
      const isSelfProfile = c.name === "My Workouts" || c.name === "My Workouts (Personal)";
      return {
        id: c.id,
        userId: c.userId,
        name: isSelfProfile ? "My Workouts" : (c.name || "Client"),
        image: isSelfProfile ? (c.image || c.user?.image || null) : (c.image || c.loginUser?.image || null),
        email: isSelfProfile ? null : (c.email || c.loginUser?.email || null),
        phone: isSelfProfile ? null : (c.phone || c.loginUser?.phone || null),
        notes: isSelfProfile ? (c.notes || "Personal workout tracking") : (c.notes || null),
        fitnessGoals: isSelfProfile ? (c.fitnessGoals || "Personal Performance") : (c.fitnessGoals || c.loginUser?.fitnessGoals || null),
        emailNotifications: c.emailNotifications !== false,
        inviteStatus: isSelfProfile ? "ACCEPTED" : (c.inviteStatus || "NOT_SENT"),
        inviteToken: c.inviteToken || null,
        inviteUrl: c.inviteToken ? (baseUrl ? `${baseUrl}/invite/${c.inviteToken}` : `/invite/${c.inviteToken}`) : null,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        workouts: c.workouts || [],
        workoutSessions: c.workoutSessions || [],
        _count: c._count || { workoutSessions: 0 },
        isSelf: isSelfProfile,
      };
    });

    // Pin "My Workouts (Personal)" to the very top of the list
    formattedClients.sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      return 0;
    });

    return NextResponse.json(formattedClients);
  } catch (error) {
    console.error("Fetch clients error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

import { sanitizeText } from "@/lib/sanitize";

// POST /api/clients - Create Client Profile
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let trainerId: string | null = (session.user as any)?.id || null;
    const trainerEmail = session.user.email?.toLowerCase().trim() || null;

    if (!trainerId && trainerEmail) {
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: trainerEmail, mode: "insensitive" } },
      });
      if (dbUser) {
        trainerId = dbUser.id;
      } else if (prisma.user?.create) {
        try {
          const createdUser = await prisma.user.create({
            data: {
              email: trainerEmail,
              name: session.user.name || "Trainer",
              role: "TRAINER",
            },
          });
          if (createdUser?.id) {
            trainerId = createdUser.id;
          }
        } catch (e) {
          console.error("Trainer auto-create error:", e);
        }
      }
    }

    if (!trainerId) {
      return NextResponse.json({ error: "Trainer user profile not found" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, image, email, phone, notes, fitnessGoals } = body;

    const cleanName = sanitizeText(name, 100);
    if (!cleanName) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const cleanEmail = email && typeof email === "string" && email.trim().length > 0
      ? email.trim().toLowerCase()
      : null;

    // Check if client with this email already exists
    if (cleanEmail) {
      const existingClient = await prisma.client.findFirst({
        where: { email: cleanEmail },
        include: {
          user: true,
          loginUser: true,
          workouts: true,
          workoutSessions: {
            include: { exercises: { include: { sets: true } } },
            orderBy: { startedAt: "desc" },
          },
          _count: { select: { workoutSessions: true } },
        },
      });

      if (existingClient) {
        if (existingClient.userId === trainerId) {
          // Re-update and return this client profile for the trainer
          const updated = await prisma.client.update({
            where: { id: existingClient.id },
            data: {
              name: cleanName,
              image: image?.trim() || existingClient.image,
              phone: phone ? sanitizeText(phone, 30) : existingClient.phone,
              notes: notes ? sanitizeText(notes, 1000) : existingClient.notes,
              fitnessGoals: fitnessGoals ? sanitizeText(fitnessGoals, 500) : existingClient.fitnessGoals,
            },
            include: {
              user: true,
              loginUser: true,
              workouts: true,
              workoutSessions: {
                include: { exercises: { include: { sets: true } } },
                orderBy: { startedAt: "desc" },
              },
              _count: { select: { workoutSessions: true } },
            },
          });

          return NextResponse.json({
            id: updated.id,
            userId: updated.userId,
            name: updated.name,
            image: updated.image,
            email: updated.email,
            phone: updated.phone,
            notes: updated.notes,
            fitnessGoals: updated.fitnessGoals,
            inviteStatus: updated.inviteStatus,
            inviteToken: updated.inviteToken,
            inviteUrl: updated.inviteToken ? `/invite/${updated.inviteToken}` : null,
            createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
            workouts: updated.workouts || [],
            workoutSessions: updated.workoutSessions || [],
            _count: updated._count || { workoutSessions: 0 },
          });
        } else {
          return NextResponse.json(
            { error: `A client with the email "${cleanEmail}" already exists in the system.` },
            { status: 409 }
          );
        }
      }
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");

    const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "strkyr.fit";
    const host = rawHost.split(",")[0].trim();
    const rawProto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const proto = rawProto.split(",")[0].trim();
    const baseUrl = `${proto}://${host}`;
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    // Create Client record linked to this trainer (userId: trainerId)
    const client = await prisma.client.create({
      data: {
        userId: trainerId,
        name: cleanName,
        image: image?.trim() || null,
        email: cleanEmail,
        phone: phone ? sanitizeText(phone, 30) : null,
        notes: notes ? sanitizeText(notes, 1000) : null,
        fitnessGoals: fitnessGoals ? sanitizeText(fitnessGoals, 500) : null,
        inviteToken,
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
      inviteToken: client.inviteToken,
      inviteUrl,
      createdAt: client.createdAt ? new Date(client.createdAt).toISOString() : new Date().toISOString(),
      workouts: client.workouts || [],
      workoutSessions: client.workoutSessions || [],
      _count: client._count || { workoutSessions: 0 },
    };

    return NextResponse.json(formattedClient);
  } catch (error: any) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create client" },
      { status: 500 }
    );
  }
}