export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { answerFitnessQuery } from "@/lib/aiChatAssistant";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.AI);
    if (rateCheck.limited && rateCheck.response) {
      return rateCheck.response;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { query, clientId } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Query prompt is required." }, { status: 400 });
    }

    const user = session.user as { id: string; email?: string; role?: string; isAdmin?: boolean; clientProfileId?: string; name?: string };
    const userRole = (user.role || "TRAINER").toUpperCase() as "TRAINER" | "CLIENT" | "ADMIN";
    const isAdmin = !!user.isAdmin || userRole === "ADMIN";

    let targetClient: any = null;
    let targetWorkouts: any[] = [];
    let targetName = user.name || "You";

    // 1. CLIENT ACCESS CONTROL: Clients can ONLY query their own history
    if (userRole === "CLIENT" && !isAdmin) {
      // Find client profile for this logged-in user
      const ownClient = await prisma.client.findFirst({
        where: {
          OR: [
            { id: user.clientProfileId || undefined },
            { email: user.email || undefined },
            { userId: user.id },
          ],
        },
      });

      if (clientId && ownClient && clientId !== ownClient.id) {
        return NextResponse.json(
          { error: "Forbidden: Clients are only permitted to query their own workout history and logs." },
          { status: 403 }
        );
      }

      if (ownClient) {
        targetClient = ownClient;
        targetName = ownClient.name;
        targetWorkouts = await prisma.workoutSession.findMany({
          where: { clientId: ownClient.id, deletedAt: null },
          include: {
            exercises: {
              include: { sets: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { completedAt: "desc" },
        });
      }
    }
    // 2. TRAINER ACCESS CONTROL: Trainers can only query their own logs or their assigned clients
    else if (userRole === "TRAINER" && !isAdmin) {
      if (clientId && clientId !== "self") {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
        });

        if (!client) {
          return NextResponse.json({ error: "Athlete profile not found." }, { status: 404 });
        }

        // Verify trainer ownership
        if (client.userId !== user.id) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to query logs for this athlete." },
            { status: 403 }
          );
        }

        targetClient = client;
        targetName = client.name;
        targetWorkouts = await prisma.workoutSession.findMany({
          where: { clientId: client.id, deletedAt: null },
          include: {
            exercises: {
              include: { sets: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { completedAt: "desc" },
        });
      } else {
        // Querying trainer's own sessions / all managed client sessions
        const managedClients = await prisma.client.findMany({
          where: { userId: user.id },
          select: { id: true },
        });
        const clientIds = managedClients.map((c) => c.id);

        targetName = "your studio athletes";
        targetWorkouts = await prisma.workoutSession.findMany({
          where: {
            OR: [
              { clientId: { in: clientIds } },
              { loggedById: user.id },
            ],
            deletedAt: null,
          },
          include: {
            exercises: {
              include: { sets: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { completedAt: "desc" },
        });
      }
    }
    // 3. ADMIN ACCESS: Unrestricted
    else if (isAdmin) {
      if (clientId && clientId !== "self") {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
        });
        if (client) {
          targetClient = client;
          targetName = client.name;
          targetWorkouts = await prisma.workoutSession.findMany({
            where: { clientId: client.id, deletedAt: null },
            include: {
              exercises: {
                include: { sets: true },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { completedAt: "desc" },
          });
        }
      }
    }

    // Format workout sessions for analytics parsing
    const formattedWorkouts = targetWorkouts.map((w) => ({
      id: w.id,
      completedAt: w.completedAt ? w.completedAt.toISOString() : new Date().toISOString(),
      notes: w.notes,
      exercises: (w.exercises || []).map((ex: any) => ({
        name: ex.name,
        category: ex.category || "STRENGTH",
        sets: (ex.sets || []).map((s: any) => ({
          weight: s.weight,
          reps: s.reps,
          notes: s.notes,
        })),
      })),
    }));

    // Process intelligence query
    const result = answerFitnessQuery(query, {
      requesterRole: userRole,
      requesterName: user.name || "User",
      targetName,
      workouts: formattedWorkouts,
    });

    return NextResponse.json({
      success: true,
      query: query.trim(),
      target: {
        id: targetClient?.id || "self",
        name: targetName,
      },
      answer: result.answer,
      referencedExercises: result.referencedExercises,
      metricsFound: result.metricsFound,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI Chat Query Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI query." }, { status: 500 });
  }
}
