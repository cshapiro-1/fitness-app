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
      update: vi.fn(),
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

    it("should allow coach to delete a workout session leaving a remnant", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", name: "Coach Mike", email: "trainer@fit.com", role: "TRAINER" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "trainer-1",
        name: "Coach Mike",
        email: "trainer@fit.com",
        role: "TRAINER",
      });

      (prisma.workoutSession.findUnique as any).mockResolvedValue({
        id: "w-1",
        clientId: "client-1",
        loggedById: "trainer-1",
        notes: "Heavy leg day",
        client: { userId: "trainer-1", email: "client@fit.com" },
      });

      (prisma.workoutSession.update as any).mockResolvedValue({
        id: "w-1",
        deletedAt: new Date(),
        deletedByName: "Coach Mike",
        deletedByRole: "TRAINER",
        notes: "Heavy leg day • [Workout deleted by Coach Mike on Aug 22, 2026]",
      });

      const req = new NextRequest("http://localhost/api/workouts/w-1", { method: "DELETE" });
      const res = await deleteWorkout(req, { params: Promise.resolve({ id: "w-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.workout.deletedByName).toBe("Coach Mike");
    });

    it("should allow a client to delete their own workout leaving a remnant", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "client-user-1", name: "Collin Athlete", email: "collin@fit.com", role: "CLIENT" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "client-user-1",
        name: "Collin Athlete",
        email: "collin@fit.com",
        role: "CLIENT",
        clientProfileId: "client-1",
      });

      (prisma.workoutSession.findUnique as any).mockResolvedValue({
        id: "w-2",
        clientId: "client-1",
        loggedById: "client-user-1",
        notes: "Solo bench press",
        client: { userId: "trainer-1", email: "collin@fit.com" },
      });

      (prisma.workoutSession.update as any).mockResolvedValue({
        id: "w-2",
        deletedAt: new Date(),
        deletedByName: "Collin Athlete",
        deletedByRole: "CLIENT",
        notes: "Solo bench press • [Workout deleted by Collin Athlete on Aug 22, 2026]",
      });

      const req = new NextRequest("http://localhost/api/workouts/w-2", { method: "DELETE" });
      const res = await deleteWorkout(req, { params: Promise.resolve({ id: "w-2" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.workout.deletedByName).toBe("Collin Athlete");
    });

    it("should allow deleting a planned workout and purge it completely", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", name: "Coach Mike", email: "trainer@fit.com", role: "TRAINER" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "trainer-1",
        name: "Coach Mike",
        email: "trainer@fit.com",
        role: "TRAINER",
      });

      (prisma.workoutSession.findUnique as any).mockResolvedValue({
        id: "w-planned-1",
        clientId: "client-1",
        status: "PLANNED",
        loggedById: "trainer-1",
        client: { userId: "trainer-1", email: "client@fit.com" },
      });

      (prisma.workoutSession.delete as any).mockResolvedValue({ id: "w-planned-1" });

      const req = new NextRequest("http://localhost/api/workouts/w-planned-1", { method: "DELETE" });
      const res = await deleteWorkout(req, { params: Promise.resolve({ id: "w-planned-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.purged).toBe(true);
      expect(prisma.workoutSession.delete).toHaveBeenCalledWith({ where: { id: "w-planned-1" } });
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
        user: { id: "user-1", name: "Athlete John", role: "CLIENT", email: "john@fit.com" },
      });

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "client-1",
        userId: "user-1",
        name: "Athlete John",
        email: "john@fit.com",
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
