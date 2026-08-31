export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAccess } from "@/lib/adminGuard";
import { INITIAL_UNIFIED_EXERCISES, normalizeExerciseName } from "@/lib/unifiedExerciseLibrary";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Auto-seed initial unified library if empty or missing items
    try {
      const existingCount = await prisma.exercise.count();
      if (existingCount === 0) {
        for (const item of INITIAL_UNIFIED_EXERCISES) {
          await prisma.exercise.upsert({
            where: { normalizedName: item.normalizedName },
            update: {},
            create: {
              name: item.name,
              normalizedName: item.normalizedName,
              type: item.type,
              muscleGroup: item.muscleGroup,
              equipment: item.equipment,
              category: item.category,
              primaryMuscles: JSON.stringify(item.primaryMuscles),
              secondaryMuscles: JSON.stringify(item.secondaryMuscles),
              biomechanicsCue: item.biomechanicsCue,
              steps: JSON.stringify(item.steps),
              commonMistakes: JSON.stringify(item.commonMistakes),
              breathingPattern: item.breathingPattern,
              diagramUrl: item.diagramUrl,
              diagramStatus: item.diagramStatus,
              isCustom: false,
              createdByUserRole: "SYSTEM",
            },
          });
        }
      }
    } catch (seedErr) {
      console.error("Auto-seed error (table may need DDL migration):", seedErr);
    }

    let exercises: any[] = [];
    try {
      exercises = await prisma.exercise.findMany({
        orderBy: [{ diagramStatus: "desc" }, { type: "asc" }, { name: "asc" }],
      });
    } catch {
      // Fallback to in-memory initial list if table not yet migrated
      exercises = INITIAL_UNIFIED_EXERCISES.map((item, idx) => ({
        id: `mock-${idx}`,
        ...item,
        primaryMuscles: JSON.stringify(item.primaryMuscles),
        secondaryMuscles: JSON.stringify(item.secondaryMuscles),
        steps: JSON.stringify(item.steps),
        commonMistakes: JSON.stringify(item.commonMistakes),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    const formatted = exercises.map((ex) => {
      let parsedPrimary: string[] = [];
      let parsedSecondary: string[] = [];
      let parsedSteps: string[] = [];
      let parsedMistakes: string[] = [];

      try {
        parsedPrimary = typeof ex.primaryMuscles === "string" ? JSON.parse(ex.primaryMuscles) : ex.primaryMuscles || [];
      } catch {
        parsedPrimary = ex.primaryMuscles ? [ex.primaryMuscles] : [];
      }

      try {
        parsedSecondary = typeof ex.secondaryMuscles === "string" ? JSON.parse(ex.secondaryMuscles) : ex.secondaryMuscles || [];
      } catch {
        parsedSecondary = ex.secondaryMuscles ? [ex.secondaryMuscles] : [];
      }

      try {
        parsedSteps = typeof ex.steps === "string" ? JSON.parse(ex.steps) : ex.steps || [];
      } catch {
        parsedSteps = ex.steps ? [ex.steps] : [];
      }

      try {
        parsedMistakes = typeof ex.commonMistakes === "string" ? JSON.parse(ex.commonMistakes) : ex.commonMistakes || [];
      } catch {
        parsedMistakes = ex.commonMistakes ? [ex.commonMistakes] : [];
      }

      return {
        ...ex,
        primaryMuscles: parsedPrimary,
        secondaryMuscles: parsedSecondary,
        steps: parsedSteps,
        commonMistakes: parsedMistakes,
      };
    });

    const totalCount = formatted.length;
    const approvedCount = formatted.filter((e) => e.diagramStatus === "APPROVED").length;
    const pendingCount = formatted.filter((e) => e.diagramStatus === "PENDING_APPROVAL" || !e.diagramStatus).length;
    const rejectedCount = formatted.filter((e) => e.diagramStatus === "REJECTED" || e.diagramStatus === "NEEDS_REVISION").length;

    return NextResponse.json({
      success: true,
      summary: {
        totalCount,
        approvedCount,
        pendingCount,
        rejectedCount,
        approvalPercentage: totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0,
      },
      exercises: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch anatomy library" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      id,
      name,
      diagramStatus,
      diagramNotes,
      diagramUrl,
      primaryMuscles,
      secondaryMuscles,
      biomechanicsCue,
      steps,
      commonMistakes,
      breathingPattern,
    } = body;

    if (!id && !name) {
      return NextResponse.json({ error: "Exercise id or name is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (diagramStatus) {
      updateData.diagramStatus = diagramStatus;
      if (diagramStatus === "APPROVED") {
        updateData.approvedByUserId = auth.userId || "admin";
        updateData.approvedAt = new Date();
      }
    }
    if (diagramNotes !== undefined) updateData.diagramNotes = diagramNotes;
    if (diagramUrl !== undefined) updateData.diagramUrl = diagramUrl;
    if (biomechanicsCue !== undefined) updateData.biomechanicsCue = biomechanicsCue;
    if (breathingPattern !== undefined) updateData.breathingPattern = breathingPattern;
    if (primaryMuscles !== undefined) updateData.primaryMuscles = JSON.stringify(primaryMuscles);
    if (secondaryMuscles !== undefined) updateData.secondaryMuscles = JSON.stringify(secondaryMuscles);
    if (steps !== undefined) updateData.steps = JSON.stringify(steps);
    if (commonMistakes !== undefined) updateData.commonMistakes = JSON.stringify(commonMistakes);

    let updated: any;
    if (id && !id.startsWith("mock-")) {
      updated = await prisma.exercise.update({
        where: { id },
        data: updateData,
      });
    } else if (name) {
      const norm = normalizeExerciseName(name);
      updated = await prisma.exercise.upsert({
        where: { normalizedName: norm },
        update: updateData,
        create: {
          name,
          normalizedName: norm,
          ...updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Anatomy diagram and kinesiological metadata updated successfully",
      exercise: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update anatomy status" }, { status: 500 });
  }
}
