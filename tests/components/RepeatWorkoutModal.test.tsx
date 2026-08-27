import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RepeatWorkoutModal } from "@/app/dashboard/components/RepeatWorkoutModal";

describe("RepeatWorkoutModal Component", () => {
  const sampleWorkout = {
    id: "w-1",
    completedAt: "2026-08-24T12:00:00Z",
    notes: "Heavy Upper Day",
    exercises: [
      {
        name: "Barbell Bench Press",
        category: "STRENGTH",
        isBodyweight: false,
        sets: [
          { weight: 185, reps: 6, notes: "" },
          { weight: 185, reps: 6, notes: "" },
        ],
      },
      {
        name: "Barbell Squat",
        category: "STRENGTH",
        isBodyweight: false,
        sets: [
          { weight: 225, reps: 5, notes: "" },
        ],
      },
      {
        name: "Back Hyperextensions",
        category: "BODYWEIGHT",
        isBodyweight: true,
        sets: [
          { weight: 0, reps: 15, notes: "" },
        ],
      },
    ],
  };

  it("should render correctly with calculated progressive overload default", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <RepeatWorkoutModal
        isOpen={true}
        workout={sampleWorkout}
        athleteName="Collin"
        onClose={onClose}
        onConfirmRepeat={onConfirm}
      />
    );

    expect(screen.getByText(/Repeat Session/i)).toBeDefined();
    expect(screen.getAllByText(/Progressive Overload/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Same Weights/i)).toBeDefined();
    expect(screen.getByText(/Custom Step/i)).toBeDefined();

    // Confirm click triggers onConfirmRepeat with overload
    const applyBtn = screen.getByRole("button", { name: /Apply & Start Workout/i });
    fireEvent.click(applyBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const repeatedExercises = onConfirm.mock.calls[0][0];
    const mode = onConfirm.mock.calls[0][1];

    expect(mode).toBe("overload");
    // Bench Press should be increased (+5 lbs from 185 -> 190)
    expect(repeatedExercises[0].sets[0].weight).toBe("190");
    // Squat should be increased (+10 lbs from 225 -> 235)
    expect(repeatedExercises[1].sets[0].weight).toBe("235");
    // Bodyweight should remain 0
    expect(repeatedExercises[2].sets[0].weight).toBe("0");
  });

  it("should apply same weights when 'Same Weights' tab is selected", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <RepeatWorkoutModal
        isOpen={true}
        workout={sampleWorkout}
        athleteName="Collin"
        onClose={onClose}
        onConfirmRepeat={onConfirm}
      />
    );

    const sameWeightTab = screen.getByRole("button", { name: /Same Weights/i });
    fireEvent.click(sameWeightTab);

    const applyBtn = screen.getByRole("button", { name: /Apply & Start Workout/i });
    fireEvent.click(applyBtn);

    const repeatedExercises = onConfirm.mock.calls[0][0];
    const mode = onConfirm.mock.calls[0][1];

    expect(mode).toBe("same");
    expect(repeatedExercises[0].sets[0].weight).toBe("185");
    expect(repeatedExercises[1].sets[0].weight).toBe("225");
  });
});
