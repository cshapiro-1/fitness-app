export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const targetEmail = "collin.shapiro1@gmail.com";

    // 1. Find or create Collin's User record
    let user = await prisma.user.findFirst({
      where: { email: { equals: targetEmail, mode: "insensitive" } },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: { contains: "collin", mode: "insensitive" } },
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          name: "Collin Shapiro",
          role: "TRAINER",
          isAdmin: true,
          subscriptionStatus: "active",
        },
      });
    }

    // 2. Find all clients created by Collin or with Collin's email
    let clients = await prisma.client.findMany({
      where: {
        OR: [
          { userId: user.id },
          { email: { equals: targetEmail, mode: "insensitive" } },
          { email: { contains: "collin", mode: "insensitive" } },
          { name: { contains: "Collin", mode: "insensitive" } },
          { name: { in: ["My Workouts", "My Workouts (Personal)", "Personal", "Self"] } },
        ],
      },
    });

    // Ensure Collin's primary personal profile exists
    let primaryClient = clients.find(
      (c) => c.userId === user!.id && (c.name.includes("My Workouts") || c.name.includes("Collin"))
    );

    if (!primaryClient) {
      primaryClient = await prisma.client.create({
        data: {
          userId: user.id,
          name: "My Workouts (Personal)",
          email: targetEmail,
          inviteStatus: "ACCEPTED",
        },
      });
      clients.push(primaryClient);
    }

    const collinClientIds = clients.map((c) => c.id);

    // 3. Find ALL workouts and workoutSessions in the database
    const allSessions = await prisma.workoutSession.findMany({
      include: {
        exercises: { include: { sets: true } },
        client: true,
      },
    });

    const allLegacyWorkouts = await prisma.workout.findMany();

    // 4. Re-attribute and link all sessions that belong to Collin or are unassigned
    let relinkedSessionsCount = 0;
    for (const session of allSessions) {
      const isCollinClient = collinClientIds.includes(session.clientId);
      const isCollinUser = session.loggedById === user.id;

      if (!session.loggedById || isCollinClient || isCollinUser) {
        await prisma.workoutSession.update({
          where: { id: session.id },
          data: {
            loggedById: user.id,
            loggedByName: user.name || "Collin Shapiro",
            loggedByRole: "TRAINER",
            // If session was on an orphaned client, link to primary client
            clientId: isCollinClient ? session.clientId : primaryClient.id,
          },
        });
        relinkedSessionsCount++;
      }
    }

    // 5. Re-attribute legacy Workouts
    let relinkedLegacyCount = 0;
    for (const w of allLegacyWorkouts) {
      const isCollinClient = collinClientIds.includes(w.clientId);
      if (!isCollinClient) {
        await prisma.workout.update({
          where: { id: w.id },
          data: {
            clientId: primaryClient.id,
            loggedById: user.id,
            loggedByName: user.name || "Collin Shapiro",
          },
        });
        relinkedLegacyCount++;
      }
    }

    // 6. Fetch final consolidated list of workouts for Collin
    const finalSessions = await prisma.workoutSession.findMany({
      where: {
        OR: [
          { clientId: { in: collinClientIds } },
          { loggedById: user.id },
        ],
      },
      include: {
        exercises: { include: { sets: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      primaryClientId: primaryClient.id,
      allCollinClientIds: collinClientIds,
      totalSessionsInDB: allSessions.length,
      relinkedSessionsCount,
      relinkedLegacyCount,
      finalSessionsCount: finalSessions.length,
      workoutsSummary: finalSessions.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        status: s.status,
        date: s.completedAt || s.createdAt,
        exercises: s.exercises.map((e) => `${e.name} (${e.sets.length} sets)`),
      })),
    });
  } catch (error: any) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
