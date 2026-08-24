import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditAssignedWorkoutModal } from "@/app/dashboard/components/EditAssignedWorkoutModal";

const mockWorkout = {
  id: "planned-wk-123",
  status: "PLANNED",
  notes: "Focus on form and pause at bottom",
  exercises: [
    {
      id: "ex-1",
      name: "Barbell Squat",
      category: "STRENGTH",
      isBodyweight: false,
      sets: [
        { id: "s-1", weight: 225, reps: 8, notes: "" },
        { id: "s-2", weight: 245, reps: 6, notes: "RPE 8" },
      ],
    },
  ],
};

describe("EditAssignedWorkoutModal Component Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render correctly when open with initial exercises, sets and notes", () => {
    render(
      <EditAssignedWorkoutModal
        isOpen={true}
        workout={mockWorkout}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getByText("Edit Planned Routine")).toBeDefined();
    expect(screen.getByDisplayValue("Focus on form and pause at bottom")).toBeDefined();
    expect(screen.getByDisplayValue("Barbell Squat")).toBeDefined();
    expect(screen.getByDisplayValue("225")).toBeDefined();
    expect(screen.getByDisplayValue("245")).toBeDefined();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <EditAssignedWorkoutModal
        isOpen={false}
        workout={mockWorkout}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should allow adding a new exercise to the routine", () => {
    render(
      <EditAssignedWorkoutModal
        isOpen={true}
        workout={mockWorkout}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    const addExBtn = screen.getByText("Add Exercise");
    fireEvent.click(addExBtn);

    expect(screen.getByDisplayValue("Barbell Bench Press")).toBeDefined();
    expect(screen.getByText("Exercises (2)")).toBeDefined();
  });

  it("should send PATCH request with updated exercises on Save Changes", async () => {
    const onSavedMock = vi.fn();
    const onCloseMock = vi.fn();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockWorkout,
        notes: "Updated coach cues",
      }),
    });
    global.fetch = fetchMock;

    render(
      <EditAssignedWorkoutModal
        isOpen={true}
        workout={mockWorkout}
        onClose={onCloseMock}
        onSaved={onSavedMock}
      />
    );

    const notesInput = screen.getByDisplayValue("Focus on form and pause at bottom");
    fireEvent.change(notesInput, { target: { value: "Updated coach cues" } });

    const saveBtn = screen.getByText("Save Changes");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/workouts/planned-wk-123",
        expect.objectContaining({
          method: "PATCH",
        })
      );
      expect(onSavedMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it("should send status: COMPLETED when clicking Log & Complete", async () => {
    const onSavedMock = vi.fn();
    const onCloseMock = vi.fn();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockWorkout,
        status: "COMPLETED",
      }),
    });
    global.fetch = fetchMock;

    render(
      <EditAssignedWorkoutModal
        isOpen={true}
        workout={mockWorkout}
        onClose={onCloseMock}
        onSaved={onSavedMock}
      />
    );

    const completeBtn = screen.getByText("✓ Log & Complete");
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/workouts/planned-wk-123",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"status":"COMPLETED"'),
        })
      );
      expect(onSavedMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
