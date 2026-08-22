import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE as deleteWorkout } from "@/app/api/workouts/[id]/route";
import { POST as createWorkout } from "@/app/api/workouts/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/email", () => ({
  sendWorkoutNotification: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
    },
    workoutSession: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    workout: {
      deleteMany: vi.fn(),
    },
  },
}));

describe("Workout Delete & Repeat Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DELETE /api/workouts/[id]", () => {
    it("should reject unauthenticated delete requests", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest("http://localhost/api/workouts/w-1", { method: "DELETE" });
      const res = await deleteWorkout(req, { params: Promise.resolve({ id: "w-1" }) });
      expect(res.status).toBe(401);
    });

    it("should allow coach to delete a workout session", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fit.com", role: "TRAINER" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "trainer-1",
        email: "trainer@fit.com",
        role: "TRAINER",
      });

      (prisma.workoutSession.findUnique as any).mockResolvedValue({
        id: "w-1",
        clientId: "client-1",
        loggedById: "trainer-1",
        client: { userId: "trainer-1", email: "client@fit.com" },
      });

      (prisma.workoutSession.delete as any).mockResolvedValue({ id: "w-1" });

      const req = new NextRequest("http://localhost/api/workouts/w-1", { method: "DELETE" });
      const res = await deleteWorkout(req, { params: Promise.resolve({ id: "w-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("should prevent unauthorized user from deleting someone else's workout", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "stranger-1", email: "stranger@fit.com", role: "CLIENT" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "stranger-1",
        email: "stranger@fit.com",
        role: "CLIENT",
        clientProfileId: "other-client",
      });

      (prisma.workoutSession.findUnique as any).mockResolvedValue({
        id: "w-1",
        clientId: "client-1",
        loggedById: "trainer-1",
        client: { userId: "trainer-1", email: "client@fit.com" },
      });

      const req = new NextRequest("http://localhost/api/workouts/w-1", { method: "DELETE" });
      const res = await deleteWorkout(req, { params: Promise.resolve({ id: "w-1" }) });
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/workouts (Repeat Workout)", () => {
    it("should allow repeating a workout with status PLANNED", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "user-1", name: "Athlete John", role: "CLIENT" },
      });

      (prisma.workoutSession.create as any).mockResolvedValue({
        id: "w-new",
        clientId: "client-1",
        status: "PLANNED",
        notes: "Repeat session",
        exercises: [
          {
            name: "Barbell Bench Press",
            sets: [{ weight: 185, reps: 5 }],
          },
        ],
      });

      const req = new NextRequest("http://localhost/api/workouts", {
        method: "POST",
        body: JSON.stringify({
          clientId: "client-1",
          status: "PLANNED",
          notes: "Repeat session",
          exercises: [
            {
              name: "Barbell Bench Press",
              sets: [{ weight: 185, reps: 5, notes: "" }],
            },
          ],
        }),
      });

      const res = await createWorkout(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("w-new");
      expect(data.status).toBe("PLANNED");
    });
  });
});
