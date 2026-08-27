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