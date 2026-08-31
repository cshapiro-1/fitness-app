import { describe, it, expect } from "vitest";
import { INITIAL_UNIFIED_EXERCISES, normalizeExerciseName } from "@/lib/unifiedExerciseLibrary";

describe("Anatomy Library 1:1 Diagram Uniqueness & Integrity", () => {
  it("should have at least 51 movements in the unified exercise and stretch library", () => {
    expect(INITIAL_UNIFIED_EXERCISES.length).toBeGreaterThanOrEqual(51);
  });

  it("should enforce 100% unique diagram URLs with zero duplicates across all exercises", () => {
    const seenUrls = new Map<string, string>();
    const duplicates: { name: string; url: string; conflictedWith: string }[] = [];

    for (const exercise of INITIAL_UNIFIED_EXERCISES) {
      expect(exercise.diagramUrl).toBeDefined();
      expect(exercise.diagramUrl.length).toBeGreaterThan(0);

      if (seenUrls.has(exercise.diagramUrl)) {
        duplicates.push({
          name: exercise.name,
          url: exercise.diagramUrl,
          conflictedWith: seenUrls.get(exercise.diagramUrl)!,
        });
      } else {
        seenUrls.set(exercise.diagramUrl, exercise.name);
      }
    }

    expect(duplicates).toEqual([]);
    expect(seenUrls.size).toEqual(INITIAL_UNIFIED_EXERCISES.length);
  });

  it("should have valid kinesiological attributes for every single exercise", () => {
    for (const exercise of INITIAL_UNIFIED_EXERCISES) {
      expect(exercise.name).toBeTruthy();
      expect(exercise.normalizedName).toBeTruthy();
      expect(exercise.primaryMuscles.length).toBeGreaterThan(0);
      expect(exercise.secondaryMuscles.length).toBeGreaterThan(0);
      expect(exercise.biomechanicsCue.length).toBeGreaterThan(10);
      expect(exercise.steps.length).toBeGreaterThan(0);
      expect(["EXERCISE", "STRETCH", "MOBILITY"]).toContain(exercise.type);
    }
  });

  it("should correctly normalize names for 1:1 asset resolution", () => {
    expect(normalizeExerciseName("Barbell Bench Press")).toBe("barbell_bench_press");
    expect(normalizeExerciseName("Chest Dip")).toBe("chest_dip");
    expect(normalizeExerciseName("Romanian Deadlift (RDL)")).toBe("romanian_deadlift_rdl");
    expect(normalizeExerciseName("90/90 Hip Mobility Flow")).toBe("90_90_hip_mobility_flow");
  });
});
