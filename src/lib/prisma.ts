import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

const getConnectionString = () => process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fitness";

if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = new Pool({ connectionString: getConnectionString() });
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