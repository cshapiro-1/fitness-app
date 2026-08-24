import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/analytics-insights/route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ limited: false }),
  RATE_LIMIT_PRESETS: { AI: {} },
}));

describe("POST /api/ai/analytics-insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/ai/analytics-insights", {
      method: "POST",
      body: JSON.stringify({ analytics: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should successfully generate structured AI analytics insights when authenticated", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user-1", email: "trainer@fit.com", role: "TRAINER" },
    });

    const req = new NextRequest("http://localhost:3000/api/ai/analytics-insights", {
      method: "POST",
      body: JSON.stringify({
        analytics: {
          workouts: [{ id: "w1" }],
          overall: {
            totalWorkouts: 4,
            totalVolume: 15000,
            totalSets: 24,
            totalReps: 240,
            averageVolumePerWorkout: 3750,
            favoriteExercise: "Barbell Squat",
          },
          muscleGroups: [{ name: "Legs", totalVolume: 15000, totalSets: 24, exerciseCount: 1 }],
          exercises: [
            {
              name: "Barbell Squat",
              muscleGroup: "Legs",
              totalVolume: 15000,
              totalSets: 24,
              totalReps: 240,
              maxWeight: 315,
              maxEstimated1RM: 350,
              firstLoggedWeight: 275,
              weightChangePercent: 14.5,
              sessions: 4,
              trend: [
                { date: "2026-08-01", topWeight: 275, estimatedOneRepMax: 300, totalVolume: 3000 },
                { date: "2026-08-15", topWeight: 315, estimatedOneRepMax: 350, totalVolume: 4500 },
              ],
            },
          ],
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.insights).toBeDefined();
    expect(data.insights.executiveSummary).toContain("Legs");
    expect(data.insights.progressiveOverloadHighlights[0].title).toContain("Barbell Squat");
    expect(data.insights.progressiveOverloadHighlights[0].gain).toBe("+14.5%");
  });
});
