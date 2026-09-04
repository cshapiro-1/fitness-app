import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as generateRoutineRoute } from "@/app/api/ai/generate-routine/route";
import { POST as aiChatRoute } from "@/app/api/ai/chat/route";
import { POST as createWorkoutRoute } from "@/app/api/workouts/route";
import { answerFitnessQuery } from "@/lib/aiChatAssistant";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
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
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workoutExercise: {
      deleteMany: vi.fn(),
    },
  },
}));

describe("Solo Workouts & AI Program Generation Gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AI Routine Generation Route (/api/ai/generate-routine) Gating", () => {
    it("should reject CLIENT role with 403 Forbidden when attempting to generate a routine", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "client-user-1", email: "athlete@fit.com", name: "Solo Athlete", role: "CLIENT" },
      });

      const req = new NextRequest("http://localhost:3000/api/ai/generate-routine", {
        method: "POST",
        body: JSON.stringify({
          goal: "STRENGTH",
          split: "Upper Body Push",
          experienceLevel: "Intermediate",
          availableTimeMinutes: 45,
        }),
      });

      const res = await generateRoutineRoute(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe("COACH_STUDIO_EXCLUSIVE");
      expect(data.error).toContain("Automated routine generation is reserved for STRKYR Coach Studio");
    });

    it("should permit TRAINER role to generate strength routines", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "coach-collin", email: "collin@strkyr.fit", name: "Coach Collin", role: "TRAINER" },
      });

      const req = new NextRequest("http://localhost:3000/api/ai/generate-routine", {
        method: "POST",
        body: JSON.stringify({
          goal: "STRENGTH",
          split: "Upper Body Push",
          experienceLevel: "Advanced",
          availableTimeMinutes: 60,
        }),
      });

      const res = await generateRoutineRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.routine).toBeDefined();
      expect(data.routine.exercises.length).toBeGreaterThan(0);
    });

    it("should allow CLIENT role to generate dynamic MOBILITY warmups/cooldowns", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "client-user-1", email: "athlete@fit.com", name: "Solo Athlete", role: "CLIENT" },
      });

      const req = new NextRequest("http://localhost:3000/api/ai/generate-routine", {
        method: "POST",
        body: JSON.stringify({
          sessionType: "MOBILITY",
          muscleGroups: ["Full Body"],
          routineType: "warmup",
          durationMinutes: 5,
        }),
      });

      const res = await generateRoutineRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.routine).toBeDefined();
    });
  });

  describe("AI Chat Assistant Engine (answerFitnessQuery) Role Gating", () => {
    it("should refuse automated routine creation for CLIENT and omit executable actions", () => {
      const clientResult = answerFitnessQuery("Create a 4-day push-pull-legs workout plan for me", {
        requesterRole: "CLIENT",
        requesterName: "Solo Athlete",
        targetName: "Solo Athlete",
        workouts: [],
      });

      expect(clientResult.answer).toContain("Coach Exclusive Feature");
      expect(clientResult.answer).toContain("Solo Workout Builder");
      expect(clientResult.action).toBeUndefined();
    });

    it("should generate periodized routines and provide LOAD_INTO_BUILDER action for TRAINER", () => {
      const trainerResult = answerFitnessQuery("Create a 4-day push-pull-legs routine", {
        requesterRole: "TRAINER",
        requesterName: "Coach Collin",
        targetName: "Athlete Jane",
        targetClientId: "client-jane",
        workouts: [],
      });

      expect(trainerResult.answer).toContain("Generated Periodized Routine");
      expect(trainerResult.action).toBeDefined();
      expect(trainerResult.action?.type).toBe("LOAD_INTO_BUILDER");
      expect(trainerResult.action?.data.exercises.length).toBeGreaterThan(0);
    });

    it("should direct CLIENT to manual logger when requesting to log a session via chat", () => {
      const clientResult = answerFitnessQuery("I just finished my workout, log it", {
        requesterRole: "CLIENT",
        requesterName: "Solo Athlete",
        targetName: "Solo Athlete",
        workouts: [],
      });

      expect(clientResult.answer).toContain("Ready to Log Your Solo Workout");
      expect(clientResult.action).toBeUndefined();
    });

    it("should continue answering exercise science & progression queries for CLIENT", () => {
      const clientResult = answerFitnessQuery("What can I substitute for bench press?", {
        requesterRole: "CLIENT",
        requesterName: "Solo Athlete",
        targetName: "Solo Athlete",
        workouts: [],
      });

      expect(clientResult.answer).toBeDefined();
      expect(clientResult.answer.length).toBeGreaterThan(20);
    });
  });

  describe("AI Chat API Route (/api/ai/chat) Action Suppression", () => {
    it("should never return an executable routine action to a CLIENT user", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "client-1", email: "client@test.com", role: "CLIENT", name: "Client User" },
      });

      (prisma.client.findFirst as any).mockResolvedValue({
        id: "client-profile-1",
        name: "Client User",
        email: "client@test.com",
        userId: "client-1",
      });

      (prisma.workoutSession.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          query: "Build a workout routine for upper body",
        }),
      });

      const res = await aiChatRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBeNull();
      expect(data.answer).toContain("Coach Exclusive Feature");
    });
  });

  describe("Solo Athlete Workout Persistence (/api/workouts)", () => {
    it("should permit a solo athlete to save a workout without an assigned coach", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "solo-user-99", email: "fiancee@strkyr.fit", name: "Solo Athlete", role: "CLIENT" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "solo-user-99",
        name: "Solo Athlete",
        email: "fiancee@strkyr.fit",
        role: "CLIENT",
      });

      // Self client found
      (prisma.client.findFirst as any).mockResolvedValue({
        id: "solo-client-99",
        userId: "solo-user-99",
        name: "Solo Athlete",
        email: "fiancee@strkyr.fit",
      });

      (prisma.workoutSession.create as any).mockResolvedValue({
        id: "session-solo-1",
        clientId: "solo-client-99",
        status: "COMPLETED",
        loggedByRole: "CLIENT",
        loggedById: "solo-user-99",
        exercises: [
          {
            id: "ex-1",
            name: "Barbell Bench Press",
            sets: [{ id: "set-1", weight: 135, reps: 8 }],
          },
        ],
      });

      const req = new NextRequest("http://localhost:3000/api/workouts", {
        method: "POST",
        body: JSON.stringify({
          clientId: "self",
          status: "COMPLETED",
          notes: "Solo leg & chest day",
          exercises: [
            {
              name: "Barbell Bench Press",
              sets: [{ weight: 135, reps: 8 }],
            },
          ],
        }),
      });

      const res = await createWorkoutRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("session-solo-1");
      expect(data.loggedByRole).toBe("CLIENT");
    });
  });
});
