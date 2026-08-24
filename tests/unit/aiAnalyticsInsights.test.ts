import { describe, it, expect } from "vitest";
import { generateAnalyticsInsights } from "@/app/dashboard/utils/aiAnalyticsInsights";
import { DashboardAnalytics } from "@/app/dashboard/utils/analytics";

describe("AI Analytics Insights Engine", () => {
  it("should return sensible calibration defaults when analytics has no workouts", () => {
    const emptyAnalytics: DashboardAnalytics = {
      workouts: [],
      overall: {
        totalWorkouts: 0,
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        averageVolumePerWorkout: 0,
        favoriteExercise: "None",
      },
      muscleGroups: [],
      exercises: [],
    };

    const insights = generateAnalyticsInsights(emptyAnalytics);
    expect(insights).toBeDefined();
    expect(insights.trainingScore).toBe(50);
    expect(insights.frequencyRating).toBe("Foundational");
    expect(insights.periodizationRecommendations.length).toBeGreaterThan(0);
  });

  it("should identify progressive overload breakthroughs and muscular symmetry ratios", () => {
    const sampleAnalytics: DashboardAnalytics = {
      workouts: [{ id: "w1" } as any, { id: "w2" } as any, { id: "w3" } as any],
      overall: {
        totalWorkouts: 5,
        totalVolume: 25000,
        totalSets: 45,
        totalReps: 450,
        averageVolumePerWorkout: 5000,
        favoriteExercise: "Barbell Bench Press",
      },
      muscleGroups: [
        { name: "Chest", totalVolume: 12000, totalSets: 20, exerciseCount: 2 },
        { name: "Back", totalVolume: 10000, totalSets: 18, exerciseCount: 2 },
        { name: "Legs", totalVolume: 3000, totalSets: 7, exerciseCount: 1 },
      ],
      exercises: [
        {
          name: "Barbell Bench Press",
          muscleGroup: "Chest",
          totalVolume: 12000,
          totalSets: 20,
          totalReps: 180,
          maxWeight: 225,
          maxEstimated1RM: 260,
          firstLoggedWeight: 205,
          weightChangePercent: 9.8,
          sessions: 4,
          trend: [
            { date: "2026-08-01", topWeight: 205, estimatedOneRepMax: 235, totalVolume: 2500 },
            { date: "2026-08-15", topWeight: 225, estimatedOneRepMax: 260, totalVolume: 3500 },
          ],
        },
        {
          name: "Barbell Deadlift",
          muscleGroup: "Back",
          totalVolume: 10000,
          totalSets: 18,
          totalReps: 90,
          maxWeight: 365,
          maxEstimated1RM: 410,
          firstLoggedWeight: 335,
          weightChangePercent: 9.0,
          sessions: 3,
          trend: [
            { date: "2026-08-01", topWeight: 335, estimatedOneRepMax: 375, totalVolume: 3000 },
            { date: "2026-08-15", topWeight: 365, estimatedOneRepMax: 410, totalVolume: 4000 },
          ],
        },
      ],
    };

    const insights = generateAnalyticsInsights(sampleAnalytics);
    expect(insights).toBeDefined();
    expect(insights.trainingScore).toBeGreaterThan(70);
    expect(insights.progressiveOverloadHighlights.length).toBeGreaterThanOrEqual(1);
    expect(insights.progressiveOverloadHighlights[0].gain).toBe("+9.8%");
    expect(insights.symmetryAnalysis.status).toBe("OPTIMAL");
  });
});
