import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

const getConnectionString = () => {
  const raw = process.env.DATABASE_URL;
  if (!raw || raw.includes("[SENSITIVE]") || (!raw.startsWith("postgres://") && !raw.startsWith("postgresql://"))) {
    return "postgresql://postgres:postgres@localhost:5432/fitness";
  }
  return raw;
};

if (!globalForPrisma.pgPool) {
  const pool = new Pool({ connectionString: getConnectionString() });
  globalForPrisma.pgPool = pool;

  // Auto-sync missing schema columns & tables on Postgres
  pool.query(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN DEFAULT false;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasSeenTour" BOOLEAN DEFAULT false;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT true;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionProvider" TEXT DEFAULT 'stripe';
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'trial';

    ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT true;

    ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "programId" TEXT;
    ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "programWeek" INTEGER;
    ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "programDay" INTEGER;
    ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
    ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedById" TEXT;
    ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedByName" TEXT;
    ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "loggedByRole" TEXT;
    ALTER TABLE "WorkoutSession" ADD COLUMN IF NOT EXISTS "sessionType" TEXT DEFAULT 'WORKOUT';

    ALTER TABLE "WorkoutExercise" ADD COLUMN IF NOT EXISTS "supersetGroup" TEXT;
    ALTER TABLE "WorkoutExercise" ADD COLUMN IF NOT EXISTS "restSeconds" INTEGER DEFAULT 60;
    ALTER TABLE "WorkoutExercise" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'STRENGTH';

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
      "restDaysBetween" INTEGER DEFAULT 1,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE "TrainingProgram" ADD COLUMN IF NOT EXISTS "restDaysBetween" INTEGER DEFAULT 1;
    CREATE INDEX IF NOT EXISTS "TrainingProgram_trainerId_idx" ON "TrainingProgram"("trainerId");
    CREATE INDEX IF NOT EXISTS "TrainingProgram_clientId_idx" ON "TrainingProgram"("clientId");
    CREATE INDEX IF NOT EXISTS "TrainingProgram_status_idx" ON "TrainingProgram"("status");

    CREATE TABLE IF NOT EXISTS "ProgramWorkoutTemplate" (
      "id" TEXT PRIMARY KEY,
      "programId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "cadence" TEXT NOT NULL DEFAULT 'WEEKLY',
      "dayOfWeek" INTEGER,
      "restDaysAfter" INTEGER DEFAULT 1
    );
    ALTER TABLE "ProgramWorkoutTemplate" ADD COLUMN IF NOT EXISTS "restDaysAfter" INTEGER DEFAULT 1;
    CREATE INDEX IF NOT EXISTS "ProgramWorkoutTemplate_programId_idx" ON "ProgramWorkoutTemplate"("programId");

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
    CREATE INDEX IF NOT EXISTS "ProgramExerciseTemplate_programWorkoutTemplateId_idx" ON "ProgramExerciseTemplate"("programWorkoutTemplateId");
  `).catch(() => {});
}

const adapter = new PrismaPg(globalForPrisma.pgPool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}