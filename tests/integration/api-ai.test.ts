import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/ai/generate-routine/route";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-123", email: "trainer@fit.com", name: "Coach Mike", role: "TRAINER" },
  }),
}));

describe("AI Workout Generator API", () => {
  it("should generate a structured Strength routine with biomechanical cues", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/generate-routine", {
      method: "POST",
      body: JSON.stringify({
        goal: "STRENGTH",
        split: "Upper Body Push",
        experienceLevel: "Advanced",
        availableTimeMinutes: 60,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.routine).toBeDefined();
    expect(json.routine.exercises.length).toBeGreaterThan(0);
    expect(json.routine.exercises[0].coachingCue).toBeDefined();
    expect(json.routine.warmupInstructions.length).toBeGreaterThan(0);
  });

  it("should generate a Calisthenics / Bodyweight program when requested", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/generate-routine", {
      method: "POST",
      body: JSON.stringify({
        goal: "BODYWEIGHT",
        split: "Calisthenics & Core",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.routine.goal).toBe("BODYWEIGHT");
    expect(json.routine.exercises.some((e: any) => e.isBodyweight)).toBe(true);
  });
});
