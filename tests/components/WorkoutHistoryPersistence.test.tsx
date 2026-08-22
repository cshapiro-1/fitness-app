import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutHistory } from "@/app/dashboard/components/WorkoutHistory";
import { WorkoutSession } from "@/app/dashboard/types";

const mockSessions: WorkoutSession[] = [
  {
    id: "session-hist-1",
    clientId: "client-collin-1",
    status: "COMPLETED",
    createdAt: "2026-08-18T12:00:00.000Z",
    completedAt: "2026-08-18T13:00:00.000Z",
    notes: "Upper body strength block",
    loggedByRole: "TRAINER",
    loggedByName: "Coach",
    exercises: [
      {
        id: "ex-1",
        name: "Barbell Bench Press",
        order: 0,
        sets: [
          { id: "set-1", order: 0, weight: 225, reps: 5, notes: "" },
          { id: "set-2", order: 1, weight: 245, reps: 3, notes: "New PR" },
        ],
      },
    ],
  },
  {
    id: "session-hist-2",
    clientId: "client-collin-1",
    status: "COMPLETED",
    createdAt: "2026-08-20T12:00:00.000Z",
    completedAt: "2026-08-20T13:00:00.000Z",
    notes: "Lower body quad focus",
    loggedByRole: "CLIENT",
    loggedByName: "Collin",
    exercises: [
      {
        id: "ex-2",
        name: "Barbell Squat",
        order: 0,
        sets: [{ id: "set-3", order: 0, weight: 315, reps: 5, notes: "" }],
      },
    ],
  },
];

describe("Workout History UI Persistence & Safety Suite", () => {
  it("should render all past workout sessions without omitting any exercise data", () => {
    const onDelete = vi.fn();
    const onRepeat = vi.fn();

    render(
      <WorkoutHistory
        completedWorkouts={mockSessions}
        loadingWorkouts={false}
        onDeleteWorkout={onDelete}
        onRepeatWorkout={onRepeat}
      />
    );

    expect(screen.getAllByText(/Barbell Bench Press/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Barbell Squat/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Upper body strength block/i)).toBeDefined();
    expect(screen.getByText(/Lower body quad focus/i)).toBeDefined();
  });

  it("should trigger onRepeatWorkout with complete session structure when repeat button clicked", () => {
    const onDelete = vi.fn();
    const onRepeat = vi.fn();

    render(
      <WorkoutHistory
        completedWorkouts={mockSessions}
        loadingWorkouts={false}
        onDeleteWorkout={onDelete}
        onRepeatWorkout={onRepeat}
      />
    );

    const repeatBtns = screen.getAllByRole("button", { name: /repeat/i });
    expect(repeatBtns.length).toBe(2);

    // WorkoutHistory sorts descending by date (Aug 20 before Aug 18)
    fireEvent.click(repeatBtns[0]);
    expect(onRepeat).toHaveBeenCalledWith(mockSessions[1]);
  });

  it("should cleanly show empty state only when completedWorkouts array is genuinely empty", () => {
    const onDelete = vi.fn();

    render(
      <WorkoutHistory
        completedWorkouts={[]}
        loadingWorkouts={false}
        onDeleteWorkout={onDelete}
      />
    );

    expect(screen.getByText(/No workouts logged yet/i)).toBeDefined();
  });
});
