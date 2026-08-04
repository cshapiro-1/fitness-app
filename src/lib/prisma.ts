import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return new PrismaClient();
  }

  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });
}

export const prisma = globalForPrisma.prisma || createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
