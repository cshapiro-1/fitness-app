import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fitness";

// CRITICAL FIX: The Pool MUST be cached globally alongside Prisma in Dev Mode, 
// otherwise HMR destroys the connection and causes NextAuth to hang indefinitely.
if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = new Pool({ connectionString });
}

const adapter = new PrismaPg(globalForPrisma.pgPool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}