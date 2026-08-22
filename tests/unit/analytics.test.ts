import { describe, it, expect } from "vitest";
import { computeAnalytics, getMuscleGroup } from "@/app/dashboard/utils/analytics";
import { WorkoutSession } from "@/app/dashboard/types";

describe("Analytics Utility", () => {
  describe("getMuscleGroup", () => {
    it("should correctly classify common exercises", () => {
      expect(getMuscleGroup("Barbell Bench Press")).toBe("Chest");
      expect(getMuscleGroup("Dumbbell Chest Fly")).toBe("Chest");
      expect(getMuscleGroup("Deadlift")).toBe("Legs");
      expect(getMuscleGroup("Lat Pulldown")).toBe("Back");
      expect(getMuscleGroup("Barbell Back Squat")).toBe("Legs");
      expect(getMuscleGroup("Leg Extension")).toBe("Legs");
      expect(getMuscleGroup("Overhead Press")).toBe("Shoulders");
      expect(getMuscleGroup("Bicep Curl")).toBe("Arms");
      expect(getMuscleGroup("Plank")).toBe("Core");
    });

    it("should fallback to Other for unrecognized exercise names", () => {
      expect(getMuscleGroup("Unknown Movement XYZ")).toBe("Other");
    });
  });

  describe("computeAnalytics", () => {
    it("should return empty overall stats when given zero workouts", () => {
      const result = computeAnalytics([]);
      expect(result.overall.totalWorkouts).toBe(0);
      expect(result.overall.totalVolume).toBe(0);
      expect(result.overall.totalSets).toBe(0);
      expect(result.overall.heaviestSet).toBeNull();
      expect(result.exercises).toHaveLength(0);
    });

    it("should accurately compute total volume, sets, and max 1RM for workouts", () => {
      const mockWorkouts: WorkoutSession[] = [
        {
          id: "w1",
          clientId: "c1",
          status: "COMPLETED",
          startedAt: "2026-08-01T10:00:00Z",
          completedAt: "2026-08-01T11:00:00Z",
          createdAt: "2026-08-01T10:00:00Z",
          exercises: [
            {
              id: "e1",
              order: 0,
              name: "Barbell Bench Press",
              sets: [
                { id: "s1", order: 0, weight: 135, reps: 10, notes: null },
                { id: "s2", order: 1, weight: 185, reps: 5, notes: null },
              ],
            },
            {
              id: "e2",
              order: 1,
              name: "Barbell Back Squat",
              sets: [
                { id: "s3", order: 0, weight: 225, reps: 5, notes: null },
              ],
            },
          ],
        },
      ];

      const result = computeAnalytics(mockWorkouts);

      expect(result.overall.totalWorkouts).toBe(1);
      expect(result.overall.totalSets).toBe(3);
      // Volume: (135*10) + (185*5) + (225*5) = 1350 + 925 + 1125 = 3400
      expect(result.overall.totalVolume).toBe(3400);
      expect(result.overall.heaviestSet?.weight).toBe(225);
      expect(result.overall.heaviestSet?.exercise).toBe("Barbell Back Squat");

      const bench = result.exercises.find((e) => e.name === "Barbell Bench Press");
      expect(bench).toBeDefined();
      expect(bench?.maxWeight).toBe(185);
      expect(bench?.totalVolume).toBe(2275);

      const chestGroup = result.muscleGroups.find((g) => g.name === "Chest");
      expect(chestGroup).toBeDefined();
      expect(chestGroup?.exerciseCount).toBe(1);
      expect(chestGroup?.totalVolume).toBe(2275);
    });
  });
});
