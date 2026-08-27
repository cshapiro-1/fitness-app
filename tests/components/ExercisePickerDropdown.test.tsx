import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExercisePickerDropdown } from "@/app/dashboard/components/ExercisePickerDropdown";

describe("ExercisePickerDropdown Component", () => {
  it("should render input with current value and filter exercises on type", () => {
    const onSelect = vi.fn();
    render(
      <ExercisePickerDropdown
        value="Barbell Bench Press"
        onSelectExercise={onSelect}
      />
    );

    const input = screen.getByDisplayValue("Barbell Bench Press");
    expect(input).toBeDefined();

    // Focus input to open dropdown
    fireEvent.focus(input);

    expect(screen.getByRole("button", { name: "Chest" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Back" })).toBeDefined();
  });

  it("should select exercise from list and trigger callback", () => {
    const onSelect = vi.fn();
    render(
      <ExercisePickerDropdown
        value=""
        onSelectExercise={onSelect}
      />
    );

    const input = screen.getByPlaceholderText(/Select or search/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Squat" } });

    const squatOption = screen.getByText("Barbell Back Squat");
    fireEvent.click(squatOption);

    expect(onSelect).toHaveBeenCalledWith("Barbell Back Squat", false, "STRENGTH");
  });
});
