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
});
