import { describe, it, expect } from "vitest";
import { generateWorkoutSummary } from "@/app/dashboard/utils/aiWorkoutSummary";
import { DraftWorkout } from "@/app/dashboard/types";

describe("AI Workout Summary Generator", () => {
  it("should handle empty or null workouts gracefully", () => {
    const res = generateWorkoutSummary(null);
    expect(res.totalVolumeLbs).toBe(0);
    expect(res.totalSets).toBe(0);
    expect(res.summary).toContain("Completed workout session");
  });

  it("should calculate total volume, reps, and detect top lift", () => {
    const workout: DraftWorkout = {
      startedAt: new Date().toISOString(),
      notes: "",
      exercises: [
        {
          name: "Barbell Bench Press",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "135", reps: "10", notes: "Warmup" },
            { weight: "225", reps: "6", notes: "Working set" },
            { weight: "225", reps: "5", notes: "Working set" },
          ],
        },
        {
          name: "Triceps Pushdown",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "60", reps: "12", notes: "" },
            { weight: "70", reps: "10", notes: "" },
          ],
        },
      ],
    };

    const res = generateWorkoutSummary(workout);
    // Bench: 135*10 (1350) + 225*6 (1350) + 225*5 (1125) = 3825
    // Triceps: 60*12 (720) + 70*10 (700) = 1420
    // Total Volume = 5245 lbs
    // Total Sets = 5
    // Total Reps = 10 + 6 + 5 + 12 + 10 = 43

    expect(res.totalVolumeLbs).toBe(5245);
    expect(res.totalSets).toBe(5);
    expect(res.totalReps).toBe(43);
    expect(res.topLift?.exerciseName).toBe("Barbell Bench Press");
    expect(res.topLift?.weight).toBe(225);
    expect(res.summary).toContain("Chest & Arms");
    expect(res.summary).toContain("5,245 lbs total volume");
    expect(res.summary).toContain("Barbell Bench Press at 225 lbs × 6 reps");
  });

  it("should handle bodyweight workouts without crashing", () => {
    const workout: DraftWorkout = {
      startedAt: new Date().toISOString(),
      notes: "",
      exercises: [
        {
          name: "Pull-ups",
          category: "BODYWEIGHT",
          isBodyweight: true,
          sets: [
            { weight: "0", reps: "10", notes: "" },
            { weight: "0", reps: "8", notes: "" },
          ],
        },
      ],
    };

    const res = generateWorkoutSummary(workout);
    expect(res.totalSets).toBe(2);
    expect(res.totalReps).toBe(18);
    expect(res.summary).toContain("Back");
    expect(res.summary).toContain("2 working sets");
  });
});
