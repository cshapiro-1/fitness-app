export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results: string[] = [];

    // 1. Client columns
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "phone" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "fitnessGoals" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "image" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT true;`);
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
    results.push("Synchronized User columns");

    // 3. Workout & Wellness columns
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "sessionType" TEXT DEFAULT 'WORKOUT';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutExercise" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'STRENGTH';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "distance" DOUBLE PRECISION;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;`);
    results.push("Synchronized Workout & Wellness columns");

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
