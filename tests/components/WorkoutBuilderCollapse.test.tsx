import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutBuilder } from "@/app/dashboard/components/WorkoutBuilder";
import { DraftWorkout } from "@/app/dashboard/types";

function TestHarness({ initialWorkout }: { initialWorkout?: DraftWorkout | null }) {
  const [activeWorkout, setActiveWorkout] = useState<DraftWorkout | null>(
    initialWorkout !== undefined
      ? initialWorkout
      : {
          startedAt: new Date().toISOString(),
          notes: "",
          exercises: [
            {
              name: "Barbell Bench Press",
              isBodyweight: false,
              category: "STRENGTH",
              sets: [
                { weight: "185", reps: "10", notes: "", completed: false },
                { weight: "195", reps: "8", notes: "", completed: false },
              ],
            },
            {
              name: "Incline Dumbbell Press",
              isBodyweight: false,
              category: "STRENGTH",
              sets: [
                { weight: "70", reps: "10", notes: "", completed: false },
              ],
            },
          ],
        }
  );
  const [exercisePicker, setExercisePicker] = useState("");

  return (
    <WorkoutBuilder
      activeWorkout={activeWorkout}
      setActiveWorkout={setActiveWorkout}
      plannedWorkouts={[]}
      historyWorkouts={[]}
      exercisePicker={exercisePicker}
      setExercisePicker={setExercisePicker}
      savingWorkout={false}
      savingPlan={false}
      onStartWorkout={vi.fn()}
      onBeginPlannedWorkout={vi.fn()}
      onSaveWorkoutPlan={vi.fn()}
      onCompleteWorkout={vi.fn()}
    />
  );
}

describe("WorkoutBuilder Exercise Collapse & Auto-Completion Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render exercises expanded by default with collapse toggle and complete checkbox", () => {
    render(<TestHarness />);

    // Checkboxes should exist and initially be unchecked ("Mark Complete")
    const chk0 = screen.getByTestId("exercise-complete-checkbox-0") as HTMLInputElement;
    const chk1 = screen.getByTestId("exercise-complete-checkbox-1") as HTMLInputElement;
    expect(chk0.checked).toBe(false);
    expect(chk1.checked).toBe(false);
    expect(screen.getAllByText("Mark Complete").length).toBe(2);

    // Collapse buttons should show "Collapse"
    const collapseBtn0 = screen.getByTestId("exercise-collapse-btn-0");
    expect(collapseBtn0).toHaveTextContent("Collapse");

    // Set inputs should be visible initially
    expect(screen.getByDisplayValue("185")).toBeInTheDocument();
    expect(screen.getByDisplayValue("195")).toBeInTheDocument();
  });

  it("should toggle entire exercise complete when exercise checkbox is clicked", () => {
    render(<TestHarness />);

    const chk0 = screen.getByTestId("exercise-complete-checkbox-0") as HTMLInputElement;
    expect(chk0.checked).toBe(false);

    // Click to mark exercise complete
    fireEvent.click(chk0);

    // Checkbox should now be checked and show "Complete ✓"
    expect(chk0.checked).toBe(true);
    expect(screen.getByText("Complete ✓")).toBeInTheDocument();

    // All set Done buttons for exercise 0 should now say "Done"
    const doneButtons = screen.getAllByTitle("Mark set incomplete");
    expect(doneButtons.length).toBe(2);

    // Clicking the exercise checkbox again unchecks all sets
    fireEvent.click(chk0);
    expect(chk0.checked).toBe(false);
    expect(screen.queryByTitle("Mark set incomplete")).not.toBeInTheDocument();
  });

  it("should automatically mark exercise complete when all individual sets are completed", () => {
    render(<TestHarness />);

    const chk0 = screen.getByTestId("exercise-complete-checkbox-0") as HTMLInputElement;
    expect(chk0.checked).toBe(false);

    // There are 3 total log buttons (2 for ex0, 1 for ex1)
    const logButtons = screen.getAllByTitle("Complete set & start 30s rest timer");
    expect(logButtons.length).toBe(3);

    // Complete Set 1 of Exercise 0
    fireEvent.click(logButtons[0]);
    // Exercise 0 still has 1 incomplete set, so exercise checkbox remains unchecked
    expect(chk0.checked).toBe(false);

    // Complete Set 2 of Exercise 0
    const remainingLogButtons = screen.getAllByTitle("Complete set & start 30s rest timer");
    fireEvent.click(remainingLogButtons[0]);

    // Now all sets of Exercise 0 are complete! Checkbox should be checked automatically!
    expect(chk0.checked).toBe(true);
    expect(screen.getByText("Complete ✓")).toBeInTheDocument();

    // Exercise 1 is still incomplete
    const chk1 = screen.getByTestId("exercise-complete-checkbox-1") as HTMLInputElement;
    expect(chk1.checked).toBe(false);
  });

  it("should automatically uncheck exercise complete when any completed set is unmarked", () => {
    render(<TestHarness />);

    const chk0 = screen.getByTestId("exercise-complete-checkbox-0") as HTMLInputElement;

    // Check all sets via exercise checkbox
    fireEvent.click(chk0);
    expect(chk0.checked).toBe(true);

    // Now uncheck Set 1
    const doneButtons = screen.getAllByTitle("Mark set incomplete");
    fireEvent.click(doneButtons[0]);

    // Exercise complete checkbox should automatically revert to unchecked!
    expect(chk0.checked).toBe(false);
  });

  it("should collapse an exercise, hide sets table and show collapsed summary", () => {
    render(<TestHarness />);

    // Initially expanded: inputs are visible
    expect(screen.getByDisplayValue("185")).toBeInTheDocument();
    expect(screen.queryByTestId("exercise-collapsed-summary-0")).not.toBeInTheDocument();

    // Click Collapse on Exercise 0
    const collapseBtn0 = screen.getByTestId("exercise-collapse-btn-0");
    fireEvent.click(collapseBtn0);

    // Sets inputs for exercise 0 are now hidden
    expect(screen.queryByDisplayValue("185")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("195")).not.toBeInTheDocument();

    // Collapsed summary should appear with metrics and completion progress
    const summary = screen.getByTestId("exercise-collapsed-summary-0");
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent("0/2 Sets Completed");
    expect(summary).toHaveTextContent("185 lbs × 10 • 195 lbs × 8");
    expect(summary).toHaveTextContent("Tap to expand");

    // Exercise 1 is still expanded
    expect(screen.getByDisplayValue("70")).toBeInTheDocument();

    // Button label changed to "Expand"
    expect(collapseBtn0).toHaveTextContent("Expand");
  });

  it("should expand exercise when Expand button or collapsed summary is clicked", () => {
    render(<TestHarness />);

    const collapseBtn0 = screen.getByTestId("exercise-collapse-btn-0");
    fireEvent.click(collapseBtn0); // Collapse it

    // Tapping the summary bar expands it again
    const summary = screen.getByTestId("exercise-collapsed-summary-0");
    fireEvent.click(summary);

    // Inputs are visible again
    expect(screen.getByDisplayValue("185")).toBeInTheDocument();
    expect(collapseBtn0).toHaveTextContent("Collapse");
  });

  it("should support Collapse All and Expand All shortcuts", () => {
    render(<TestHarness />);

    const collapseAllBtn = screen.getByTestId("collapse-all-exercises-btn");
    const expandAllBtn = screen.getByTestId("expand-all-exercises-btn");

    // Collapse all
    fireEvent.click(collapseAllBtn);

    expect(screen.getByTestId("exercise-collapsed-summary-0")).toBeInTheDocument();
    expect(screen.getByTestId("exercise-collapsed-summary-1")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("185")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("70")).not.toBeInTheDocument();

    // Expand all
    fireEvent.click(expandAllBtn);

    expect(screen.queryByTestId("exercise-collapsed-summary-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("exercise-collapsed-summary-1")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("185")).toBeInTheDocument();
    expect(screen.getByDisplayValue("70")).toBeInTheDocument();
  });
});
