export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { materializeProgramSchedule } from "@/lib/periodizationEngine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const program = await prisma.trainingProgram.findUnique({
      where: { id },
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
          include: {
            exercises: {
              include: {
                sets: {
                  orderBy: { order: "asc" },
                },
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: [{ programWeek: "asc" }, { programDay: "asc" }],
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Security check: must be the trainer or the assigned client
    if (session.user.role === "CLIENT") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clientProfileId: true },
      });
      if (program.clientId !== user?.clientProfileId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (program.trainerId !== session.user.id && !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalWorkouts = program.workoutSessions.length;
    const completedWorkouts = program.workoutSessions.filter((s) => s.status === "COMPLETED").length;
    const completionPercentage = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

    return NextResponse.json({
      success: true,
      program: {
        ...program,
        stats: {
          totalWorkouts,
          completedWorkouts,
          remainingWorkouts: Math.max(0, totalWorkouts - completedWorkouts),
          completionPercentage,
        },
      },
    });
  } catch (error: any) {
    console.error("Error retrieving training program:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve program" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.MUTATION);
    if (rateCheck.limited && rateCheck.response) return rateCheck.response;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.trainingProgram.findUnique({
      where: { id },
      include: { workoutTemplates: { include: { exercises: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    if (existing.trainerId !== session.user.id && !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      name,
      description,
      durationWeeks,
      status,
      progressionType,
      progressionRate,
      deloadFrequency,
      restDaysBetween,
      notes,
      workoutTemplates,
    } = body;

    // Update basic program fields
    const updatedProgram = await prisma.trainingProgram.update({
      where: { id },
      data: {
        name: name ? sanitizeText(name, 120) : undefined,
        description: description !== undefined ? (description ? sanitizeText(description, 500) : null) : undefined,
        durationWeeks: durationWeeks ? Math.max(1, Math.min(104, parseInt(durationWeeks, 10))) : undefined,
        status: status || undefined,
        progressionType: progressionType || undefined,
        progressionRate: progressionRate !== undefined ? parseFloat(progressionRate) : undefined,
        deloadFrequency: deloadFrequency !== undefined ? parseInt(deloadFrequency, 10) : undefined,
        restDaysBetween: restDaysBetween !== undefined ? Math.max(0, parseInt(restDaysBetween, 10)) : undefined,
        notes: notes !== undefined ? (notes ? sanitizeText(notes, 1000) : null) : undefined,
      },
    });

    // If workoutTemplates are provided, update the template structure
    if (Array.isArray(workoutTemplates)) {
      // Remove old templates and recreate
      await prisma.programWorkoutTemplate.deleteMany({
        where: { programId: id },
      });

      for (let i = 0; i < workoutTemplates.length; i++) {
        const wt = workoutTemplates[i];
        await prisma.programWorkoutTemplate.create({
          data: {
            programId: id,
            name: sanitizeText(wt.name || `Day ${i + 1}`, 100),
            order: i,
            cadence: wt.cadence || "WEEKLY",
            dayOfWeek: wt.dayOfWeek || null,
            restDaysAfter: wt.restDaysAfter !== undefined ? parseInt(wt.restDaysAfter, 10) : 1,
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
          },
        });
      }

      // Live In-Progress Sync: If program is IN_PROGRESS and has an assigned client,
      // update all upcoming uncompleted PLANNED workouts to reflect the updated templates!
      if (existing.status === "IN_PROGRESS" && existing.clientId && existing.startDate) {
        // Delete remaining PLANNED sessions and rematerialize them from current week forward
        const completedSessions = await prisma.workoutSession.findMany({
          where: { programId: id, status: "COMPLETED" },
          select: { programWeek: true, programDay: true },
        });

        const latestCompletedWeek = completedSessions.reduce((max, s) => Math.max(max, s.programWeek || 1), 1);

        // Remove future planned sessions that haven't been started/completed
        await prisma.workoutSession.deleteMany({
          where: {
            programId: id,
            status: "PLANNED",
            programWeek: { gte: latestCompletedWeek },
          },
        });

        // Rematerialize remaining schedule
        const newSchedule = materializeProgramSchedule(
          workoutTemplates,
          {
            durationWeeks: updatedProgram.durationWeeks,
            startDate: existing.startDate,
            progressionType: (updatedProgram.progressionType as any) || "LINEAR_OVERLOAD",
            progressionRate: updatedProgram.progressionRate ?? 2.5,
            deloadFrequency: updatedProgram.deloadFrequency ?? 4,
            restDaysBetween: updatedProgram.restDaysBetween ?? 1,
          }
        );

        // Filter for sessions from latestCompletedWeek forward
        const remainingWorkoutsToInsert = newSchedule.filter(
          (pw) => pw.weekNumber >= latestCompletedWeek
        );

        for (const pw of remainingWorkoutsToInsert) {
          await prisma.workoutSession.create({
            data: {
              clientId: existing.clientId,
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
      }
    }

    const fullUpdated = await prisma.trainingProgram.findUnique({
      where: { id },
      include: {
        workoutTemplates: {
          include: { exercises: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, program: fullUpdated });
  } catch (error: any) {
    console.error("Error updating training program:", error);
    return NextResponse.json({ error: error.message || "Failed to update program" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const program = await prisma.trainingProgram.findUnique({
      where: { id },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    if (program.trainerId !== session.user.id && !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete associated uncompleted planned workouts, leave completed ones intact
    await prisma.workoutSession.deleteMany({
      where: { programId: id, status: "PLANNED" },
    });

    await prisma.trainingProgram.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error("Error deleting training program:", error);
    return NextResponse.json({ error: error.message || "Failed to delete program" }, { status: 500 });
  }
}
