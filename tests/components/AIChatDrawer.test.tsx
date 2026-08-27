import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIChatDrawer } from "@/app/dashboard/components/AIChatDrawer";

describe("AIChatDrawer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        answer: "Sarah's Barbell Bench Press has progressed to 225 lbs with +9.7% increase.",
        metricsFound: { totalWorkoutsAnalyzed: 2, totalVolume: "4,200 lbs" },
      }),
    } as any);
  });

  it("should render trainer AI assistant drawer with athlete selector", () => {
    const clients = [
      { id: "c1", name: "Sarah Connor", email: "sarah@fit.com", fitnessGoals: "Strength", workouts: [] },
      { id: "c2", name: "John Wick", email: "john@fit.com", fitnessGoals: "Conditioning", workouts: [] },
    ];

    render(
      <AIChatDrawer
        role="TRAINER"
        isOpen={true}
        onClose={vi.fn()}
        clients={clients as any}
        selectedClient={clients[0] as any}
      />
    );

    expect(screen.getByText("STRKYR Co-Pilot")).toBeInTheDocument();
    expect(screen.getByText("Action AI")).toBeInTheDocument();
    expect(screen.getByText("Context:")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sarah Connor")).toBeInTheDocument();
  });

  it("should send prompt query and render AI assistant response", async () => {
    render(
      <AIChatDrawer
        role="CLIENT"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Ask about your workouts/i);
    fireEvent.change(input, { target: { value: "How is my bench progressing?" } });

    const form = input.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/chat",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ query: "How is my bench progressing?" }),
        })
      );
      expect(screen.getByText(/Sarah's Barbell Bench Press has progressed to 225 lbs/)).toBeInTheDocument();
    });
  });
});
