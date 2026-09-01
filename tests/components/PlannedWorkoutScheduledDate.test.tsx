import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { WorkoutBuilder } from "@/app/dashboard/components/WorkoutBuilder";

describe("Planned Workout Scheduled Date Display Tests", () => {
  it("should render the target assigned date for planned workouts instead of creation timestamp", () => {
    const plannedWorkouts = [
      {
        id: "planned-1",
        clientId: "client-1",
        status: "PLANNED" as const,
        sessionType: "WORKOUT",
        notes: "Week 2 — Day 1 — Chest & Triceps Overload",
        startedAt: "2026-09-15T09:00:00.000Z",
        createdAt: "2026-09-01T10:00:00.000Z",
        exercises: [
          {
            id: "ex-1",
            workoutSessionId: "planned-1",
            name: "Barbell Bench Press",
            order: 0,
            sets: [
              { id: "s-1", workoutExerciseId: "ex-1", order: 1, weight: 185, reps: 8, notes: "RPE 8" },
            ],
          },
        ],
      },
    ];

    render(
      <WorkoutBuilder
        activeWorkout={null}
        setActiveWorkout={vi.fn()}
        exercisePicker=""
        setExercisePicker={vi.fn()}
        plannedWorkouts={plannedWorkouts as any}
        historyWorkouts={[]}
        savingPlan={false}
        savingWorkout={false}
        draftRestored={false}
        onClearDraftNotice={vi.fn()}
        onStartWorkout={vi.fn()}
        onBeginPlannedWorkout={vi.fn()}
        onSaveWorkoutPlan={vi.fn()}
        onCompleteWorkout={vi.fn()}
        clientName="Collin Shapiro"
      />
    );

    expect(screen.getByText("Week 2 — Day 1 — Chest & Triceps Overload")).toBeInTheDocument();
    // Verify that the assigned target date (Sep 15, 2026) is rendered
    expect(screen.getByText(/Assigned for/i)).toBeInTheDocument();
    expect(screen.getByText(/Sep 15, 2026/i)).toBeInTheDocument();
  });
});
