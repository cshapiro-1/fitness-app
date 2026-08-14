export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWorkoutNotification } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    if (!userId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = dbUser?.id;
    }
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = new URL(req.url).searchParams.get("clientId");
    if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

    // Fetch real WorkoutSessions
    const sessions = await prisma.workoutSession.findMany({
      where: { clientId },
      include: {
        exercises: { orderBy: { order: "asc" }, include: { sets: { orderBy: { order: "asc" } } } }
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch legacy seeded Workouts and dynamically group them
    const legacyWorkouts = await prisma.workout.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } });
    const sessionMap = new Map();
    for (const w of legacyWorkouts) {
       const sessionKey = w.date || (w.createdAt ? new Date(w.createdAt).toISOString() : "unknown");
       if (!sessionMap.has(sessionKey)) {
          sessionMap.set(sessionKey, {
             id: "session-" + w.id, clientId: w.clientId, status: "COMPLETED",
             createdAt: w.createdAt ? new Date(w.createdAt).toISOString() : w.date,
             completedAt: w.date || new Date().toISOString(), notes: w.notes || "", exercises: []
          });
       }
       const s = sessionMap.get(sessionKey);
       if (!s.notes && w.notes) s.notes = w.notes;
       s.exercises.push({
          id: "leg-ex-" + w.id, order: s.exercises.length, name: w.exercise,
          sets: Array.from({ length: w.sets || 1 }, (_, i) => ({ id: "leg-set-" + w.id + "-" + i, order: i, weight: w.weight || 0, reps: w.reps || 0, notes: "" }))
       });
    }

    const legacyMapped = Array.from(sessionMap.values());
    const all = [...sessions, ...legacyMapped].sort((a,b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
    return NextResponse.json(all);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    let trainerName = session?.user?.name || "Your Coach";

    if (!userId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = dbUser?.id;
      if (dbUser?.name) trainerName = dbUser.name;
    }
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { clientId, status, startedAt, completedAt, notes, exercises } = body;
    
    if (!clientId || !exercises) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const created = await prisma.workoutSession.create({
      data: {
        clientId, status: status || "COMPLETED",
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        notes: notes || null,
        exercises: {
          create: exercises.map((ex: any, i: number) => ({
            name: ex.name,
            order: i,
            category: ex.isBodyweight || ex.category === "BODYWEIGHT" ? "BODYWEIGHT" : "STRENGTH",
            sets: { create: ex.sets.map((s: any, j: number) => ({ order: j, weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, notes: s.notes || null })) }
          }))
        }
      },
      include: { exercises: { include: { sets: true } } }
    });

    // Trigger Email Notification for Client if they have an email & notifications enabled
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { user: true },
      });

      if (client?.email && client.emailNotifications !== false) {
        const notifTrainer = client.user?.name || trainerName || "Coach";
        const notifType = status === "PLANNED" ? "ASSIGNED" : "COMPLETED";

        await sendWorkoutNotification({
          recipientEmail: client.email,
          recipientName: client.name || "Athlete",
          trainerName: notifTrainer,
          type: notifType,
          notes: notes || null,
          exercises: exercises.map((ex: any) => ({
            name: ex.name,
            sets: (ex.sets || []).map((s: any) => ({
              weight: s.weight,
              reps: s.reps,
              notes: s.notes,
            })),
          })),
          dateStr: completedAt
            ? new Date(completedAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          clientId,
        });
      }
    } catch (emailErr) {
      console.error("Failed to trigger email notification:", emailErr);
      // Do not fail the workout creation request if email dispatcher errors
    }

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}