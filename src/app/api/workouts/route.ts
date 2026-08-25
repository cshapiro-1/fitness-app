export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWorkoutNotification } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email?.toLowerCase().trim();

    if (!userId && userEmail) {
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: userEmail, mode: "insensitive" } },
      });
      userId = dbUser?.id;
    }
    if (!userId && !userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const urlClientId = new URL(req.url).searchParams.get("clientId");
    let targetClientIds: string[] = [];
    let isSelfQuery = false;

    if (urlClientId && urlClientId !== "all") {
      const targetClient = await prisma.client.findUnique({
        where: { id: urlClientId },
        select: { id: true, name: true, userId: true, email: true },
      });
      if (!targetClient) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      const isCoach = userId && targetClient.userId === userId;
      const isAthlete = userEmail && targetClient.email?.toLowerCase() === userEmail;
      const isAdmin = (session?.user as any)?.isAdmin === true;

      if (!isCoach && !isAthlete && !isAdmin) {
        return NextResponse.json({ error: "Forbidden: Unauthorized access to client workouts" }, { status: 403 });
      }

      targetClientIds = [urlClientId];
      if (targetClient && (targetClient.name === "My Workouts" || targetClient.name.includes("Self") || targetClient.name.includes("Personal"))) {
        isSelfQuery = true;
        const otherSelfClients = await prisma.client.findMany({
          where: {
            userId: targetClient.userId,
            name: { in: ["My Workouts", "Personal", "Self", "My Workouts (Personal)"] },
          },
          select: { id: true },
        });
        otherSelfClients.forEach((c) => {
          if (!targetClientIds.includes(c.id)) targetClientIds.push(c.id);
        });
      }
    } else {
      // urlClientId === "all" or missing: Find all client IDs associated with current trainer/user
      if (userId) {
        const trainerClients = await prisma.client.findMany({
          where: { userId },
          select: { id: true },
        });
        trainerClients.forEach((c) => {
          if (!targetClientIds.includes(c.id)) targetClientIds.push(c.id);
        });
      }
      if (userEmail) {
        const matching = await prisma.client.findMany({
          where: { email: { equals: userEmail, mode: "insensitive" } },
          select: { id: true },
        });
        matching.forEach((c) => {
          if (!targetClientIds.includes(c.id)) targetClientIds.push(c.id);
        });
      }
    }

    if (targetClientIds.length === 0 && !userId) {
      return NextResponse.json([]);
    }

    // Fetch real WorkoutSessions
    const sessions = await prisma.workoutSession.findMany({
      where: {
        OR: [
          ...(targetClientIds.length > 0 ? [{ clientId: { in: targetClientIds } }] : []),
          ...(isSelfQuery && userId ? [{ loggedById: userId }] : []),
        ],
      },
      include: {
        exercises: { orderBy: { order: "asc" }, include: { sets: { orderBy: { order: "asc" } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch legacy seeded Workouts and dynamically group them
    const legacyWorkouts = targetClientIds.length > 0
      ? await prisma.workout.findMany({
          where: { clientId: { in: targetClientIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const sessionMap = new Map();
    for (const w of legacyWorkouts) {
       const sessionKey = w.date || (w.createdAt ? new Date(w.createdAt).toISOString() : "unknown");
       if (!sessionMap.has(sessionKey)) {
          sessionMap.set(sessionKey, {
             id: "session-" + w.id, clientId: w.clientId, status: "COMPLETED",
             createdAt: w.createdAt ? new Date(w.createdAt).toISOString() : w.date,
             completedAt: w.date || new Date().toISOString(), notes: w.notes || "", exercises: []
          });
       }
       const s = sessionMap.get(sessionKey);
       if (!s.notes && w.notes) s.notes = w.notes;
       s.loggedByRole = w.loggedByRole || "TRAINER";
       s.loggedByName = w.loggedByName || null;
       s.exercises.push({
          id: "leg-ex-" + w.id, order: s.exercises.length, name: w.exercise,
          sets: Array.from({ length: w.sets || 1 }, (_, i) => ({ id: "leg-set-" + w.id + "-" + i, order: i, weight: w.weight || 0, reps: w.reps || 0, notes: "" }))
       });
    }

    const legacyMapped = Array.from(sessionMap.values());
    const all = [...sessions, ...legacyMapped].sort((a,b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
    return NextResponse.json(all);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText, validateNumericBounds } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.MUTATION);
    if (rateCheck.limited && rateCheck.response) {
      return rateCheck.response;
    }

    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    let trainerName = session?.user?.name || "Your Coach";
    let userRole = (session?.user as any)?.role || "TRAINER";

    if (!userId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = dbUser?.id;
      if (dbUser?.name) trainerName = dbUser.name;
      if (dbUser?.role) userRole = dbUser.role;
    }
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { clientId, status, startedAt, completedAt, notes, exercises } = body;
    
    if (!clientId || !exercises) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const targetClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, userId: true, email: true, name: true, emailNotifications: true },
    });

    if (!targetClient) {
      return NextResponse.json({ error: "Target client not found" }, { status: 404 });
    }

    const isCoach = targetClient.userId === userId;
    const isAthlete = session?.user?.email && targetClient.email?.toLowerCase() === session.user.email.toLowerCase();
    const isAdmin = (session?.user as any)?.isAdmin === true;

    if (!isCoach && !isAthlete && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot log workouts for this client" }, { status: 403 });
    }

    const cleanNotes = sanitizeText(notes, 1000);

    const created = await prisma.workoutSession.create({
      data: {
        clientId,
        status: status || "COMPLETED",
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        notes: cleanNotes || null,
        loggedByRole: userRole,
        loggedById: userId,
        loggedByName: sanitizeText(trainerName, 100),
        exercises: {
          create: exercises.map((ex: any, i: number) => ({
            name: sanitizeText(ex.name, 150),
            order: i,
            category: ex.isBodyweight || ex.category === "BODYWEIGHT" ? "BODYWEIGHT" : "STRENGTH",
            sets: {
              create: (ex.sets || []).map((s: any, j: number) => ({
                order: j,
                weight: validateNumericBounds(s.weight, 0, 2500, 0),
                reps: validateNumericBounds(s.reps, 0, 1000, 0),
                notes: sanitizeText(s.notes, 250) || null,
              })),
            },
          })),
        },
      },
      include: { exercises: { include: { sets: true } } }
    });

    // Trigger Email Notification for Client if they have an email & notifications enabled
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { user: true },
      });

      if (client?.email && client.emailNotifications !== false) {
        const notifTrainer = client.user?.name || trainerName || "Coach";
        const notifType = status === "PLANNED" ? "ASSIGNED" : "COMPLETED";

        await sendWorkoutNotification({
          recipientEmail: client.email,
          recipientName: client.name || "Athlete",
          trainerName: notifTrainer,
          type: notifType,
          notes: notes || null,
          exercises: exercises.map((ex: any) => ({
            name: ex.name,
            sets: (ex.sets || []).map((s: any) => ({
              weight: s.weight,
              reps: s.reps,
              notes: s.notes,
            })),
          })),
          dateStr: completedAt
            ? new Date(completedAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          clientId,
        });
      }
    } catch (emailErr) {
      console.error("Failed to trigger email notification:", emailErr);
      // Do not fail the workout creation request if email dispatcher errors
    }

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}