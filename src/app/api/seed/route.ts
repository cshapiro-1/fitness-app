import { UserRole } from "@prisma/client";
import { normalizeUserRole } from '@/lib/utils/role-helpers';
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden in production" }, { status: 403 });
  }

  try {
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { name: { contains: "test", mode: "insensitive" } },
          { name: { not: "My Workouts" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!client) {
      let trainer = await prisma.user.findFirst({ where: { role: UserRole.TRAINER } });
      if (!trainer) {
        trainer = await prisma.user.create({
          data: {
            email: "demo.trainer@fitnessapp.com",
            name: "Demo Trainer",
            role: UserRole.TRAINER,
          },
        });
      }

      client = await prisma.client.create({
        data: {
          userId: trainer.id,
          name: "Test Client",
          notes: "Generated test profile with 6 months of history",
        },
      });
    }

    const totalWeeks = 26;
    const now = new Date();
    const workoutsToCreate = [];

    for (let week = 0; week < totalWeeks; week++) {
      const progress = week / (totalWeeks - 1);
      const weeksAgo = totalWeeks - 1 - week;

      const date1 = new Date(now.getTime());
      date1.setDate(date1.getDate() - (weeksAgo * 7 + 4));

      const date2 = new Date(now.getTime());
      date2.setDate(date2.getDate() - (weeksAgo * 7 + 1));

      const benchWeight = Math.round(115 + progress * 60);
      const ohpWeight = Math.round(75 + progress * 40);
      const rowWeight = Math.round(95 + progress * 50);
      const tricepsWeight = Math.round(40 + progress * 25);

      const squatWeight = Math.round(135 + progress * 90);
      const deadliftWeight = Math.round(155 + progress * 110);
      const latWeight = Math.round(100 + progress * 50);
      const curlWeight = Math.round(20 + progress * 15);

      const notesA = [
        "Smooth upper body session. Felt strong on bench.",
        "Good momentum today.",
        "Pushed hard on final set.",
        "Bar moved fast today!",
        "Controlled tempo on all reps.",
      ];
      const notesB = [
        "Great leg day! Hit target depth easily.",
        "Deadlifts felt solid today.",
        "Increased weight on squat, felt good.",
        "Great overall energy.",
        "Pushed for a strong finish.",
      ];

      workoutsToCreate.push(
        { clientId: client.id, exercise: "Bench Press", weight: benchWeight, sets: 4, reps: 8, date: date1.toISOString(), notes: notesA[week % notesA.length] },
        { clientId: client.id, exercise: "Overhead Press", weight: ohpWeight, sets: 3, reps: 8, date: date1.toISOString(), notes: null },
        { clientId: client.id, exercise: "Bent Over Row", weight: rowWeight, sets: 3, reps: 10, date: date1.toISOString(), notes: null },
        { clientId: client.id, exercise: "Triceps Pushdown", weight: tricepsWeight, sets: 3, reps: 12, date: date1.toISOString(), notes: null }
      );

      workoutsToCreate.push(
        { clientId: client.id, exercise: "Back Squat", weight: squatWeight, sets: 4, reps: 6, date: date2.toISOString(), notes: notesB[week % notesB.length] },
        { clientId: client.id, exercise: "Deadlift", weight: deadliftWeight, sets: 3, reps: 5, date: date2.toISOString(), notes: null },
        { clientId: client.id, exercise: "Lat Pulldown", weight: latWeight, sets: 3, reps: 10, date: date2.toISOString(), notes: null },
        { clientId: client.id, exercise: "Dumbbell Curl", weight: curlWeight, sets: 3, reps: 12, date: date2.toISOString(), notes: null }
      );
    }

    try {
      await prisma.workout.createMany({ data: workoutsToCreate });
    } catch {
      for (const w of workoutsToCreate) {
        await prisma.workout.create({ data: w });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded 6 months (52 sessions) of workout data for client "${client.name}"!`,
      clientName: client.name,
      clientId: client.id,
      totalLogsCreated: workoutsToCreate.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to seed data" }, { status: 500 });
  }
}