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
          ...(trainerEmail ? [{ email: { equals: trainerEmail, mode: "insensitive" as const } }] : []),
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

    // Fetch full trainer user details for profile consolidation
    const trainerUser = trainerId
      ? await prisma.user.findUnique({
          where: { id: trainerId },
          select: { id: true, name: true, image: true, email: true, phone: true, notes: true, fitnessGoals: true, clientProfileId: true },
        })
      : null;

    // Resolve or consolidate trainer's self-profile
    const isSelfMatch = (c: any) =>
      c.id === trainerUser?.clientProfileId ||
      c.name === "My Workouts" ||
      c.name === "My Workouts (Personal)" ||
      c.name === "Personal" ||
      c.name === "Self" ||
      c.name.includes("(You)") ||
      Boolean(trainerEmail && c.email && c.email.toLowerCase() === trainerEmail.toLowerCase());

    let selfClients = clients.filter(isSelfMatch);

    let primarySelfClient: any = null;
    if (trainerUser?.clientProfileId) {
      primarySelfClient = clients.find((c: any) => c.id === trainerUser.clientProfileId);
      if (!primarySelfClient) {
        primarySelfClient = await prisma.client.findUnique({
          where: { id: trainerUser.clientProfileId },
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
        if (primarySelfClient) clients.push(primarySelfClient);
      }
    }

    if (!primarySelfClient && selfClients.length > 0) {
      primarySelfClient = [...selfClients].sort((a: any, b: any) => {
        const countA = (a._count?.workoutSessions || 0) + (a.workouts?.length || 0);
        const countB = (b._count?.workoutSessions || 0) + (b.workouts?.length || 0);
        return countB - countA;
      })[0];
    }

    const selfDisplayName = trainerUser?.name
      ? `${trainerUser.name} (You)`
      : (primarySelfClient?.name || "My Workouts");

    if (!primarySelfClient && trainerId) {
      try {
        primarySelfClient = await prisma.client.create({
          data: {
            userId: trainerId,
            name: selfDisplayName,
            email: trainerUser?.email || null,
            image: trainerUser?.image || null,
            phone: trainerUser?.phone || null,
            notes: trainerUser?.notes || "Personal workout tracking",
            fitnessGoals: trainerUser?.fitnessGoals || "Personal Performance & PRs",
            inviteStatus: "ACCEPTED",
          },
          include: {
            user: true,
            loginUser: true,
            workouts: true,
            workoutSessions: {
              include: { exercises: { include: { sets: true } } },
            },
            _count: { select: { workoutSessions: true } },
          },
        });
        clients.unshift(primarySelfClient);
      } catch (e) {
        console.error("Auto self client creation error:", e);
      }
    }

    if (primarySelfClient && trainerUser) {
      // Ensure trainerUser.clientProfileId is linked
      if (trainerUser.clientProfileId !== primarySelfClient.id) {
        try {
          await prisma.user.update({
            where: { id: trainerUser.id },
            data: { clientProfileId: primarySelfClient.id },
          });
        } catch (e) {}
      }

      // Re-attribute all workouts, sessions, and logs from duplicate self records to primarySelfClient (ZERO DATA LOSS)
      const duplicateSelfClients = selfClients.filter((c: any) => c.id !== primarySelfClient.id);
      if (duplicateSelfClients.length > 0) {
        const duplicateIds = duplicateSelfClients.map((c: any) => c.id);
        try {
          await prisma.workoutSession.updateMany({
            where: { clientId: { in: duplicateIds } },
            data: { clientId: primarySelfClient.id },
          });
          await prisma.workout.updateMany({
            where: { clientId: { in: duplicateIds } },
            data: { clientId: primarySelfClient.id },
          });
          await prisma.nutritionLog.updateMany({
            where: { clientId: { in: duplicateIds } },
            data: { clientId: primarySelfClient.id },
          });
          await prisma.supplementLog.updateMany({
            where: { clientId: { in: duplicateIds } },
            data: { clientId: primarySelfClient.id },
          });
          await prisma.client.deleteMany({
            where: { id: { in: duplicateIds } },
          });
        } catch (mergeErr) {
          console.error("Self client consolidation merge error:", mergeErr);
        }
        clients = clients.filter((c: any) => !duplicateIds.includes(c.id));
      }

      // Ensure primary self client's name and details mirror the trainer profile
      if (primarySelfClient.name !== selfDisplayName) {
        try {
          await prisma.client.update({
            where: { id: primarySelfClient.id },
            data: {
              name: selfDisplayName,
              ...(trainerUser.image && { image: trainerUser.image }),
              ...(trainerUser.phone && { phone: trainerUser.phone }),
              ...(trainerUser.notes && { notes: trainerUser.notes }),
              ...(trainerUser.fitnessGoals && { fitnessGoals: trainerUser.fitnessGoals }),
            },
          });
          primarySelfClient.name = selfDisplayName;
          if (trainerUser.image) primarySelfClient.image = trainerUser.image;
        } catch (e) {}
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

    const formattedClients = clients.map((c: any) => {
      const isSelfProfile = c.id === primarySelfClient?.id || isSelfMatch(c);
      return {
        id: c.id,
        userId: c.userId,
        name: isSelfProfile ? (c.name.includes("(You)") ? c.name : selfDisplayName) : (c.name || "Client"),
        image: isSelfProfile ? (c.image || trainerUser?.image || c.user?.image || null) : (c.image || c.loginUser?.image || null),
        email: isSelfProfile ? null : (c.email || c.loginUser?.email || null),
        phone: isSelfProfile ? (c.phone || trainerUser?.phone || null) : (c.phone || c.loginUser?.phone || null),
        notes: isSelfProfile ? (c.notes || trainerUser?.notes || "Personal workout tracking") : (c.notes || null),
        fitnessGoals: isSelfProfile ? (c.fitnessGoals || trainerUser?.fitnessGoals || "Personal Performance") : (c.fitnessGoals || c.loginUser?.fitnessGoals || null),
        emailNotifications: c.emailNotifications !== false,
        inviteStatus: isSelfProfile ? "ACCEPTED" : (c.inviteStatus || "NOT_SENT"),
        inviteToken: isSelfProfile ? null : (c.inviteToken || null),
        inviteUrl: isSelfProfile ? null : (c.inviteToken ? (baseUrl ? `${baseUrl}/invite/${c.inviteToken}` : `/invite/${c.inviteToken}`) : null),
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        workouts: c.workouts || [],
        workoutSessions: c.workoutSessions || [],
        _count: c._count || { workoutSessions: c.workoutSessions?.length || 0 },
        isSelf: isSelfProfile,
      };
    });

    // Pin consolidated personal profile to the very top of the list
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