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

    const userName = (session?.user?.name || dbUser?.name)?.trim();
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

      const nameMatchedClients = await prisma.client.findMany({
        where: {
          OR: searchTerms.map((term) => ({
            name: { contains: term, mode: "insensitive" as const },
          })),
          AND: [
            {
              OR: [
                { email: null },
                ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" as const } }] : []),
              ],
            },
          ],
        },
        select: { id: true },
      });
      nameMatchedClients.forEach((c) => {
        if (!clientIds.includes(c.id)) clientIds.push(c.id);
      });
    }

    if (userId) {
      const selfClients = await prisma.client.findMany({
        where: {
          userId,
          OR: [
            { name: { in: ["My Workouts", "Personal", "Self", "My Workouts (Personal)", "Solo Athlete"] } },
            { name: { contains: "(You)" } },
            { name: { contains: "Collin", mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      selfClients.forEach((c) => {
        if (!clientIds.includes(c.id)) clientIds.push(c.id);
      });
    }

    // Auto-link clientProfileId on User if not set and primary self client exists
    if (dbUser && !dbUser.clientProfileId && clientIds.length > 0) {
      try {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { clientProfileId: clientIds[0] },
        });
      } catch {}
    }

    // Prioritize Collin's primary clientProfileId if user is Collin
    if (userEmail === "collin.shapiro1@gmail.com" || userId === "cmrtedsh9000004l5104w7z9i") {
      if (!clientIds.includes("cmu72hiyb000004ignycanesd")) {
        clientIds.unshift("cmu72hiyb000004ignycanesd");
      }
    }

    // Self-healing: If an athlete user has active workouts logged by them assigned elsewhere, re-assign them
    if (userId && clientIds.length > 0 && dbUser?.role === "CLIENT") {
      try {
        await prisma.workoutSession.updateMany({
          where: {
            loggedById: userId,
            clientId: { notIn: clientIds },
            id: { not: "cmthnc1l4000004jg8la1ngwi" },
          },
          data: {
            clientId: clientIds[0],
            deletedAt: null,
          },
        });
      } catch {}
    }

    if (clientIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch real WorkoutSessions strictly for all matched client IDs
    const sessions = await prisma.workoutSession.findMany({
      where: {
        deletedAt: null,
        OR: [
          { clientId: { in: clientIds } },
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
