export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    const isClient = session.user.role === "CLIENT";
    const trainerId = isClient ? undefined : session.user.id;

    const whereClause: any = {};

    if (isClient) {
      // Find client profile
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clientProfileId: true },
      });
      if (!user?.clientProfileId) {
        return NextResponse.json({ programs: [] });
      }
      whereClause.clientId = user.clientProfileId;
    } else {
      whereClause.trainerId = trainerId;
      if (clientId) {
        whereClause.clientId = clientId;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    const programs = await prisma.trainingProgram.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, image: true, email: true },
        },
        workoutTemplates: {
          include: {
            exercises: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        workoutSessions: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            programWeek: true,
            programDay: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute progress stats for each program
    const enrichedPrograms = programs.map((p) => {
      const totalPlanned = p.workoutSessions.length;
      const completedCount = p.workoutSessions.filter((s) => s.status === "COMPLETED").length;
      const completionPercentage = totalPlanned > 0 ? Math.round((completedCount / totalPlanned) * 100) : 0;

      return {
        ...p,
        stats: {
          totalWorkouts: totalPlanned,
          completedWorkouts: completedCount,
          remainingWorkouts: Math.max(0, totalPlanned - completedCount),
          completionPercentage,
        },
      };
    });

    return NextResponse.json({ success: true, programs: enrichedPrograms });
  } catch (error: any) {
    console.error("Error fetching training programs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch programs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.MUTATION);
    if (rateCheck.limited && rateCheck.response) return rateCheck.response;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      durationWeeks = 6,
      clientId,
      progressionType = "LINEAR_OVERLOAD",
      progressionRate = 2.5,
      deloadFrequency = 4,
      notes,
      workoutTemplates = [],
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Program name is required" }, { status: 400 });
    }

    const cleanName = sanitizeText(name, 120);
    const cleanDesc = description ? sanitizeText(description, 500) : null;
    const cleanNotes = notes ? sanitizeText(notes, 1000) : null;

    const program = await prisma.trainingProgram.create({
      data: {
        trainerId: session.user.id,
        clientId: clientId || null,
        name: cleanName,
        description: cleanDesc,
        durationWeeks: Math.max(1, Math.min(52, parseInt(durationWeeks, 10) || 6)),
        status: "DRAFT",
        progressionType,
        progressionRate: parseFloat(progressionRate) || 2.5,
        deloadFrequency: parseInt(deloadFrequency, 10) || 4,
        notes: cleanNotes,
        workoutTemplates: {
          create: workoutTemplates.map((wt: any, idx: number) => ({
            name: sanitizeText(wt.name || `Day ${idx + 1}`, 100),
            order: idx,
            cadence: wt.cadence || "WEEKLY",
            dayOfWeek: wt.dayOfWeek || null,
            exercises: {
              create: (wt.exercises || []).map((ex: any, exIdx: number) => ({
                name: sanitizeText(ex.name || "Exercise", 100),
                order: exIdx,
                category: ex.category || "STRENGTH",
                targetSets: parseInt(ex.targetSets, 10) || 3,
                targetReps: sanitizeText(String(ex.targetReps || "8-10"), 20),
                suggestedWeight: parseFloat(ex.suggestedWeight) || 0,
                rpe: ex.rpe ? parseFloat(ex.rpe) : null,
                supersetGroup: ex.supersetGroup ? sanitizeText(ex.supersetGroup, 10) : null,
                restSeconds: parseInt(ex.restSeconds, 10) || (ex.supersetGroup ? 45 : 90),
                coachingCue: ex.coachingCue ? sanitizeText(ex.coachingCue, 300) : null,
                progressionNotes: ex.progressionNotes ? sanitizeText(ex.progressionNotes, 300) : null,
              })),
            },
          })),
        },
      },
      include: {
        workoutTemplates: {
          include: {
            exercises: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, program }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating training program:", error);
    return NextResponse.json({ error: error.message || "Failed to create program" }, { status: 500 });
  }
}
