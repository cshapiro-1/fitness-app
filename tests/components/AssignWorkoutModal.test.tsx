import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssignWorkoutModal } from "@/app/dashboard/components/AssignWorkoutModal";
import { Client, WorkoutSession } from "@/app/dashboard/types";

const mockClients: Client[] = [
  { id: "client-1", name: "Sarah Connor", createdAt: "2026-08-01T00:00:00.000Z" },
  { id: "client-2", name: "John Wick", createdAt: "2026-08-02T00:00:00.000Z" },
];

const mockWorkout: WorkoutSession = {
  id: "past-session-101",
  clientId: "client-1",
  status: "COMPLETED",
  createdAt: "2026-08-15T10:00:00.000Z",
  completedAt: "2026-08-15T11:00:00.000Z",
  notes: "Heavy leg day PR session",
  exercises: [
    {
      id: "ex-1",
      name: "Barbell Back Squat",
      order: 0,
      sets: [
        { id: "s-1", order: 0, weight: 315, reps: 5, notes: "" },
        { id: "s-2", order: 1, weight: 335, reps: 3, notes: "Top set" },
      ],
    },
  ],
};

describe("AssignWorkoutModal Component Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render modal with target client selector and exercise preview", () => {
    render(
      <AssignWorkoutModal
        isOpen={true}
        workout={mockWorkout}
        clients={mockClients}
        selectedClientId="client-1"
        onClose={vi.fn()}
        onAssigned={vi.fn()}
      />
    );

    expect(screen.getByText("Assign Workout to Client")).toBeDefined();
    expect(screen.getByText("Sarah Connor")).toBeDefined();
    expect(screen.getByText("John Wick")).toBeDefined();
    expect(screen.getByText(/Barbell Back Squat/)).toBeDefined();
    expect(screen.getByText(/315×5/)).toBeDefined();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <AssignWorkoutModal
        isOpen={false}
        workout={mockWorkout}
        clients={mockClients}
        selectedClientId="client-1"
        onClose={vi.fn()}
        onAssigned={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should submit POST request to /api/workouts with status PLANNED and trigger onAssigned without touching active session", async () => {
    const onAssignedMock = vi.fn();
    const onCloseMock = vi.fn();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "new-planned-workout-999",
        clientId: "client-2",
        status: "PLANNED",
        notes: "Heavy leg day PR session (Assigned from Aug 15, 2026)",
        exercises: mockWorkout.exercises,
      }),
    });
    global.fetch = fetchMock;

    render(
      <AssignWorkoutModal
        isOpen={true}
        workout={mockWorkout}
        clients={mockClients}
        selectedClientId="client-1"
        onClose={onCloseMock}
        onAssigned={onAssignedMock}
      />
    );

    // Switch client to John Wick
    const clientSelect = screen.getByRole("combobox");
    fireEvent.change(clientSelect, { target: { value: "client-2" } });

    // Click Tomorrow quick preset
    const tomorrowBtn = screen.getByText("Tomorrow");
    fireEvent.click(tomorrowBtn);

    // Submit assignment
    const assignBtn = screen.getByRole("button", { name: /Assign to John Wick/i });
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/workouts",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"status":"PLANNED"'),
        })
      );
      expect(onAssignedMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: "new-planned-workout-999" }),
        "client-2"
      );
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
