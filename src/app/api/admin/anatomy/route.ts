export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAccess } from "@/lib/adminGuard";
import { INITIAL_UNIFIED_EXERCISES, normalizeExerciseName } from "@/lib/unifiedExerciseLibrary";

/**
 * Ensures the Exercise table exists in Postgres with all required columns and indexes
 */
async function ensureExerciseTableExists(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Exercise" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "normalizedName" TEXT UNIQUE NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'EXERCISE',
        "muscleGroup" TEXT NOT NULL DEFAULT 'Chest',
        "equipment" TEXT NOT NULL DEFAULT 'Bodyweight',
        "category" TEXT NOT NULL DEFAULT 'STRENGTH',
        "primaryMuscles" TEXT NOT NULL DEFAULT '[]',
        "secondaryMuscles" TEXT NOT NULL DEFAULT '[]',
        "biomechanicsCue" TEXT,
        "steps" TEXT,
        "commonMistakes" TEXT,
        "breathingPattern" TEXT,
        "diagramUrl" TEXT,
        "diagramStatus" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
        "diagramNotes" TEXT,
        "approvedByUserId" TEXT,
        "approvedAt" TIMESTAMP(3),
        "createdByUserId" TEXT,
        "createdByUserRole" TEXT DEFAULT 'SYSTEM',
        "isCustom" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Exercise_muscleGroup_idx" ON "Exercise"("muscleGroup");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Exercise_type_idx" ON "Exercise"("type");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Exercise_diagramStatus_idx" ON "Exercise"("diagramStatus");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Exercise_normalizedName_idx" ON "Exercise"("normalizedName");`);
  } catch (err) {
    console.warn("Exercise table DDL check note:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 1. Ensure table exists in database
    await ensureExerciseTableExists();

    // 2. Intelligent Auto-seed and Sync unified library (syncs missing items and updates updated diagrams)
    const shouldForceSync = req.nextUrl.searchParams.get("resync") === "true";
    try {
      const existingCount = await prisma.exercise.count();
      if (existingCount < INITIAL_UNIFIED_EXERCISES.length || shouldForceSync) {
        for (const item of INITIAL_UNIFIED_EXERCISES) {
          const generatedId = `ex-${normalizeExerciseName(item.name)}`;
          const existing = await prisma.exercise.findUnique({
            where: { normalizedName: item.normalizedName },
          });

          if (!existing) {
            // New movement: insert fresh
            await prisma.exercise.create({
              data: {
                id: generatedId,
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
          } else if (item.normalizedName === "chest_dip" || shouldForceSync) {
            // Specifically update Chest Dip back to pending with new accurate SVG diagram
            const updatePayload: any = {
              diagramUrl: item.diagramUrl,
              biomechanicsCue: item.biomechanicsCue,
              primaryMuscles: JSON.stringify(item.primaryMuscles),
              secondaryMuscles: JSON.stringify(item.secondaryMuscles),
            };
            if (item.normalizedName === "chest_dip") {
              updatePayload.diagramStatus = "PENDING_APPROVAL";
              updatePayload.approvedByUserId = null;
              updatePayload.approvedAt = null;
            }
            await prisma.exercise.update({
              where: { normalizedName: item.normalizedName },
              data: updatePayload,
            });
          }
        }
      }
    } catch (seedErr) {
      console.error("Library sync/seed note:", seedErr);
    }

    let exercises: any[] = [];
    try {
      exercises = await prisma.exercise.findMany({
        orderBy: [{ diagramStatus: "desc" }, { type: "asc" }, { name: "asc" }],
      });
    } catch {
      // Fallback in-memory list
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

    // Ensure database table exists
    await ensureExerciseTableExists();

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

    const norm = normalizeExerciseName(name || "");
    let updated: any = null;

    if (id && !id.startsWith("mock-")) {
      try {
        updated = await prisma.exercise.update({
          where: { id },
          data: updateData,
        });
      } catch (updateErr) {
        if (name) {
          const generatedId = `ex-${norm}`;
          updated = await prisma.exercise.upsert({
            where: { normalizedName: norm },
            update: updateData,
            create: {
              id: generatedId,
              name,
              normalizedName: norm,
              ...updateData,
            },
          });
        } else {
          throw updateErr;
        }
      }
    } else if (name) {
      const generatedId = `ex-${norm}`;
      updated = await prisma.exercise.upsert({
        where: { normalizedName: norm },
        update: updateData,
        create: {
          id: generatedId,
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
    console.error("Anatomy PATCH error:", error);
    return NextResponse.json({ error: error.message || "Failed to update anatomy status" }, { status: 500 });
  }
}
