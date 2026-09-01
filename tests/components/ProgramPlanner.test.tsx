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
});
