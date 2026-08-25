export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSMSWorkoutText, ParsedWorkoutSession } from "@/lib/smsWorkoutParser";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { rawText, clientId, mode = "commit", sessions: preParsedSessions } = body;

    const user = session.user as { id: string; email?: string; role?: string; isAdmin?: boolean; clientProfileId?: string; name?: string };
    const userRole = (user.role || "TRAINER").toUpperCase();
    const isAdmin = !!user.isAdmin || userRole === "ADMIN";

    // Resolve target client ID
    let targetClientId = clientId;

    if (!targetClientId || targetClientId === "self") {
      if (userRole === "CLIENT") {
        const client = await prisma.client.findFirst({
          where: {
            OR: [
              { id: user.clientProfileId || undefined },
              { email: user.email || undefined },
              { userId: user.id },
            ],
          },
        });
        targetClientId = client?.id;
      } else {
        // Trainer self client
        const selfClient = await prisma.client.findFirst({
          where: {
            userId: user.id,
            name: { in: ["My Workouts", "Personal", "Self", "My Workouts (Personal)"] },
          },
        });
        if (selfClient) {
          targetClientId = selfClient.id;
        } else {
          // Create default personal client
          const newSelf = await prisma.client.create({
            data: {
              userId: user.id,
              name: "My Workouts (Personal)",
              fitnessGoals: "Personal Training Log",
            },
          });
          targetClientId = newSelf.id;
        }
      }
    } else {
      // Trainer target verification
      if (userRole === "TRAINER" && !isAdmin) {
        const client = await prisma.client.findUnique({
          where: { id: targetClientId },
        });
        if (!client || client.userId !== user.id) {
          return NextResponse.json({ error: "Forbidden: You do not have permission to manage this athlete." }, { status: 403 });
        }
      } else if (userRole === "CLIENT" && !isAdmin) {
        const ownClient = await prisma.client.findFirst({
          where: {
            OR: [
              { id: user.clientProfileId || undefined },
              { email: user.email || undefined },
              { userId: user.id },
            ],
          },
        });
        if (!ownClient || ownClient.id !== targetClientId) {
          return NextResponse.json({ error: "Forbidden: Clients can only backfill their own workout history." }, { status: 403 });
        }
      }
    }

    if (!targetClientId) {
      return NextResponse.json({ error: "Target athlete client profile not found." }, { status: 404 });
    }

    // Parse sessions from raw text or use pre-parsed list
    let workoutSessions: ParsedWorkoutSession[] = [];

    if (preParsedSessions && Array.isArray(preParsedSessions)) {
      workoutSessions = preParsedSessions;
    } else if (rawText && typeof rawText === "string") {
      workoutSessions = parseSMSWorkoutText(rawText);
    }

    if (workoutSessions.length === 0) {
      return NextResponse.json({ error: "No valid workout sessions or exercises could be parsed from the provided text." }, { status: 400 });
    }

    // MODE 1: Preview / Dry-run parse only
    if (mode === "parse") {
      return NextResponse.json({
        success: true,
        previewCount: workoutSessions.length,
        sessions: workoutSessions,
      });
    }

    // MODE 2: Commit & Backfill to Database
    const createdSessions = [];

    // Cache trainer's clients for lookup & authorization
    const trainerClients = userRole === "TRAINER"
      ? await prisma.client.findMany({ where: { userId: user.id } })
      : [];
    const trainerClientMap = new Map(trainerClients.map((c) => [c.id, c]));
    const trainerClientNameMap = new Map(trainerClients.map((c) => [c.name.trim().toLowerCase(), c]));

    for (const s of workoutSessions) {
      let sessionClientId = s.clientId || targetClientId;

      // If a client name was detected or selected on the card
      if (!sessionClientId && s.clientName && userRole === "TRAINER") {
        const found = trainerClientNameMap.get(s.clientName.trim().toLowerCase());
        if (found) {
          sessionClientId = found.id;
        }
      }

      if (!sessionClientId) {
        sessionClientId = targetClientId;
      }

      // Check coach ownership of sessionClientId
      if (userRole === "TRAINER" && !isAdmin && !trainerClientMap.has(sessionClientId)) {
        // Skip or default to targetClientId
        sessionClientId = targetClientId;
      }

      const completedDate = new Date(`${s.date}T12:00:00.000Z`);

      const sessionRecord = await prisma.workoutSession.create({
        data: {
          clientId: sessionClientId,
          status: "COMPLETED",
          startedAt: completedDate,
          completedAt: completedDate,
          notes: s.notes ? `[SMS Backfill] ${s.notes}` : `[SMS Backfill] ${s.title || "Imported Workout"}`,
          loggedByRole: userRole === "CLIENT" ? "CLIENT" : "TRAINER",
          loggedById: user.id,
          loggedByName: user.name || (userRole === "CLIENT" ? "Athlete" : "Coach"),
          exercises: {
            create: s.exercises.map((ex, exIdx) => ({
              name: ex.name,
              order: exIdx,
              sets: {
                create: ex.sets.map((st, stIdx) => ({
                  order: stIdx,
                  weight: Number(st.weight) || 0,
                  reps: Number(st.reps) || 8,
                  notes: st.notes || undefined,
                })),
              },
            })),
          },
        },
        include: {
          exercises: {
            include: { sets: true },
          },
        },
      });

      createdSessions.push(sessionRecord);
    }

    const totalExercisesCreated = createdSessions.reduce((sum, s) => sum + s.exercises.length, 0);
    const totalSetsCreated = createdSessions.reduce(
      (sum, s) => sum + s.exercises.reduce((exSum, e) => exSum + e.sets.length, 0),
      0
    );

    return NextResponse.json({
      success: true,
      message: `Successfully backfilled ${createdSessions.length} workout sessions (${totalExercisesCreated} exercises, ${totalSetsCreated} sets)!`,
      importedCount: createdSessions.length,
      totalExercises: totalExercisesCreated,
      totalSets: totalSetsCreated,
      sessions: createdSessions,
    });
  } catch (error: any) {
    console.error("SMS Workout Backfill Error:", error);
    return NextResponse.json({ error: error.message || "Failed to backfill text workouts." }, { status: 500 });
  }
}
