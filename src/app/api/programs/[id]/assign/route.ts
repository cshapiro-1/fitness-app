export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { materializeProgramSchedule } from "@/lib/periodizationEngine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.MUTATION);
    if (rateCheck.limited && rateCheck.response) return rateCheck.response;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { clientId, startDate, restDaysBetween } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Target clientId is required" }, { status: 400 });
    }

    const program = await prisma.trainingProgram.findUnique({
      where: { id },
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

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    if (program.trainerId !== session.user.id && !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (program.workoutTemplates.length === 0) {
      return NextResponse.json({ error: "Program must have at least one workout template before assignment" }, { status: 400 });
    }

    const resolvedStartDate = (startDate ? String(startDate).split("T")[0] : null) || new Date().toISOString().split("T")[0];
    const effectiveRestDays = restDaysBetween !== undefined
      ? Math.max(0, parseInt(restDaysBetween, 10))
      : (program.restDaysBetween ?? 1);

    // Calculate end date based on durationWeeks
    const startObj = new Date(resolvedStartDate + "T00:00:00");
    const endObj = new Date(startObj);
    endObj.setDate(startObj.getDate() + program.durationWeeks * 7 - 1);
    const resolvedEndDate = endObj.toISOString().split("T")[0];

    // Materialize all scheduled workouts across the periodization timeline
    const schedule = materializeProgramSchedule(
      program.workoutTemplates.map((wt) => ({
        name: wt.name,
        order: wt.order,
        cadence: wt.cadence,
        dayOfWeek: wt.dayOfWeek,
        restDaysAfter: wt.restDaysAfter,
        exercises: wt.exercises.map((ex) => ({
          name: ex.name,
          order: ex.order,
          category: ex.category || "STRENGTH",
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          suggestedWeight: ex.suggestedWeight || 0,
          rpe: ex.rpe || undefined,
          supersetGroup: ex.supersetGroup,
          restSeconds: ex.restSeconds || undefined,
          coachingCue: ex.coachingCue || undefined,
          progressionNotes: ex.progressionNotes || undefined,
        })),
      })),
      {
        durationWeeks: program.durationWeeks,
        startDate: resolvedStartDate,
        progressionType: (program.progressionType as any) || "LINEAR_OVERLOAD",
        progressionRate: program.progressionRate ?? 2.5,
        deloadFrequency: program.deloadFrequency ?? 4,
        restDaysBetween: effectiveRestDays,
      }
    );

    // If client had prior uncompleted planned workouts from this program, clean them up
    await prisma.workoutSession.deleteMany({
      where: {
        programId: id,
        status: "PLANNED",
      },
    });

    // Create all planned workout sessions in database
    for (const pw of schedule) {
      await prisma.workoutSession.create({
        data: {
          clientId,
          programId: id,
          programWeek: pw.weekNumber,
          programDay: pw.dayNumber,
          status: "PLANNED",
          sessionType: "WORKOUT",
          notes: `${pw.name} • ${pw.notes}`,
          loggedByRole: "TRAINER",
          loggedById: session.user.id,
          loggedByName: session.user.name || "Coach",
          startedAt: new Date(pw.scheduledDate + "T09:00:00Z"),
          exercises: {
            create: pw.exercises.map((ex) => ({
              name: ex.name,
              order: ex.order,
              category: ex.category || "STRENGTH",
              supersetGroup: ex.supersetGroup || null,
              restSeconds: ex.restSeconds || 90,
              sets: {
                create: Array.from({ length: ex.targetSets }).map((_, sIdx) => ({
                  order: sIdx + 1,
                  weight: ex.suggestedWeight || 0,
                  reps: parseInt(ex.targetReps.split("-")[0], 10) || 8,
                  notes: `${ex.targetReps} reps • RPE ${ex.rpe || 8}${ex.supersetGroup ? ` • Superset ${ex.supersetGroup}` : ""}${ex.restSeconds ? ` • Rest ${ex.restSeconds}s` : ""}`,
                })),
              },
            })),
          },
        },
      });
    }

    // Update program status to IN_PROGRESS
    const updatedProgram = await prisma.trainingProgram.update({
      where: { id },
      data: {
        clientId,
        status: "IN_PROGRESS",
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        restDaysBetween: effectiveRestDays,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        workoutSessions: {
          where: { status: "PLANNED" },
          select: { id: true, startedAt: true, notes: true, programWeek: true, programDay: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned "${program.name}" to ${client.name}! ${schedule.length} periodized workouts scheduled.`,
      scheduledCount: schedule.length,
      program: updatedProgram,
    });
  } catch (error: any) {
    console.error("Error assigning training program:", error);
    return NextResponse.json({ error: error.message || "Failed to assign program" }, { status: 500 });
  }
}
