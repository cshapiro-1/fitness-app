import { describe, it, expect } from "vitest";
import {
  calculateWorkoutDate,
  calculateProgressiveWeight,
  materializeProgramSchedule,
  ProgramProgressionConfig,
  WorkoutTemplateInput,
} from "@/lib/periodizationEngine";

describe("Periodization & Progressive Overload Engine", () => {
  it("should accurately calculate progressive overload weights over non-deload weeks", () => {
    const config: ProgramProgressionConfig = {
      durationWeeks: 6,
      startDate: "2026-09-01",
      progressionType: "LINEAR_OVERLOAD",
      progressionRate: 2.5, // +2.5% per week
      deloadFrequency: 4,   // Deload at week 4
    };

    // Base weight 200 lbs
    // Week 1 (Base): 200
    const w1 = calculateProgressiveWeight(200, 1, config);
    expect(w1.weight).toBe(200);
    expect(w1.isDeload).toBe(false);

    // Week 2 (+2.5%): 205
    const w2 = calculateProgressiveWeight(200, 2, config);
    expect(w2.weight).toBe(205);
    expect(w2.isDeload).toBe(false);

    // Week 3 (+5.0%): 210
    const w3 = calculateProgressiveWeight(200, 3, config);
    expect(w3.weight).toBe(210);
    expect(w3.isDeload).toBe(false);

    // Week 4 (Deload @ 70%): 140
    const w4 = calculateProgressiveWeight(200, 4, config);
    expect(w4.weight).toBe(140);
    expect(w4.isDeload).toBe(true);

    // Week 5 (+7.5%): 215
    const w5 = calculateProgressiveWeight(200, 5, config);
    expect(w5.weight).toBe(215);
    expect(w5.isDeload).toBe(false);
  });

  it("should correctly handle wave periodization loading curves", () => {
    const waveConfig: ProgramProgressionConfig = {
      durationWeeks: 6,
      startDate: "2026-09-01",
      progressionType: "WAVE_PERIODIZATION",
      deloadFrequency: 4,
    };

    const w1 = calculateProgressiveWeight(100, 1, waveConfig);
    expect(w1.weight).toBe(100);

    const w2 = calculateProgressiveWeight(100, 2, waveConfig);
    expect(w2.weight).toBe(105); // 104 rounded to nearest 2.5 is 105

    const w3 = calculateProgressiveWeight(100, 3, waveConfig);
    expect(w3.weight).toBe(107.5); // 108 rounded to nearest 2.5 is 107.5

    const w4 = calculateProgressiveWeight(100, 4, waveConfig);
    expect(w4.weight).toBe(70); // Deload
    expect(w4.isDeload).toBe(true);
  });

  it("should calculate calendar dates for scheduled workouts based on restDaysBetween parameter", () => {
    const startDate = "2026-09-01"; // Tuesday

    // 1 rest day between workouts (default / every other day)
    const w1d1_1rest = calculateWorkoutDate(startDate, 0, null, 0, 1);
    expect(w1d1_1rest).toBe("2026-09-01"); // Tue
    const w1d2_1rest = calculateWorkoutDate(startDate, 0, null, 1, 1);
    expect(w1d2_1rest).toBe("2026-09-03"); // Thu (1 rest day Wed)
    const w1d3_1rest = calculateWorkoutDate(startDate, 0, null, 2, 1);
    expect(w1d3_1rest).toBe("2026-09-05"); // Sat (1 rest day Fri)

    // 0 rest days (consecutive days)
    const w1d1_0rest = calculateWorkoutDate(startDate, 0, null, 0, 0);
    expect(w1d1_0rest).toBe("2026-09-01"); // Tue
    const w1d2_0rest = calculateWorkoutDate(startDate, 0, null, 1, 0);
    expect(w1d2_0rest).toBe("2026-09-02"); // Wed
    const w1d3_0rest = calculateWorkoutDate(startDate, 0, null, 2, 0);
    expect(w1d3_0rest).toBe("2026-09-03"); // Thu

    // 2 rest days between workouts
    const w1d1_2rest = calculateWorkoutDate(startDate, 0, null, 0, 2);
    expect(w1d1_2rest).toBe("2026-09-01"); // Tue
    const w1d2_2rest = calculateWorkoutDate(startDate, 0, null, 1, 2);
    expect(w1d2_2rest).toBe("2026-09-04"); // Fri (2 rest days Wed, Thu)

    // Week 2 Day 1
    const w2d1 = calculateWorkoutDate(startDate, 1, null, 0, 1);
    expect(w2d1).toBe("2026-09-08"); // Next Tue (+7 days)
  });

  it("should materialize a complete multi-week schedule with supersets and rest times", () => {
    const templates: WorkoutTemplateInput[] = [
      {
        name: "Upper Body Push",
        order: 0,
        cadence: "WEEKLY",
        exercises: [
          {
            name: "Bench Press",
            order: 0,
            targetSets: 4,
            targetReps: "6",
            suggestedWeight: 200,
            rpe: 8,
            supersetGroup: null,
            restSeconds: 120,
          },
          {
            name: "Incline DB Press",
            order: 1,
            targetSets: 3,
            targetReps: "8-10",
            suggestedWeight: 70,
            rpe: 8.5,
            supersetGroup: "A1",
            restSeconds: 45,
          },
          {
            name: "DB Lateral Raise",
            order: 2,
            targetSets: 3,
            targetReps: "12-15",
            suggestedWeight: 25,
            rpe: 8.5,
            supersetGroup: "A2",
            restSeconds: 90,
          },
        ],
      },
      {
        name: "Lower Body Squat",
        order: 1,
        cadence: "WEEKLY",
        exercises: [
          {
            name: "Back Squat",
            order: 0,
            targetSets: 4,
            targetReps: "5",
            suggestedWeight: 300,
            rpe: 8,
            supersetGroup: null,
            restSeconds: 180,
          },
        ],
      },
    ];

    const config: ProgramProgressionConfig = {
      durationWeeks: 4,
      startDate: "2026-09-01",
      progressionType: "LINEAR_OVERLOAD",
      progressionRate: 2.5,
      deloadFrequency: 4,
    };

    const schedule = materializeProgramSchedule(templates, config);

    // 4 weeks * 2 templates = 8 scheduled workouts
    expect(schedule.length).toBe(8);

    // Week 1 Day 1
    const w1d1 = schedule[0];
    expect(w1d1.weekNumber).toBe(1);
    expect(w1d1.isDeloadWeek).toBe(false);
    expect(w1d1.exercises[0].suggestedWeight).toBe(200);
    expect(w1d1.exercises[1].supersetGroup).toBe("A1");
    expect(w1d1.exercises[2].supersetGroup).toBe("A2");
    expect(w1d1.exercises[1].restSeconds).toBe(45);

    // Week 4 Day 1 (Deload)
    const w4d1 = schedule[6];
    expect(w4d1.weekNumber).toBe(4);
    expect(w4d1.isDeloadWeek).toBe(true);
    expect(w4d1.exercises[0].suggestedWeight).toBe(140); // 70% of 200
    expect(w4d1.exercises[0].rpe).toBe(6.0);
  });
});
