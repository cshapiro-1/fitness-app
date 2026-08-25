import { describe, it, expect } from "vitest";
import {
  EXERCISE_LIBRARY,
  searchExercises,
  isDefaultBodyweight,
  levenshteinDistance,
  scoreExercise,
} from "@/app/dashboard/utils/exerciseLibrary";

describe("Exercise Library Database & Fuzzy Search", () => {
  it("should contain at least 80 pre-seeded exercises across all main muscle groups", () => {
    expect(EXERCISE_LIBRARY.length).toBeGreaterThanOrEqual(80);
  });

  it("should accurately calculate Levenshtein distance for typos", () => {
    expect(levenshteinDistance("dumbell", "dumbbell")).toBe(1);
    expect(levenshteinDistance("sqaut", "squat")).toBe(1);
    expect(levenshteinDistance("bench", "bench")).toBe(0);
  });

  it("should resolve common fitness acronyms and abbreviations", () => {
    // "db" -> Dumbbell exercises
    const dbResults = searchExercises("db bench");
    expect(dbResults.length).toBeGreaterThan(0);
    expect(dbResults.some((ex) => ex.name.includes("Dumbbell Press"))).toBe(true);

    // "rdl" -> Romanian Deadlift
    const rdlResults = searchExercises("rdl");
    expect(rdlResults.length).toBeGreaterThan(0);
    expect(rdlResults[0].name).toContain("Romanian Deadlift");

    // "ohp" -> Overhead Barbell Press
    const ohpResults = searchExercises("ohp");
    expect(ohpResults.length).toBeGreaterThan(0);
    expect(ohpResults[0].name).toContain("Overhead Barbell Press");

    // "bb" -> Barbell exercises
    const bbResults = searchExercises("bb squat");
    expect(bbResults.length).toBeGreaterThan(0);
    expect(bbResults.some((ex) => ex.name.includes("Barbell"))).toBe(true);
  });

  it("should tolerate common spelling mistakes and typos", () => {
    // "dumbell" instead of "dumbbell"
    const typo1 = searchExercises("dumbell curl");
    expect(typo1.length).toBeGreaterThan(0);
    expect(typo1.some((ex) => ex.name.includes("Dumbbell") && ex.name.includes("Curl"))).toBe(true);

    // "sqaut" instead of "squat"
    const typo2 = searchExercises("sqaut");
    expect(typo2.length).toBeGreaterThan(0);
    expect(typo2.some((ex) => ex.name.includes("Squat"))).toBe(true);

    // "romainian" instead of "romanian"
    const typo3 = searchExercises("romainian");
    expect(typo3.length).toBeGreaterThan(0);
    expect(typo3.some((ex) => ex.name.includes("Romanian Deadlift"))).toBe(true);
  });

  it("should match multi-term queries regardless of word order", () => {
    const order1 = searchExercises("incline fly dumbbell");
    const order2 = searchExercises("dumbbell fly incline");
    expect(order1.length).toBeGreaterThan(0);
    expect(order2.length).toBeGreaterThan(0);
    expect(order1.some((ex) => ex.name === "Incline Dumbbell Fly")).toBe(true);
    expect(order2.some((ex) => ex.name === "Incline Dumbbell Fly")).toBe(true);
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

  it("should accurately identify bodyweight / body resistance movements", () => {
    expect(isDefaultBodyweight("Push-Up")).toBe(true);
    expect(isDefaultBodyweight("Pushups")).toBe(true);
    expect(isDefaultBodyweight("Back Extension / Hyperextension")).toBe(true);
    expect(isDefaultBodyweight("Jumping Jacks")).toBe(true);
    expect(isDefaultBodyweight("Pull-Up")).toBe(true);
    expect(isDefaultBodyweight("Bodyweight Air Squats")).toBe(true);
    expect(isDefaultBodyweight("Barbell Bench Press")).toBe(false);
    expect(isDefaultBodyweight("Barbell Back Squat")).toBe(false);
  });
});
