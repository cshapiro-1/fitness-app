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
    expect(screen.getAllByText(/Finished/i).length).toBe(2);
    expect(screen.getByText(/Logged by Client/i)).toBeDefined();
    expect(screen.getByText(/Logged by Coach/i)).toBeDefined();
  });

  it("should render dedicated toolbar with Repeat, Copy Session, and Delete action buttons", () => {
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

    const deleteButtons = screen.getAllByTitle(/Delete workout/i);
    expect(deleteButtons.length).toBe(2);
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith("session-hist-2");

    const copyButtons = screen.getAllByTitle(/Copy full workout to clipboard/i);
    expect(copyButtons.length).toBe(2);
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

  it("should trigger onEditWorkout when edit button is clicked", () => {
    const onDelete = vi.fn();
    const onEdit = vi.fn();

    render(
      <WorkoutHistory
        completedWorkouts={mockSessions}
        loadingWorkouts={false}
        onDeleteWorkout={onDelete}
        onEditWorkout={onEdit}
      />
    );

    const editBtns = screen.getAllByRole("button", { name: /edit/i });
    expect(editBtns.length).toBe(2);

    // Click first edit button
    fireEvent.click(editBtns[0]);
    expect(onEdit).toHaveBeenCalledWith(mockSessions[1]);
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
