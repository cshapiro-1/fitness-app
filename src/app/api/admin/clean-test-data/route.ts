export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Delete placeholder test users
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: "placeholder.app" } },
          { email: { contains: "@local.test" } },
        ],
      },
    });

    // 2. Delete test clients named 'test', 'test2', 'test34534', 'fasdasdf', 'My Workouts', 'test client 1'
    const deletedClients = await prisma.client.deleteMany({
      where: {
        OR: [
          { name: { in: ["test", "test2", "test34534", "fasdasdf", "My Workouts", "test client 1"] } },
        ],
      },
    });

    // 3. Delete any legacy seeded workouts (date prior to Aug 14 or without loggedByRole)
    const deletedLegacy = await prisma.workout.deleteMany({
      where: {
        OR: [
          { exercise: "Deadlift", date: "2026-08-03" },
          { date: { contains: "2026-06" } },
          { date: { contains: "2026-07" } },
          { date: { contains: "2026-02" } },
        ],
      },
    });

    // 4. Ensure Jose Dildine's client for Collin has the workout session
    const collinClient = await prisma.client.findFirst({
      where: { email: "collin.shapiro1@gmail.com" },
      include: {
        workoutSessions: {
          include: { exercises: { include: { sets: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedClientsCount: deletedClients.count,
      deletedLegacyWorkoutsCount: deletedLegacy.count,
      collinClient,
    });
  } catch (error: any) {
    console.error("Clean test data error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
