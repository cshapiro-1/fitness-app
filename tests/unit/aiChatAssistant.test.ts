import { describe, it, expect } from "vitest";
import { answerFitnessQuery, AIChatContext } from "@/lib/aiChatAssistant";

describe("AI Chat Assistant Intelligence Engine", () => {
  const sampleWorkouts = [
    {
      id: "w1",
      completedAt: "2026-08-01T10:00:00Z",
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [
            { weight: 205, reps: 5 },
            { weight: 205, reps: 5 },
            { weight: 205, reps: 5 },
          ],
        },
        {
          name: "Barbell Squat",
          sets: [
            { weight: 275, reps: 5 },
            { weight: 275, reps: 5 },
          ],
        },
      ],
    },
    {
      id: "w2",
      completedAt: "2026-08-15T10:00:00Z",
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [
            { weight: 225, reps: 5 },
            { weight: 225, reps: 5 },
          ],
        },
        {
          name: "Barbell Row",
          sets: [
            { weight: 185, reps: 8 },
            { weight: 185, reps: 8 },
          ],
        },
      ],
    },
  ];

  it("should answer exercise progression inquiries with real weight trends and 1RM metrics", () => {
    const context: AIChatContext = {
      requesterRole: "TRAINER",
      requesterName: "Collin",
      targetName: "Sarah Connor",
      workouts: sampleWorkouts,
    };

    const res = answerFitnessQuery("How has Sarah's bench press progressed?", context);
    expect(res.answer).toContain("Barbell Bench Press Performance Analysis");
    expect(res.answer).toContain("205 lbs");
    expect(res.answer).toContain("225 lbs");
    expect(res.referencedExercises).toContain("Barbell Bench Press");
    expect(res.metricsFound?.totalWorkoutsAnalyzed).toBe(2);
  });

  it("should diagnose push/pull muscular balance and provide recommendations", () => {
    const context: AIChatContext = {
      requesterRole: "CLIENT",
      requesterName: "Sarah",
      targetName: "Sarah",
      workouts: sampleWorkouts,
    };

    const res = answerFitnessQuery("Do I have any push pull muscular imbalances?", context);
    expect(res.answer).toContain("Muscular Symmetry");
    expect(res.answer).toContain("Push Volume");
    expect(res.answer).toContain("Pull Volume");
  });

  it("should provide safe biomechanical substitutions for pain or joint regressions", () => {
    const context: AIChatContext = {
      requesterRole: "CLIENT",
      requesterName: "Sarah",
      targetName: "Sarah",
      workouts: sampleWorkouts,
    };

    const res = answerFitnessQuery("What can I substitute if my knees hurt on squats?", context);
    expect(res.answer).toContain("Safe Exercise Regressions");
    expect(res.answer).toContain("Leg Press");
    expect(res.answer).toContain("Box Squats");
  });

  it("should provide a high-level training history summary", () => {
    const context: AIChatContext = {
      requesterRole: "TRAINER",
      requesterName: "Collin",
      targetName: "Sarah Connor",
      workouts: sampleWorkouts,
    };

    const res = answerFitnessQuery("Give me an overview summary of recent workouts", context);
    expect(res.answer).toContain("Training Summary for Sarah Connor");
    expect(res.answer).toContain("Total Sessions Logged:** 2");
    expect(res.metricsFound?.totalWorkoutsAnalyzed).toBe(2);
  });

  it("should generate 1-click executable routine actions when asked to create or build workouts", () => {
    const context: AIChatContext = {
      requesterRole: "TRAINER",
      requesterName: "Collin",
      targetName: "Sarah Connor",
      workouts: sampleWorkouts,
    };

    const res = answerFitnessQuery("Create a 4-day push workout split for Sarah", context);
    expect(res.answer).toContain("Generated Periodized Routine");
    expect(res.action).toBeDefined();
    expect(res.action?.type).toBe("LOAD_INTO_BUILDER");
    expect(res.action?.data.exercises.length).toBeGreaterThanOrEqual(3);
    expect(res.action?.data.exercises[0].name).toBe("Barbell Bench Press");
  });

  it("should calculate exact realistic progressive overload recommendations for deadlift (+5 to +10 lbs from 205 lbs to 210-215 lbs, never 600 lbs)", () => {
    const context: AIChatContext = {
      requesterRole: "CLIENT",
      requesterName: "Collin",
      targetName: "Collin",
      workouts: [
        {
          id: "w-deadlift",
          completedAt: "2026-08-26T12:00:00Z",
          exercises: [
            {
              name: "Conventional Deadlift",
              sets: [
                { weight: 205, reps: 5 },
                { weight: 205, reps: 5 },
                { weight: 205, reps: 5 },
              ],
            },
          ],
        },
      ],
    };

    const res = answerFitnessQuery("What is a reasonable increase for deadlift after completing 205 lbs?", context);
    expect(res.answer).toContain("Progressive Overload Recommendation");
    expect(res.answer).toContain("210 lbs");
    expect(res.answer).toContain("215 lbs");
    expect(res.answer).not.toContain("go to 600 lbs");
    expect(res.answer).toContain("NSCA 2-for-2 Rule");
    expect(res.action).toBeDefined();
    expect(res.action?.type).toBe("LOAD_INTO_BUILDER");
    expect(res.action?.data.exercises[0].sets.some((s) => s.weight === "210")).toBe(true);
  });

  it("should calculate realistic micro-loading for bench press (+2.5 to +5 lbs)", () => {
    const context: AIChatContext = {
      requesterRole: "CLIENT",
      requesterName: "Collin",
      targetName: "Collin",
      workouts: sampleWorkouts,
    };

    const res = answerFitnessQuery("How much should I increase bench press at 225?", context);
    expect(res.answer).toContain("Barbell Bench Press");
    expect(res.answer).toContain("227.5 lbs");
    expect(res.answer).toContain("230 lbs");
    expect(res.answer).toContain("+2.5 to +5 lbs");
  });
});
