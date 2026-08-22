import { describe, it, expect } from "vitest";
import { MOBILITY_ROUTINES, getMuscleGroupsFromWorkout } from "@/app/dashboard/utils/mobilityRoutines";

describe("Mobility Routines & Helpers", () => {
  it("should have 6 pre-defined mobility routines with valid movements", () => {
    expect(MOBILITY_ROUTINES.length).toBe(6);

    MOBILITY_ROUTINES.forEach((routine) => {
      expect(routine.id).toBeTruthy();
      expect(routine.name).toBeTruthy();
      expect(routine.durationMinutes).toBeGreaterThan(0);
      expect(routine.targetMuscleGroups.length).toBeGreaterThan(0);
      expect(routine.movements.length).toBeGreaterThan(0);

      routine.movements.forEach((movement) => {
        expect(movement.name).toBeTruthy();
        expect(movement.durationSeconds).toBeGreaterThan(0);
        expect(movement.coachingCue).toBeTruthy();
      });
    });
  });

  it("should detect Chest and Arms from Bench Press and Curls", () => {
    const exercises = [
      { name: "Barbell Bench Press", category: "STRENGTH" },
      { name: "Incline Dumbbell Curl", category: "STRENGTH" },
    ];
    const detected = getMuscleGroupsFromWorkout(exercises);
    expect(detected).toContain("Chest");
    expect(detected).toContain("Arms");
  });

  it("should detect Legs and Back from Squats and Rows", () => {
    const exercises = [
      { name: "Barbell Back Squat", category: "STRENGTH" },
      { name: "Bent Over Barbell Row", category: "STRENGTH" },
      { name: "Romanian Deadlift", category: "STRENGTH" },
    ];
    const detected = getMuscleGroupsFromWorkout(exercises);
    expect(detected).toContain("Legs");
    expect(detected).toContain("Back");
  });

  it("should return Full Body when no specific keywords match", () => {
    const exercises = [{ name: "Unknown Movement XYZ", category: "OTHER" }];
    const detected = getMuscleGroupsFromWorkout(exercises);
    expect(detected).toEqual(["Full Body"]);
  });
});
