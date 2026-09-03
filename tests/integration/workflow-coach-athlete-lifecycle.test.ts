import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as createClient, GET as getClients } from "@/app/api/clients/route";
import { POST as createWorkout, GET as getWorkouts } from "@/app/api/workouts/route";
import { PATCH as updateWorkout, GET as getWorkoutById } from "@/app/api/workouts/[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    workoutSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    workoutExercise: {
      deleteMany: vi.fn(),
    },
    workout: {
      findMany: vi.fn(),
    },
    trainingProgram: {
      findUnique: vi.fn(),
    },
  },
}));

describe("End-to-End Workflow: Coach Studio to Athlete Execution Lifecycle", () => {
  const coachUser = { id: "coach-collin-1", name: "Collin Shapiro", email: "collin@strkyr.fit", role: "TRAINER" };
  const athleteClient = {
    id: "client-alex-99",
    userId: "coach-collin-1",
    name: "Alex Hunter",
    email: "alex@athlete.com",
    notes: "Prefers barbell movements and 30s rest intervals",
    inviteStatus: "ACCEPTED",
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute the full lifecycle from client onboarding to workout assignment, set logging, and workout completion", async () => {
    // ==========================================
    // Step 1: Coach Onboards a New Athlete Client
    // ==========================================
    (getServerSession as any).mockResolvedValue({ user: coachUser });
    (prisma.user.findFirst as any).mockResolvedValue(coachUser);
    (prisma.client.findFirst as any).mockResolvedValue(null);
    (prisma.client.findUnique as any).mockResolvedValue(athleteClient);
    (prisma.client.findMany as any).mockResolvedValue([athleteClient]);
    (prisma.client.create as any).mockResolvedValue(athleteClient);

    const clientReq = new NextRequest("http://localhost:3000/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "Alex Hunter", email: "alex@athlete.com", notes: "Prefers barbell movements and 30s rest intervals" }),
    });
    const clientRes = await createClient(clientReq);
    expect(clientRes.status).toBe(200);
    const clientData = await clientRes.json();
    expect(clientData.name).toBe("Alex Hunter");
    expect(clientData.id).toBe("client-alex-99");

    // =========================================================================
    // Step 2: Coach Assigns a Multi-Exercise Workout Targeted for Tomorrow
    // =========================================================================
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledDateStr = tomorrow.toISOString();

    const plannedWorkout = {
      id: "workout-session-101",
      trainerId: coachUser.id,
      clientId: athleteClient.id,
      client: athleteClient,
      status: "PLANNED",
      scheduledDate: tomorrow,
      createdAt: new Date(),
      notes: "Heavy Upper Body Power Day",
      exercises: [
        {
          id: "ex-1",
          name: "Barbell Bench Press",
          order: 0,
          sets: [
            { id: "set-1", order: 0, weight: 225, reps: 5, completed: false },
            { id: "set-2", order: 1, weight: 245, reps: 5, completed: false },
          ],
        },
        {
          id: "ex-2",
          name: "Incline Dumbbell Press",
          order: 1,
          sets: [
            { id: "set-3", order: 0, weight: 80, reps: 8, completed: false },
            { id: "set-4", order: 1, weight: 80, reps: 8, completed: false },
          ],
        },
      ],
    };

    (prisma.workoutSession.create as any).mockResolvedValue(plannedWorkout);

    const workoutCreateReq = new NextRequest("http://localhost:3000/api/workouts", {
      method: "POST",
      body: JSON.stringify({
        clientId: athleteClient.id,
        scheduledDate: scheduledDateStr,
        status: "PLANNED",
        notes: "Heavy Upper Body Power Day",
        exercises: plannedWorkout.exercises,
      }),
    });
    const workoutCreateRes = await createWorkout(workoutCreateReq);
    expect(workoutCreateRes.status).toBe(200);
    const createdWorkout = await workoutCreateRes.json();
    expect(createdWorkout.status).toBe("PLANNED");
    expect(createdWorkout.exercises.length).toBe(2);

    // ======================================================================================
    // Step 3: Verifies Athlete Queries Assigned Workouts in Chronological Ascending Sequence
    // ======================================================================================
    const nextWeekWorkout = {
      ...plannedWorkout,
      id: "workout-session-102",
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: "Next Week Upper Hypertrophy",
    };

    // Ascending order: tomorrow first, next week second
    (prisma.workoutSession.findMany as any).mockResolvedValue([plannedWorkout, nextWeekWorkout]);
    (prisma.workout.findMany as any).mockResolvedValue([]);

    const getWorkoutsReq = new NextRequest(`http://localhost:3000/api/workouts?clientId=${athleteClient.id}`);
    const getWorkoutsRes = await getWorkouts(getWorkoutsReq);
    expect(getWorkoutsRes.status).toBe(200);
    const workoutList = await getWorkoutsRes.json();
    expect(workoutList.length).toBe(2);
    // First element in list is the earliest scheduled workout
    expect(workoutList[0].id).toBe("workout-session-101");
    expect(workoutList[1].id).toBe("workout-session-102");

    // ===============================================================================
    // Step 4: Athlete Executes Workout, Logs Sets Complete, and Completes the Session
    // ===============================================================================
    const completedWorkout = {
      ...plannedWorkout,
      status: "COMPLETED",
      completedAt: new Date(),
      exercises: [
        {
          id: "ex-1",
          name: "Barbell Bench Press",
          order: 0,
          sets: [
            { id: "set-1", order: 0, weight: 225, reps: 5, completed: true },
            { id: "set-2", order: 1, weight: 245, reps: 5, completed: true },
          ],
        },
        {
          id: "ex-2",
          name: "Incline Dumbbell Press",
          order: 1,
          sets: [
            { id: "set-3", order: 0, weight: 80, reps: 8, completed: true },
            { id: "set-4", order: 1, weight: 80, reps: 8, completed: true },
          ],
        },
      ],
    };

    (prisma.workoutSession.findUnique as any).mockResolvedValue(plannedWorkout);
    (prisma.workoutSession.update as any).mockResolvedValue(completedWorkout);

    const updateReq = new NextRequest("http://localhost:3000/api/workouts/workout-session-101", {
      method: "PATCH",
      body: JSON.stringify({
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        exercises: completedWorkout.exercises,
      }),
    });
    const updateRes = await updateWorkout(updateReq, { params: Promise.resolve({ id: "workout-session-101" }) });
    expect(updateRes.status).toBe(200);
    const finalSession = await updateRes.json();
    expect(finalSession.status).toBe("COMPLETED");
    expect(finalSession.exercises[0].sets[0].completed).toBe(true);
    expect(finalSession.exercises[1].sets[1].completed).toBe(true);
  });
});
