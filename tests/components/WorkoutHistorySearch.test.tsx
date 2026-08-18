import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutHistory } from "@/app/dashboard/components/WorkoutHistory";
import { WorkoutSession } from "@/app/dashboard/types";

const mockWorkouts: WorkoutSession[] = [
  {
    id: "session-1",
    clientId: "client-1",
    status: "COMPLETED",
    createdAt: "2026-08-10T10:00:00.000Z",
    completedAt: "2026-08-10T11:00:00.000Z",
    notes: "Felt strong on heavy sets",
    loggedByRole: "TRAINER",
    loggedByName: "Coach Jose",
    exercises: [
      {
        id: "ex-1",
        name: "Barbell Bench Press",
        order: 0,
        sets: [
          { id: "set-1", order: 0, weight: 225, reps: 5, notes: "RPE 8" },
          { id: "set-2", order: 1, weight: 245, reps: 3, notes: "PR attempt" },
        ],
      },
      {
        id: "ex-2",
        name: "Incline Dumbbell Press",
        order: 1,
        sets: [{ id: "set-3", order: 0, weight: 80, reps: 10, notes: "" }],
      },
    ],
  },
  {
    id: "session-2",
    clientId: "client-1",
    status: "COMPLETED",
    createdAt: "2026-08-12T10:00:00.000Z",
    completedAt: "2026-08-12T11:00:00.000Z",
    notes: "Leg day focus on quad hypertrophy",
    loggedByRole: "CLIENT",
    loggedByName: "Collin",
    exercises: [
      {
        id: "ex-3",
        name: "Barbell Squat",
        order: 0,
        sets: [
          { id: "set-4", order: 0, weight: 315, reps: 5, notes: "Deep depth" },
          { id: "set-5", order: 1, weight: 335, reps: 3, notes: "Solid" },
        ],
      },
    ],
  },
];

describe("Workout History Multi-Search & Filter Component", () => {
  it("should render all logged sessions initially", () => {
    const { container } = render(
      <WorkoutHistory
        completedWorkouts={mockWorkouts}
        loadingWorkouts={false}
        onDeleteWorkout={vi.fn()}
      />
    );

    const historyList = container.querySelector(".history-list");
    expect(historyList).toBeInTheDocument();
    expect(historyList?.textContent).toContain("Barbell Bench Press");
    expect(historyList?.textContent).toContain("Barbell Squat");
    expect(screen.getByText("👤 Logged by Client (Collin)")).toBeInTheDocument();
  });

  it("should filter to specific workout when searching exercise name", () => {
    const { container } = render(
      <WorkoutHistory
        completedWorkouts={mockWorkouts}
        loadingWorkouts={false}
        onDeleteWorkout={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText("e.g. felt strong, smooth...");
    fireEvent.change(searchInput, { target: { value: "Squat" } });

    const historyList = container.querySelector(".history-list");
    expect(historyList?.textContent).toContain("Barbell Squat");
    expect(historyList?.textContent).not.toContain("Barbell Bench Press");
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
  });

  it("should filter to specific workout when searching notes", () => {
    const { container } = render(
      <WorkoutHistory
        completedWorkouts={mockWorkouts}
        loadingWorkouts={false}
        onDeleteWorkout={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText("e.g. felt strong, smooth...");
    fireEvent.change(searchInput, { target: { value: "Felt strong" } });

    const historyList = container.querySelector(".history-list");
    expect(historyList?.textContent).toContain("Barbell Bench Press");
    expect(historyList?.textContent).not.toContain("Barbell Squat");
  });

  it("should reset search filters when Clear Filters is clicked", () => {
    const { container } = render(
      <WorkoutHistory
        completedWorkouts={mockWorkouts}
        loadingWorkouts={false}
        onDeleteWorkout={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText("e.g. felt strong, smooth...");
    fireEvent.change(searchInput, { target: { value: "Squat" } });

    const historyList = container.querySelector(".history-list");
    expect(historyList?.textContent).not.toContain("Barbell Bench Press");

    const clearBtn = screen.getByText("Clear Filters");
    fireEvent.click(clearBtn);

    expect(historyList?.textContent).toContain("Barbell Bench Press");
    expect(historyList?.textContent).toContain("Barbell Squat");
  });
});
