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
  });

  it("should allow editing arbitrary duration weeks and deload frequency", async () => {
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

    // Find duration and deload number inputs
    const numberInputs = container.querySelectorAll<HTMLInputElement>('input[type="number"]');
    expect(numberInputs.length).toBeGreaterThanOrEqual(2);

    const durationInput = numberInputs[0];
    fireEvent.change(durationInput, { target: { value: "10" } });
    expect(durationInput.value).toBe("10");

    const deloadInput = numberInputs[1];
    fireEvent.change(deloadInput, { target: { value: "5" } });
    expect(deloadInput.value).toBe("5");
  });
});
