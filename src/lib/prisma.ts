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

  // Auto-sync missing schema columns on Postgres (User & Client flags)
  pool.query(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN DEFAULT false;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasSeenTour" BOOLEAN DEFAULT false;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT true;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionProvider" TEXT DEFAULT 'stripe';
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'trial';
    ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT true;
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