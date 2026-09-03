import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProgramPlanner } from "@/app/dashboard/components/ProgramPlanner";

describe("ProgramPlanner Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        programs: [
          {
            id: "prog-1",
            name: "Hypertrophy Master Template",
            durationWeeks: 8,
            deloadFrequency: 4,
            restDaysBetween: 1,
            status: "DRAFT",
            progressionType: "LINEAR_OVERLOAD",
            progressionRate: 2.5,
            workoutTemplates: [
              {
                id: "wt-1",
                name: "Day 1 Push",
                cadence: "WEEKLY",
                order: 0,
                exercises: [
                  {
                    id: "ex-1",
                    name: "Barbell Bench Press",
                    targetSets: 4,
                    targetReps: "6-8",
                    suggestedWeight: 205,
                    supersetGroup: null,
                    restSeconds: 120,
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as any);
  });

  it("should render programs list, top filter tabs with counts, and allow opening creator", async () => {
    render(
      <ProgramPlanner
        clientId="client-1"
        clientsList={[{ id: "client-1", name: "Alex Athlete" }]}
        isTrainer={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Hypertrophy Master Template")).toBeInTheDocument();
    });

    expect(screen.getByText(/All Programs \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Templates \(1\)/)).toBeInTheDocument();

    // Click Create New Program
    fireEvent.click(screen.getByText("Create New Program"));
    expect(screen.getByText("Build New Training Program")).toBeInTheDocument();
    expect(screen.getByText(/Weekly Workout Splits & Exercises \(3 Days\)/)).toBeInTheDocument();

    // Verify column headers per day
    expect(screen.getAllByText("Exercise Name").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sets").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reps").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Weight").length).toBeGreaterThan(0);
  });

  it("should allow editing arbitrary duration weeks, deload frequency, and rest days between workouts", async () => {
    const { container } = render(
      <ProgramPlanner
        clientId="client-1"
        clientsList={[{ id: "client-1", name: "Alex Athlete" }]}
        isTrainer={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Hypertrophy Master Template")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create New Program"));

    // Find duration, deload, and rest days number inputs
    const numberInputs = container.querySelectorAll<HTMLInputElement>('input[type="number"]');
    expect(numberInputs.length).toBeGreaterThanOrEqual(3);

    const durationInput = numberInputs[0];
    fireEvent.change(durationInput, { target: { value: "10" } });
    expect(durationInput.value).toBe("10");

    const deloadInput = numberInputs[1];
    fireEvent.change(deloadInput, { target: { value: "5" } });
    expect(deloadInput.value).toBe("5");

    const restDaysInput = numberInputs[2];
    fireEvent.change(restDaysInput, { target: { value: "2" } });
    expect(restDaysInput.value).toBe("2");
  });

  it("should render assign modal with rest days configuration and live schedule preview", async () => {
    render(
      <ProgramPlanner
        clientId="client-1"
        clientsList={[{ id: "client-1", name: "Alex Athlete" }]}
        isTrainer={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Hypertrophy Master Template")).toBeInTheDocument();
    });

    // Click Assign to Client
    fireEvent.click(screen.getByText("Assign to Client"));

    expect(screen.getByText("Assign Program to Client")).toBeInTheDocument();
    expect(screen.getByText("Rest Days Between Workouts")).toBeInTheDocument();
    expect(screen.getByText("Week 1 Schedule Preview")).toBeInTheDocument();
    expect(screen.getByText(/All 8 periodized workouts will immediately appear/)).toBeInTheDocument();
  });

  it("should render completed programs with celebration badge and Reassign button", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        programs: [
          {
            id: "prog-completed",
            name: "Powerlifting Peak 12W",
            durationWeeks: 12,
            status: "COMPLETED",
            progressionType: "LINEAR_OVERLOAD",
            workoutTemplates: [],
            workoutSessions: [
              { id: "ws-1", status: "COMPLETED", programWeek: 1, programDay: 1 },
              { id: "ws-2", status: "COMPLETED", programWeek: 1, programDay: 2 },
            ],
            stats: {
              totalWorkouts: 2,
              completedWorkouts: 2,
              remainingWorkouts: 0,
              completionPercentage: 100,
            },
          },
        ],
      }),
    } as any);

    render(
      <ProgramPlanner
        clientId="client-1"
        clientsList={[{ id: "client-1", name: "Alex Athlete" }]}
        isTrainer={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Powerlifting Peak 12W")).toBeInTheDocument();
    });

    expect(screen.getByText("Program Completed (100% Finished)")).toBeInTheDocument();
    expect(screen.getByText("Reassign Program")).toBeInTheDocument();

    // Click Reassign Program opens the assignment modal
    fireEvent.click(screen.getByText("Reassign Program"));
    expect(screen.getByText("Assign Program to Client")).toBeInTheDocument();
  });

  it("should render active program progress bar and expand schedule breakdown", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        programs: [
          {
            id: "prog-active",
            name: "Active 6W Hypertrophy",
            durationWeeks: 6,
            status: "IN_PROGRESS",
            progressionType: "LINEAR_OVERLOAD",
            workoutTemplates: [],
            workoutSessions: [
              { id: "ws-1", status: "COMPLETED", programWeek: 1, programDay: 1, startedAt: "2026-09-01T09:00:00Z" },
              { id: "ws-2", status: "PLANNED", programWeek: 1, programDay: 2, startedAt: "2026-09-03T09:00:00Z" },
            ],
            stats: {
              totalWorkouts: 2,
              completedWorkouts: 1,
              remainingWorkouts: 1,
              completionPercentage: 50,
            },
          },
        ],
      }),
    } as any);

    render(
      <ProgramPlanner
        clientId="client-1"
        clientsList={[{ id: "client-1", name: "Alex Athlete" }]}
        isTrainer={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Active 6W Hypertrophy")).toBeInTheDocument();
    });

    expect(screen.getByText("Program Progress")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 (50%)")).toBeInTheDocument();
    expect(screen.getByText("View Schedule Breakdown")).toBeInTheDocument();

    // Expand schedule breakdown
    fireEvent.click(screen.getByText("View Schedule Breakdown"));
    expect(screen.getByText("Hide Schedule Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Week 1 · Day 1")).toBeInTheDocument();
    expect(screen.getByText("Week 1 · Day 2")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("should provide full access to the 120+ exercise library and autocomplete in the program builder", async () => {
    render(
      <ProgramPlanner
        clientId="client-1"
        clientsList={[{ id: "client-1", name: "Alex Athlete" }]}
        isTrainer={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Hypertrophy Master Template")).toBeInTheDocument();
    });

    // Open Program Creator
    fireEvent.click(screen.getByText("Create New Program"));
    expect(screen.getByText("Build New Training Program")).toBeInTheDocument();

    // Verify "Browse Exercise Library" button is present on training days
    const browseButtons = screen.getAllByText(/Browse Exercise Library \(120\+\)/i);
    expect(browseButtons.length).toBeGreaterThan(0);

    // Open Exercise Library Modal for Day 1
    fireEvent.click(browseButtons[0]);
    expect(screen.getByText("120+ Exercise Library")).toBeInTheDocument();
    expect(screen.getByText(/Adding to:/i)).toBeInTheDocument();

    // Verify category filter tabs
    expect(screen.getByRole("button", { name: "Chest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Legs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();

    // Filter by Chest exercises
    fireEvent.click(screen.getByRole("button", { name: "Chest" }));
    expect(screen.getByText(/Showing \d+ Chest Exercises/i)).toBeInTheDocument();

    // Search for a specific exercise (e.g. "Incline Dumbbell Press")
    const searchInput = screen.getByPlaceholderText(/Search exercise by name, equipment/i);
    fireEvent.change(searchInput, { target: { value: "Incline Dumbbell Press" } });
    expect(screen.getByText("Incline Dumbbell Press")).toBeInTheDocument();

    // Click "Add to Day"
    const addButtons = screen.getAllByText(/Add to Day/i);
    fireEvent.click(addButtons[0]);

    // Verify button switches to "Added" feedback
    expect(screen.getByText(/Added/i)).toBeInTheDocument();

    // Close Exercise Library Modal
    fireEvent.click(screen.getByText("Done Adding"));
    expect(screen.queryByText("120+ Exercise Library")).not.toBeInTheDocument();

    // Verify the exercise was appended to Day 1 with weight clarification badge
    expect(screen.getAllByDisplayValue("Incline Dumbbell Press").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Per Dumbbell/i).length).toBeGreaterThan(0);
  });
});

