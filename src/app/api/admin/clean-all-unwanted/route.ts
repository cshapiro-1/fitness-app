export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Delete all legacy Workout records
    const deletedLegacy = await prisma.workout.deleteMany({});

    // 2. Find all workout sessions
    const sessions = await prisma.workoutSession.findMany({
      include: {
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    // 3. Delete any session not belonging to real clients (keep Collin, Liz, Brian, Maddy, May)
    const validClientEmails = ["collin.shapiro1@gmail.com"];
    const validTrainerEmails = ["chisailor87@gmail.com"];

    const deletedSessions: string[] = [];
    for (const session of sessions) {
      const trainerEmail = session.client?.user?.email;
      const isJose = trainerEmail && validTrainerEmails.includes(trainerEmail.toLowerCase());
      if (!isJose) {
        await prisma.workoutSession.delete({ where: { id: session.id } });
        deletedSessions.push(session.id);
      }
    }

    // 4. Return remaining clean sessions
    const remainingSessions = await prisma.workoutSession.findMany({
      include: {
        client: {
          include: { user: true },
        },
        exercises: {
          include: { sets: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedLegacyCount: deletedLegacy.count,
      deletedSessions,
      remainingSessionsCount: remainingSessions.length,
      remainingSessions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
