export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results: string[] = [];

    // Ensure columns exist on Client table
    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "phone" TEXT;`);
    results.push("Added phone to Client");

    await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "fitnessGoals" TEXT;`);
    results.push("Added fitnessGoals to Client");

    // Ensure columns exist on User table
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;`);
    results.push("Added phone to User");

    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fitnessGoals" TEXT;`);
    results.push("Added fitnessGoals to User");

    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notes" TEXT;`);
    results.push("Added notes to User");

    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trainerId" TEXT;`);
    results.push("Added trainerId to User");

    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionProvider" TEXT DEFAULT 'stripe';`);
    results.push("Added subscriptionProvider to User");

    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;`);
    results.push("Added subscriptionId to User");

    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "originalTransactionId" TEXT;`);
    results.push("Added originalTransactionId to User");

    // Clean up any Client records that have the trainer's email mistakenly attached
    const cleaned = await prisma.$executeRawUnsafe(`
      UPDATE "Client" c
      SET email = NULL
      FROM "User" u
      WHERE c."userId" = u.id AND c.email = u.email AND c.name != 'My Workouts';
    `);
    results.push(`Cleaned up mismatched trainer emails from clients (${cleaned} rows)`);

    return NextResponse.json({
      success: true,
      message: "Database schema synchronized and cleaned successfully",
      results,
    });
  } catch (error: any) {
    console.error("Schema migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
