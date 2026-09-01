import { describe, it, expect } from "vitest";
import { generateAnalyticsInsights } from "@/app/dashboard/utils/aiAnalyticsInsights";
import { DashboardAnalytics } from "@/app/dashboard/utils/analytics";

describe("AI Analytics Insights Engine", () => {
  it("should return sensible calibration defaults when analytics has no workouts", () => {
    const emptyAnalytics = {
      workouts: [],
      overall: {
        totalWorkouts: 0,
        totalExercises: 0,
        totalSets: 0,
        totalVolume: 0,
        weeklyAvgWorkouts: 0,
        heaviestSet: null,
        highestRepSet: null,
        best1RM: null,
        mostTrainedExercise: null,
      },
      muscleGroups: [],
      exercises: [],
      acwr: { acuteLoad: 0, chronicLoad: 0, ratio: 1, zone: "optimal" as const, recommendation: "" },
      symmetry: { pushVolume: 0, pullVolume: 0, pushToPullRatio: 1, quadVolume: 0, hamstringVolume: 0, quadToHamRatio: 1, anteriorVolume: 0, posteriorVolume: 0, coreVolume: 0, armsVolume: 0, radarPoints: [] },
      intensity: { zone1Count: 0, zone1Volume: 0, zone1Percent: 0, zone2Count: 0, zone2Volume: 0, zone2Percent: 0, zone3Count: 0, zone3Volume: 0, zone3Percent: 0, totalTrackedSets: 0 },
      multiLift: { availableLifts: [], timeline: [] },
      plateaus: [],
    } as unknown as DashboardAnalytics;

    const insights = generateAnalyticsInsights(emptyAnalytics);
    expect(insights).toBeDefined();
    expect(insights.trainingScore).toBe(50);
    expect(insights.frequencyRating).toBe("Foundational");
    expect(insights.periodizationRecommendations.length).toBeGreaterThan(0);
  });

  it("should identify progressive overload breakthroughs and muscular symmetry ratios", () => {
    const sampleAnalytics = {
      workouts: [{ id: "w1" } as any, { id: "w2" } as any, { id: "w3" } as any],
      overall: {
        totalWorkouts: 5,
        totalExercises: 2,
        totalSets: 45,
        totalVolume: 25000,
        weeklyAvgWorkouts: 3,
        heaviestSet: null,
        highestRepSet: null,
        best1RM: null,
        mostTrainedExercise: null,
      },
      muscleGroups: [
        { name: "Chest", totalVolume: 12000, totalSets: 20, exerciseCount: 1, exercises: [] },
        { name: "Back", totalVolume: 10000, totalSets: 18, exerciseCount: 1, exercises: [] },
        { name: "Legs", totalVolume: 3000, totalSets: 7, exerciseCount: 1, exercises: [] },
      ],
      exercises: [
        {
          name: "Barbell Bench Press",
          muscleGroup: "Chest",
          totalVolume: 12000,
          totalSets: 20,
          maxReps: 10,
          avgTopWeight: 215,
          maxWeight: 225,
          maxEstimated1RM: 260,
          weightChangePercent: 9.8,
          sessions: 4,
          trend: [
            { completedAt: "2026-08-01", workoutId: "w1", topWeight: 205, topReps: 5, estimatedOneRepMax: 235, totalVolume: 2500, setCount: 3 },
            { completedAt: "2026-08-15", workoutId: "w2", topWeight: 225, topReps: 5, estimatedOneRepMax: 260, totalVolume: 3500, setCount: 4 },
          ],
        },
        {
          name: "Barbell Deadlift",
          muscleGroup: "Back",
          totalVolume: 10000,
          totalSets: 18,
          maxReps: 5,
          avgTopWeight: 350,
          maxWeight: 365,
          maxEstimated1RM: 410,
          weightChangePercent: 9.0,
          sessions: 3,
          trend: [
            { completedAt: "2026-08-01", workoutId: "w1", topWeight: 335, topReps: 5, estimatedOneRepMax: 375, totalVolume: 3000, setCount: 3 },
            { completedAt: "2026-08-15", workoutId: "w2", topWeight: 365, topReps: 5, estimatedOneRepMax: 410, totalVolume: 4000, setCount: 4 },
          ],
        },
      ],
      acwr: { acuteLoad: 0, chronicLoad: 0, ratio: 1, zone: "optimal" as const, recommendation: "" },
      symmetry: { pushVolume: 12000, pullVolume: 10000, pushToPullRatio: 1.2, quadVolume: 3000, hamstringVolume: 3000, quadToHamRatio: 1, anteriorVolume: 12000, posteriorVolume: 10000, coreVolume: 0, armsVolume: 0, radarPoints: [] },
      intensity: { zone1Count: 0, zone1Volume: 0, zone1Percent: 0, zone2Count: 0, zone2Volume: 0, zone2Percent: 0, zone3Count: 0, zone3Volume: 0, zone3Percent: 0, totalTrackedSets: 0 },
      multiLift: { availableLifts: [], timeline: [] },
      plateaus: [],
    } as unknown as DashboardAnalytics;

    const insights = generateAnalyticsInsights(sampleAnalytics);
    expect(insights).toBeDefined();
    expect(insights.trainingScore).toBeGreaterThan(70);
    expect(insights.progressiveOverloadHighlights.length).toBeGreaterThanOrEqual(1);
    expect(insights.progressiveOverloadHighlights[0].gain).toBe("+9.8%");
    expect(insights.symmetryAnalysis.status).toBe("OPTIMAL");
  });
});
