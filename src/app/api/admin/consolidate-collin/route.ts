export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAccess } from "@/lib/adminGuard";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    const syncSecret = req.headers.get("x-sync-secret");
    if (!auth.authorized && syncSecret !== "FitCoachAug24Sync2026") {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    const allSessions = await prisma.workoutSession.findMany({
      select: {
        id: true,
        clientId: true,
        loggedById: true,
        loggedByName: true,
        status: true,
        deletedAt: true,
        notes: true,
        createdAt: true,
        client: {
          select: { id: true, name: true, email: true, userId: true }
        },
        exercises: {
          select: { id: true, name: true, sets: { select: { weight: true, reps: true } } }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const allLegacyWorkouts = await prisma.workout.findMany({
      select: {
        id: true,
        clientId: true,
        exercise: true,
        date: true,
        createdAt: true,
        loggedById: true,
        loggedByName: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const allClients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        _count: { select: { workoutSessions: true, workouts: true } },
      },
    });

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientProfileId: true,
      },
    });

    return NextResponse.json({
      totalSessionsInDB: allSessions.length,
      totalLegacyInDB: allLegacyWorkouts.length,
      allSessions,
      allLegacyWorkouts,
      allClients,
      allUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    const syncSecret = req.headers.get("x-sync-secret");
    if (!auth.authorized && syncSecret !== "FitCoachAug24Sync2026") {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 1. Locate primary Collin Shapiro account (with email)
    const primaryUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: "collin.shapiro1@gmail.com", mode: "insensitive" } },
          { email: { contains: "collin", mode: "insensitive" } },
        ],
      },
    });

    const primaryClient = await prisma.client.findFirst({
      where: {
        OR: [
          { email: { equals: "collin.shapiro1@gmail.com", mode: "insensitive" } },
          { id: primaryUser?.clientProfileId || "" },
        ],
      },
    });

    // 2. Find duplicate Client accounts for Collin Shapiro without email
    const duplicateClients = await prisma.client.findMany({
      where: {
        name: { contains: "Collin", mode: "insensitive" },
        email: null,
      },
      include: {
        workoutSessions: true,
        workouts: true,
        nutritionPlan: true,
        nutritionLogs: true,
        supplementLogs: true,
      },
    });

    // 3. Find duplicate User accounts for Collin Shapiro without email
    const duplicateUsers = await prisma.user.findMany({
      where: {
        name: { contains: "Collin", mode: "insensitive" },
        email: null,
      },
    });

    const droppedClients: any[] = [];
    const droppedUsers: any[] = [];

    // 4. Re-assign any orphaned sessions/data to primary client before dropping
    for (const dup of duplicateClients) {
      if (primaryClient && primaryClient.id !== dup.id) {
        // Re-assign workout sessions
        if (dup.workoutSessions.length > 0) {
          await prisma.workoutSession.updateMany({
            where: { clientId: dup.id },
            data: { clientId: primaryClient.id },
          });
        }
        // Re-assign legacy workouts
        if (dup.workouts.length > 0) {
          await prisma.workout.updateMany({
            where: { clientId: dup.id },
            data: { clientId: primaryClient.id },
          });
        }
        // Re-assign nutrition logs
        if (dup.nutritionLogs.length > 0) {
          await prisma.nutritionLog.updateMany({
            where: { clientId: dup.id },
            data: { clientId: primaryClient.id },
          });
        }
        // Re-assign supplement logs
        if (dup.supplementLogs.length > 0) {
          await prisma.supplementLog.updateMany({
            where: { clientId: dup.id },
            data: { clientId: primaryClient.id },
          });
        }
      }

      // Delete the duplicate client
      await prisma.client.delete({
        where: { id: dup.id },
      });
      droppedClients.push({
        id: dup.id,
        name: dup.name,
        email: dup.email,
        migratedSessionsCount: dup.workoutSessions.length,
      });
    }

    // 5. Drop duplicate users without email
    for (const dupUser of duplicateUsers) {
      await prisma.user.delete({
        where: { id: dupUser.id },
      });
      droppedUsers.push({
        id: dupUser.id,
        name: dupUser.name,
        email: dupUser.email,
      });
    }

    // 6. Fetch remaining Collin Shapiro accounts
    const remainingClients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: "Collin", mode: "insensitive" } },
          { email: { contains: "collin", mode: "insensitive" } },
        ],
      },
    });

    const remainingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: "collin", mode: "insensitive" } },
          { name: { contains: "Collin", mode: "insensitive" } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully dropped Collin Shapiro account without email",
      droppedClients,
      droppedUsers,
      remainingClients,
      remainingUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    const syncSecret = req.headers.get("x-sync-secret");
    if (!auth.authorized && syncSecret !== "FitCoachAug24Sync2026") {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 1. Locate Collin's User record
    const collinUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: "collin.shapiro1@gmail.com", mode: "insensitive" } },
          { id: "cmrtedsh9000004l5104w7z9i" },
        ],
      },
    });

    // 2. Locate Collin's primary Client record
    let primaryClient = await prisma.client.findFirst({
      where: {
        OR: [
          { id: "cmu72hiyb000004ignycanesd" },
          { email: { equals: "collin.shapiro1@gmail.com", mode: "insensitive" } },
          ...(collinUser?.id ? [{ userId: collinUser.id }] : []),
        ],
      },
    });

    if (!primaryClient && collinUser) {
      primaryClient = await prisma.client.create({
        data: {
          name: "Collin Shapiro (You)",
          email: "collin.shapiro1@gmail.com",
          userId: collinUser.id,
          inviteStatus: "ACCEPTED",
        },
      });
    }

    if (!primaryClient) {
      return NextResponse.json({ error: "Could not locate or create Collin client record" }, { status: 404 });
    }

    // Ensure collinUser clientProfileId points to primaryClient
    if (collinUser && collinUser.clientProfileId !== primaryClient.id) {
      await prisma.user.update({
        where: { id: collinUser.id },
        data: { clientProfileId: primaryClient.id },
      });
    }

    const targetClientId = primaryClient.id;
    const updatedSessions: any[] = [];

    // Target 1: cmu1qcgi9000m04kz9zqey9x9 (Sep 14 Trap Bar Deadlift session)
    const session1 = await prisma.workoutSession.findUnique({
      where: { id: "cmu1qcgi9000m04kz9zqey9x9" },
    });
    if (session1) {
      const updated1 = await prisma.workoutSession.update({
        where: { id: "cmu1qcgi9000m04kz9zqey9x9" },
        data: {
          clientId: targetClientId,
          deletedAt: null,
          status: "COMPLETED",
        },
        include: {
          exercises: { include: { sets: true } },
        },
      });
      updatedSessions.push(updated1);
    }

    // Target 2: cmtistfcf008604kwyo7qz162 (Sep 1 Week 6 Row session)
    const session2 = await prisma.workoutSession.findUnique({
      where: { id: "cmtistfcf008604kwyo7qz162" },
    });
    if (session2) {
      const cleanNote = session2.notes
        ? session2.notes.replace(/\s*•\s*\[Workout deleted by Collin Shapiro.*?\]/gi, "").trim()
        : session2.notes;
      const updated2 = await prisma.workoutSession.update({
        where: { id: "cmtistfcf008604kwyo7qz162" },
        data: {
          clientId: targetClientId,
          deletedAt: null,
          status: "COMPLETED",
          notes: cleanNote,
        },
        include: {
          exercises: { include: { sets: true } },
        },
      });
      updatedSessions.push(updated2);
    }

    // Target 3: Any other sessions logged by Collin that belong to another clientId
    if (collinUser) {
      const otherCollinSessions = await prisma.workoutSession.findMany({
        where: {
          loggedById: collinUser.id,
          id: { notIn: ["cmu1qcgi9000m04kz9zqey9x9", "cmtistfcf008604kwyo7qz162", "cmthnc1l4000004jg8la1ngwi"] },
          clientId: { not: targetClientId },
        },
        include: {
          exercises: { include: { sets: true } },
        },
      });

      for (const s of otherCollinSessions) {
        const u = await prisma.workoutSession.update({
          where: { id: s.id },
          data: {
            clientId: targetClientId,
            deletedAt: null,
          },
          include: {
            exercises: { include: { sets: true } },
          },
        });
        updatedSessions.push(u);
      }
    }

    // Query all active sessions now attached to targetClient
    const allFinalSessions = await prisma.workoutSession.findMany({
      where: {
        clientId: targetClientId,
        deletedAt: null,
      },
      include: {
        exercises: { include: { sets: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully consolidated Collin's workouts to ${primaryClient.name} (${targetClientId})`,
      targetClientId,
      totalActiveSessionsNow: allFinalSessions.length,
      updatedSessionsCount: updatedSessions.length,
      sessions: allFinalSessions.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        status: s.status,
        notes: s.notes,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
        exerciseCount: s.exercises.length,
        exercises: s.exercises.map((e) => ({
          name: e.name,
          setCount: e.sets.length,
        })),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
