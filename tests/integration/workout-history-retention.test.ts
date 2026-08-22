import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getWorkouts } from "@/app/api/workouts/route";
import { GET as getClientWorkouts } from "@/app/api/workouts/client/route";
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
      findMany: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    workout: {
      findMany: vi.fn(),
    },
  },
}));

describe("Workout History Retention & Attribution Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workouts - Trainer & Athlete History Preservation", () => {
    it("should retrieve workouts with case-insensitive user email identity", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "COACH.COLLIN@FITPRO.COM" },
      });

      (prisma.user.findFirst as any).mockResolvedValue({
        id: "trainer-collin-1",
        email: "coach.collin@fitpro.com",
        role: "TRAINER",
      });

      (prisma.client.findMany as any).mockResolvedValue([
        { id: "client-collin-self", name: "My Workouts (Personal)", userId: "trainer-collin-1" },
        { id: "client-athlete-1", name: "Sarah Connor", userId: "trainer-collin-1" },
      ]);

      const mockSessions = [
        {
          id: "session-1",
          clientId: "client-collin-self",
          status: "COMPLETED",
          completedAt: "2026-08-20T10:00:00Z",
          exercises: [
            {
              id: "ex-1",
              name: "Barbell Bench Press",
              sets: [{ weight: 225, reps: 5 }],
            },
          ],
        },
      ];

      (prisma.workoutSession.findMany as any).mockResolvedValue(mockSessions);
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://strkyr.fit/api/workouts");
      const res = await getWorkouts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].id).toBe("session-1");
      expect(data[0].exercises[0].name).toBe("Barbell Bench Press");
    });

    it("should aggregate all self-profile workouts when querying personal profile", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-collin-1", email: "collin@fitpro.com" },
      });

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "client-my-workouts-new",
        name: "My Workouts",
        userId: "trainer-collin-1",
      });

      (prisma.client.findMany as any).mockResolvedValue([
        { id: "client-my-workouts-new" },
        { id: "client-legacy-self-profile" },
      ]);

      const mockSessions = [
        {
          id: "session-recent",
          clientId: "client-my-workouts-new",
          status: "COMPLETED",
          completedAt: "2026-08-22T08:00:00Z",
          exercises: [{ name: "Squat", sets: [{ weight: 315, reps: 3 }] }],
        },
        {
          id: "session-legacy",
          clientId: "client-legacy-self-profile",
          status: "COMPLETED",
          completedAt: "2026-08-15T08:00:00Z",
          exercises: [{ name: "Deadlift", sets: [{ weight: 405, reps: 2 }] }],
        },
      ];

      (prisma.workoutSession.findMany as any).mockResolvedValue(mockSessions);
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://strkyr.fit/api/workouts?clientId=client-my-workouts-new");
      const res = await getWorkouts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(2);
      expect(data.some((s: any) => s.id === "session-recent")).toBe(true);
      expect(data.some((s: any) => s.id === "session-legacy")).toBe(true);
    });

    it("should retrieve all workouts across all clients when clientId=all", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-collin-1", email: "collin@fitpro.com" },
      });

      (prisma.client.findMany as any).mockResolvedValue([
        { id: "client-1" },
        { id: "client-2" },
      ]);

      const mockSessions = [
        {
          id: "session-client-1",
          clientId: "client-1",
          status: "COMPLETED",
          completedAt: "2026-08-22T08:00:00Z",
          exercises: [{ name: "Squat", sets: [{ weight: 315, reps: 3 }] }],
        },
        {
          id: "session-client-2",
          clientId: "client-2",
          status: "COMPLETED",
          completedAt: "2026-08-15T08:00:00Z",
          exercises: [{ name: "Deadlift", sets: [{ weight: 405, reps: 2 }] }],
        },
      ];

      (prisma.workoutSession.findMany as any).mockResolvedValue(mockSessions);
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://strkyr.fit/api/workouts?clientId=all");
      const res = await getWorkouts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(2);
      expect(data[0].id).toBe("session-client-1");
      expect(data[1].id).toBe("session-client-2");
    });
  });

  describe("GET /api/workouts/client - Athlete Client Portal History Resolution", () => {
    it("should retrieve athlete workout history matching userId, clientProfileId, and email fallback", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: "athlete@fitpro.com" },
      });

      (prisma.user.findFirst as any).mockResolvedValue({
        id: "user-athlete-123",
        email: "athlete@fitpro.com",
        clientProfileId: "client-profile-456",
        role: "CLIENT",
      });

      (prisma.client.findMany as any).mockResolvedValue([
        { id: "client-profile-456" },
      ]);

      (prisma.workoutSession.findMany as any).mockResolvedValue([
        {
          id: "session-athlete-1",
          clientId: "client-profile-456",
          status: "COMPLETED",
          completedAt: "2026-08-21T14:00:00Z",
          exercises: [{ name: "Overhead Press", sets: [{ weight: 135, reps: 8 }] }],
        },
      ]);
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://strkyr.fit/api/workouts/client");
      const res = await getClientWorkouts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(1);
      expect(data[0].id).toBe("session-athlete-1");
      expect(data[0].exercises[0].name).toBe("Overhead Press");
    });
  });
});
