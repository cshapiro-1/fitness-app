import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RemoveAssignedWorkoutsModal } from "@/app/dashboard/components/RemoveAssignedWorkoutsModal";

describe("RemoveAssignedWorkoutsModal Component Tests", () => {
  it("should render warning modal, safety reassurance, and execute delete on confirmation", async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, count: 6 }),
    } as any);

    render(
      <RemoveAssignedWorkoutsModal
        isOpen={true}
        onClose={handleClose}
        clientId="client-1"
        clientName="Alex Athlete"
        programName="6-Week Hypertrophy"
        assignedCount={6}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText("Remove Assigned Workouts?")).toBeInTheDocument();
    expect(screen.getAllByText(/Alex Athlete/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Your history is safe/)).toBeInTheDocument();

    // Click Confirm
    const confirmBtn = screen.getByText("Yes, Remove All Assigned");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/workouts?clientId=client-1"),
        expect.objectContaining({ method: "DELETE" })
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
