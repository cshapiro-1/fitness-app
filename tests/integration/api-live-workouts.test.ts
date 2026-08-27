import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/workouts/[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workoutSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workoutExercise: {
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Live Collaborative Workout API - GET & PATCH /api/workouts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return live snapshot of an in-progress workout via GET", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "client-user-1", email: "athlete@gym.com", role: "CLIENT" },
    });

    (prisma.workoutSession.findUnique as any).mockResolvedValue({
      id: "workout-live-1",
      status: "IN_PROGRESS",
      startedAt: new Date("2026-08-27T10:00:00Z"),
      notes: "Leg Day Live",
      client: {
        id: "client-1",
        name: "Athlete Athlete",
        email: "athlete@gym.com",
        userId: "trainer-1",
      },
      exercises: [
        {
          id: "ex-1",
          name: "Barbell Back Squat",
          order: 0,
          sets: [{ id: "set-1", weight: 225, reps: 5, order: 0 }],
        },
      ],
    });

    const req = new Request("http://localhost:3000/api/workouts/workout-live-1");
    const res = await GET(req as any, { params: Promise.resolve({ id: "workout-live-1" }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("workout-live-1");
    expect(data.status).toBe("IN_PROGRESS");
    expect(data.exercises).toHaveLength(1);
  });

  it("should allow athlete to update sets and complete a live workout started by coach", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "client-user-1", email: "athlete@gym.com", name: "Jose Athlete", role: "CLIENT" },
    });

    (prisma.workoutSession.findUnique as any).mockResolvedValue({
      id: "workout-live-1",
      status: "IN_PROGRESS",
      loggedById: "trainer-1",
      client: {
        id: "client-1",
        email: "athlete@gym.com",
        userId: "trainer-1",
      },
    });

    (prisma.workoutSession.update as any).mockResolvedValue({
      id: "workout-live-1",
      status: "COMPLETED",
      completedAt: new Date(),
      loggedByName: "Jose Athlete",
      loggedByRole: "CLIENT",
      exercises: [],
    });

    const req = new Request("http://localhost:3000/api/workouts/workout-live-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        exercises: [
          {
            name: "Barbell Bench Press",
            sets: [{ weight: 185, reps: 8 }],
          },
        ],
      }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: "workout-live-1" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("COMPLETED");
  });
});
