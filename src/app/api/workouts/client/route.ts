export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    let userEmail = session?.user?.email?.toLowerCase().trim();

    if (!userId && userEmail) {
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: userEmail, mode: "insensitive" } },
      });
      userId = dbUser?.id;
    }
    if (!userId && !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = userEmail
      ? await prisma.user.findFirst({ where: { email: { equals: userEmail, mode: "insensitive" } } })
      : null;
    
    let clientIds: string[] = [];
    if (dbUser?.clientProfileId) {
      clientIds.push(dbUser.clientProfileId);
    }

    if (userEmail) {
      const matchedClients = await prisma.client.findMany({
        where: { email: { equals: userEmail, mode: "insensitive" } },
        select: { id: true },
      });
      matchedClients.forEach((c) => {
        if (!clientIds.includes(c.id)) clientIds.push(c.id);
      });
    }

    if (userId) {
      const selfClients = await prisma.client.findMany({
        where: { userId },
        select: { id: true },
      });
      selfClients.forEach((c) => {
        if (!clientIds.includes(c.id)) clientIds.push(c.id);
      });
    }

    // Fetch real WorkoutSessions for all matched client IDs or logged by user
    const sessions = await prisma.workoutSession.findMany({
      where: {
        deletedAt: null,
        OR: [
          ...(clientIds.length > 0 ? [{ clientId: { in: clientIds } }] : []),
          ...(userId ? [{ loggedById: userId }] : []),
        ],
      },
      include: {
        exercises: { orderBy: { order: "asc" }, include: { sets: { orderBy: { order: "asc" } } } },
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch legacy seeded Workouts and dynamically group them
    const legacyWorkouts = clientIds.length > 0
      ? await prisma.workout.findMany({
          where: { clientId: { in: clientIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const sessionMap = new Map();
    for (const w of legacyWorkouts) {
      const sessionKey = w.date || (w.createdAt ? new Date(w.createdAt).toISOString() : "unknown");
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          id: "session-" + w.id,
          clientId: w.clientId,
          status: "COMPLETED",
          createdAt: w.createdAt ? new Date(w.createdAt).toISOString() : w.date,
          completedAt: w.date || new Date().toISOString(),
          notes: w.notes || "",
          loggedByRole: w.loggedByRole || "TRAINER",
          loggedByName: w.loggedByName || null,
          exercises: [],
        });
      }
      const s = sessionMap.get(sessionKey);
      if (!s.notes && w.notes) s.notes = w.notes;
      s.loggedByRole = w.loggedByRole || s.loggedByRole || "TRAINER";
      s.loggedByName = w.loggedByName || s.loggedByName || null;
      s.exercises.push({
        id: "leg-ex-" + w.id,
        order: s.exercises.length,
        name: w.exercise,
        sets: Array.from({ length: w.sets || 1 }, (_, i) => ({
          id: "leg-set-" + w.id + "-" + i,
          order: i,
          weight: w.weight || 0,
          reps: w.reps || 0,
          notes: "",
        })),
      });
    }

    const legacyMapped = Array.from(sessionMap.values());
    const all = [...sessions, ...legacyMapped].sort(
      (a, b) =>
        new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
    );

    return NextResponse.json(all);
  } catch (error: any) {
    console.error("Client workouts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
