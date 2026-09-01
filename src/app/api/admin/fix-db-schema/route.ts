export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAccess } from "@/lib/adminGuard";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const results: string[] = [];

    // 1. Client columns
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "phone" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "fitnessGoals" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "image" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT true;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "lastSessionDurationSeconds" INTEGER DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "loginCount" INTEGER DEFAULT 1;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "totalSessionSeconds" INTEGER DEFAULT 0;`);
    results.push("Synchronized Client columns");

    // 2. User columns
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fitnessGoals" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notes" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trainerId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionProvider" TEXT DEFAULT 'stripe';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "originalTransactionId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT true;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasSeenTour" BOOLEAN DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSessionDurationSeconds" INTEGER DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginCount" INTEGER DEFAULT 1;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalSessionSeconds" INTEGER DEFAULT 0;`);
    results.push("Synchronized User columns");

    // 3. Workout & Wellness columns
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedById" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedByName" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedByRole" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "sessionType" TEXT DEFAULT 'WORKOUT';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "programId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "programWeek" INTEGER;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "programDay" INTEGER;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Workout" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Workout" ADD COLUMN IF NOT EXISTS "loggedById" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Workout" ADD COLUMN IF NOT EXISTS "loggedByName" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutExercise" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'STRENGTH';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutExercise" ADD COLUMN IF NOT EXISTS "supersetGroup" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutExercise" ADD COLUMN IF NOT EXISTS "restSeconds" INTEGER DEFAULT 60;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "distance" DOUBLE PRECISION;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;`);
    results.push("Synchronized Workout & Wellness columns (including deletedAt, attribution, and program/superset fields)");

    // 3b. Program Planner Tables
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TrainingProgram" (
        "id" TEXT PRIMARY KEY,
        "trainerId" TEXT NOT NULL,
        "clientId" TEXT,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "durationWeeks" INTEGER NOT NULL DEFAULT 6,
        "startDate" TEXT,
        "endDate" TEXT,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "progressionType" TEXT NOT NULL DEFAULT 'LINEAR_OVERLOAD',
        "progressionRate" DOUBLE PRECISION DEFAULT 2.5,
        "deloadFrequency" INTEGER DEFAULT 4,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TrainingProgram_trainerId_idx" ON "TrainingProgram"("trainerId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TrainingProgram_clientId_idx" ON "TrainingProgram"("clientId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TrainingProgram_status_idx" ON "TrainingProgram"("status");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProgramWorkoutTemplate" (
        "id" TEXT PRIMARY KEY,
        "programId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "cadence" TEXT NOT NULL DEFAULT 'WEEKLY',
        "dayOfWeek" INTEGER
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProgramWorkoutTemplate_programId_idx" ON "ProgramWorkoutTemplate"("programId");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProgramExerciseTemplate" (
        "id" TEXT PRIMARY KEY,
        "programWorkoutTemplateId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "category" TEXT DEFAULT 'STRENGTH',
        "targetSets" INTEGER NOT NULL DEFAULT 3,
        "targetReps" TEXT NOT NULL DEFAULT '8-10',
        "suggestedWeight" DOUBLE PRECISION DEFAULT 0,
        "rpe" DOUBLE PRECISION,
        "supersetGroup" TEXT,
        "restSeconds" INTEGER DEFAULT 90,
        "coachingCue" TEXT,
        "progressionNotes" TEXT
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProgramExerciseTemplate_programWorkoutTemplateId_idx" ON "ProgramExerciseTemplate"("programWorkoutTemplateId");`);
    results.push("Ensured Program Planner tables exist (TrainingProgram, ProgramWorkoutTemplate, ProgramExerciseTemplate)");

    // 4. Create NutritionPlan table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NutritionPlan" (
        "id" TEXT PRIMARY KEY,
        "clientId" TEXT UNIQUE NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
        "goalType" TEXT NOT NULL DEFAULT 'CUT',
        "dailyCalories" INTEGER NOT NULL DEFAULT 2000,
        "proteinGrams" INTEGER NOT NULL DEFAULT 150,
        "carbsGrams" INTEGER NOT NULL DEFAULT 200,
        "fatsGrams" INTEGER NOT NULL DEFAULT 65,
        "waterOz" INTEGER DEFAULT 100,
        "currentWeight" DOUBLE PRECISION,
        "targetWeight" DOUBLE PRECISION,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    results.push("Ensured NutritionPlan table exists");

    // 5. Create NutritionLog table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NutritionLog" (
        "id" TEXT PRIMARY KEY,
        "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
        "date" TEXT NOT NULL,
        "mealName" TEXT NOT NULL,
        "foodName" TEXT NOT NULL,
        "calories" INTEGER NOT NULL,
        "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "fats" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "NutritionLog_clientId_idx" ON "NutritionLog"("clientId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "NutritionLog_date_idx" ON "NutritionLog"("date");`);
    results.push("Ensured NutritionLog table exists");

    // 6. Create SupplementLog table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SupplementLog" (
        "id" TEXT PRIMARY KEY,
        "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
        "date" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "dosage" TEXT,
        "timing" TEXT,
        "taken" BOOLEAN NOT NULL DEFAULT true,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SupplementLog_clientId_idx" ON "SupplementLog"("clientId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SupplementLog_date_idx" ON "SupplementLog"("date");`);
    results.push("Ensured SupplementLog table exists");

    // 7. Create Exercise table if not exists (Unified Exercises & Stretches with Anatomy Diagrams)
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
    results.push("Ensured Exercise (unified exercises & stretches) table exists");

    return NextResponse.json({
      success: true,
      message: "Database schema synchronized and reconciled successfully",
      results,
    });
  } catch (error: any) {
    console.error("Schema migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
