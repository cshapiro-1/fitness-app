import { describe, it, expect } from "vitest";
import { EXERCISE_LIBRARY, searchExercises } from "@/app/dashboard/utils/exerciseLibrary";

describe("Exercise Library Database", () => {
  it("should contain at least 80 pre-seeded exercises across all main muscle groups", () => {
    expect(EXERCISE_LIBRARY.length).toBeGreaterThanOrEqual(80);
  });

  it("should filter exercises by text search query", () => {
    const results = searchExercises("bench");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((ex) => ex.name.includes("Bench Press"))).toBe(true);
  });

  it("should filter exercises by muscle group", () => {
    const legs = searchExercises("", "Legs");
    expect(legs.length).toBeGreaterThan(5);
    expect(legs.every((ex) => ex.muscleGroup === "Legs")).toBe(true);
  });

  it("should filter exercises by equipment type", () => {
    const dumbbells = searchExercises("", "All", "Dumbbell");
    expect(dumbbells.length).toBeGreaterThan(5);
    expect(dumbbells.every((ex) => ex.equipment === "Dumbbell")).toBe(true);
  });
});
