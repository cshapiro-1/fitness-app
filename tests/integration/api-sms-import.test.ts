import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/import-text-history/route";
import { parseSMSWorkoutText } from "@/lib/smsWorkoutParser";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    workoutSession: {
      create: vi.fn(),
    },
  },
}));

describe("SMS & Text Message Workout Importer (Multi-Client)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseSMSWorkoutText parser logic", () => {
    it("should parse multi-client text headers and attribute workouts correctly", () => {
      const rawText = `[Collin Shapiro]
8/10 - Upper Power
Bench Press 4x8 @ 185, 205, 215, 225
Incline DB Press 3x10 @ 65s

[Sarah Jenkins]
8/12 - Lower Strength
Barbell Squat 4x6 @ 275, 295, 315, 315
Romanian Deadlift 3x8 @ 225`;

      const knownClients = [
        { id: "c-collin", name: "Collin Shapiro" },
        { id: "c-sarah", name: "Sarah Jenkins" },
      ];

      const sessions = parseSMSWorkoutText(rawText, undefined, knownClients);

      expect(sessions.length).toBe(2);
      expect(sessions[0].clientId).toBe("c-collin");
      expect(sessions[0].clientName).toBe("Collin Shapiro");
      expect(sessions[0].exercises.length).toBe(2);
      expect(sessions[0].exercises[0].name).toContain("Bench Press");

      expect(sessions[1].clientId).toBe("c-sarah");
      expect(sessions[1].clientName).toBe("Sarah Jenkins");
      expect(sessions[1].exercises.length).toBe(2);
      expect(sessions[1].exercises[0].name).toContain("Squat");
    });
  });

  describe("POST /api/ai/import-text-history", () => {
    it("should reject unauthenticated import requests", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/ai/import-text-history", {
        method: "POST",
        body: JSON.stringify({ rawText: "Bench 3x10 @ 135" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("should successfully backfill multi-client workouts for a trainer", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", name: "Coach Mike", email: "mike@fit.com", role: "TRAINER" },
      });

      (prisma.client.findMany as any).mockResolvedValue([
        { id: "c-collin", userId: "trainer-1", name: "Collin Shapiro" },
        { id: "c-sarah", userId: "trainer-1", name: "Sarah Jenkins" },
      ]);

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "c-collin",
        userId: "trainer-1",
        name: "Collin Shapiro",
      });

      (prisma.workoutSession.create as any).mockImplementation((args: any) => ({
        id: "ws-" + Math.random(),
        ...args.data,
        exercises: args.data.exercises.create.map((ex: any) => ({
          name: ex.name,
          sets: ex.sets.create,
        })),
      }));

      const req = new NextRequest("http://localhost:3000/api/ai/import-text-history", {
        method: "POST",
        body: JSON.stringify({
          clientId: "c-collin",
          mode: "commit",
          sessions: [
            {
              date: "2026-08-10",
              title: "Upper Power",
              clientId: "c-collin",
              exercises: [
                {
                  name: "Bench Press",
                  sets: [{ weight: 225, reps: 8 }],
                },
              ],
            },
            {
              date: "2026-08-12",
              title: "Lower Strength",
              clientId: "c-sarah",
              exercises: [
                {
                  name: "Barbell Squat",
                  sets: [{ weight: 315, reps: 5 }],
                },
              ],
            },
          ],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.importedCount).toBe(2);
      expect(prisma.workoutSession.create).toHaveBeenCalledTimes(2);
    });
  });
});
