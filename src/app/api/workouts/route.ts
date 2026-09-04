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
    const isUserCollin = Boolean(
      (userEmail && userEmail.includes("collin")) ||
      (session?.user?.name && session.user.name.toLowerCase().includes("collin"))
    );

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

      const isTargetCollin = Boolean(
        targetClient.name?.toLowerCase().includes("collin") ||
        (targetClient.email && targetClient.email.toLowerCase().includes("collin"))
      );

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
      } else if (isTargetCollin && (isUserCollin || isAdmin)) {
        // Only consolidate Collin's personal client records when Collin/Admin is viewing Collin's personal profile
        const otherCollinClients = await prisma.client.findMany({
          where: {
            OR: [
              { name: { contains: "Collin", mode: "insensitive" } },
              { email: { contains: "collin", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
        otherCollinClients.forEach((c) => {
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

      const userName = session?.user?.name?.trim();
      if (userName) {
        const parts = userName.split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ");
        const initial = lastName ? lastName[0] : "";
        const searchTerms = [
          userName,
          firstName,
          initial ? `${firstName} ${initial}.` : "",
          initial ? `${firstName} ${initial}` : "",
        ].filter(Boolean);

        const nameMatched = await prisma.client.findMany({
          where: {
            OR: searchTerms.map((term) => ({
              name: { contains: term, mode: "insensitive" as const },
            })),
          },
          select: { id: true },
        });
        nameMatched.forEach((c) => {
          if (!targetClientIds.includes(c.id)) targetClientIds.push(c.id);
        });
      }
    }

    if (targetClientIds.length === 0 && !userId) {
      return NextResponse.json([]);
    }

    // Fetch real WorkoutSessions
    const isSingleClientQuery = Boolean(urlClientId && urlClientId !== "all");
    const sessionWhereClause: any = {
      deletedAt: null,
    };

    if (isSingleClientQuery) {
      sessionWhereClause.clientId = { in: targetClientIds };
    } else {
      sessionWhereClause.OR = [
        ...(targetClientIds.length > 0 ? [{ clientId: { in: targetClientIds } }] : []),
        ...((isSelfQuery || !urlClientId || urlClientId === "all") && userId ? [{ loggedById: userId }] : []),
      ];
    }

    const sessions = await prisma.workoutSession.findMany({
      where: sessionWhereClause,
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
    let { clientId, status, startedAt, completedAt, notes, exercises } = body;
    
    if (!exercises) return NextResponse.json({ error: "Missing data: exercises are required" }, { status: 400 });

    let targetClient: any = null;
    if (clientId && clientId !== "self") {
      targetClient = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, userId: true, email: true, name: true, emailNotifications: true },
      });
    }

    // If clientId was "self", omitted, or targetClient not found, resolve client for current user/athlete
    if (!targetClient) {
      targetClient = await prisma.client.findFirst({
        where: {
          OR: [
            { userId },
            ...(session?.user?.email ? [{ email: { equals: session.user.email, mode: "insensitive" as const } }] : []),
          ],
        },
        select: { id: true, userId: true, email: true, name: true, emailNotifications: true },
      });

      // Auto-create self client profile if solo athlete has none
      if (!targetClient) {
        targetClient = await prisma.client.create({
          data: {
            userId,
            name: session?.user?.name || "Solo Athlete",
            email: session?.user?.email || null,
            inviteStatus: "ACCEPTED",
            notes: "Personal Solo Athlete Profile",
          },
          select: { id: true, userId: true, email: true, name: true, emailNotifications: true },
        });
      }
      clientId = targetClient.id;
    }

    const isCoach = targetClient.userId === userId;
    const isAthlete = (session?.user?.email && targetClient.email?.toLowerCase() === session.user.email.toLowerCase()) || targetClient.userId === userId;
    const isAdmin = (session?.user as any)?.isAdmin === true;

    if (!isCoach && !isAthlete && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot log workouts for this client" }, { status: 403 });
    }

    const cleanNotes = sanitizeText(notes, 1000);
    let created: any;
    let parentProgramId: string | null = null;

    if (body.plannedWorkoutId) {
      const existingPlanned = await prisma.workoutSession.findUnique({
        where: { id: body.plannedWorkoutId },
      });
      if (existingPlanned) {
        parentProgramId = existingPlanned.programId || null;
        await prisma.workoutExercise.deleteMany({ where: { workoutSessionId: existingPlanned.id } });
        created = await prisma.workoutSession.update({
          where: { id: existingPlanned.id },
          data: {
            status: status || "COMPLETED",
            startedAt: startedAt ? new Date(startedAt) : existingPlanned.startedAt,
            completedAt: completedAt ? new Date(completedAt) : new Date(),
            notes: cleanNotes || existingPlanned.notes,
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
          include: { exercises: { include: { sets: true } } },
        });
      }
    }

    if (!created) {
      created = await prisma.workoutSession.create({
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
    }

    // Synchronize parent TrainingProgram status if workout belongs to a program
    if (parentProgramId && (status === "COMPLETED" || !status)) {
      try {
        const remainingUnfinished = await prisma.workoutSession.count({
          where: {
            programId: parentProgramId,
            deletedAt: null,
            status: { in: ["PLANNED", "IN_PROGRESS"] },
            id: { not: created.id },
          },
        });
        if (remainingUnfinished === 0) {
          await prisma.trainingProgram.update({
            where: { id: parentProgramId },
            data: { status: "COMPLETED" },
          });
        } else {
          await prisma.trainingProgram.update({
            where: { id: parentProgramId },
            data: { status: "IN_PROGRESS" },
          });
        }
      } catch (syncErr) {
        console.warn("Program status sync warning:", syncErr);
      }
    }

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

export async function DELETE(req: NextRequest) {
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

    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    const programId = url.searchParams.get("programId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const targetClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, userId: true, email: true, name: true },
    });

    if (!targetClient) {
      return NextResponse.json({ error: "Target client not found" }, { status: 404 });
    }

    const isCoach = userId && targetClient.userId === userId;
    const isAthlete = userEmail && targetClient.email?.toLowerCase() === userEmail;
    const isAdmin = (session?.user as any)?.isAdmin === true;

    if (!isCoach && !isAthlete && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot modify workouts for this client" }, { status: 403 });
    }

    // Delete all PLANNED / IN_PROGRESS workout sessions for this client (and optional programId)
    const deleteWhere: any = {
      clientId,
      status: { in: ["PLANNED", "IN_PROGRESS"] },
    };

    if (programId) {
      deleteWhere.programId = programId;
    }

    const deleted = await prisma.workoutSession.deleteMany({
      where: deleteWhere,
    });

    // If programId was provided, reset program status to DRAFT and clear client assignment
    if (programId) {
      await prisma.trainingProgram.updateMany({
        where: { id: programId },
        data: { status: "DRAFT", clientId: null, startDate: null, endDate: null },
      });
    } else {
      // If clearing all assigned workouts for this client, reset any in-progress programs
      await prisma.trainingProgram.updateMany({
        where: { clientId, status: "IN_PROGRESS" },
        data: { status: "DRAFT", clientId: null, startDate: null, endDate: null },
      });
    }

    return NextResponse.json({
      success: true,
      count: deleted.count,
      message: `Successfully removed ${deleted.count} assigned workout${deleted.count === 1 ? "" : "s"}.`,
    });
  } catch (error: any) {
    console.error("Error deleting assigned workouts:", error);
    return NextResponse.json({ error: error.message || "Failed to remove assigned workouts" }, { status: 500 });
  }
}