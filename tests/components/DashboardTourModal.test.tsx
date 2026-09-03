import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardTourModal } from "@/app/dashboard/components/DashboardTourModal";

describe("DashboardTourModal Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Provide dummy mock elements for tour query selectors
    document.body.innerHTML = `
      <div data-tour="studio-tabs" style="width: 500px; height: 50px;"></div>
      <div data-tour="client-sidebar" style="width: 250px; height: 400px;"></div>
      <div data-tour="ai-copilot" style="width: 100px; height: 40px;"></div>
      <div data-tour="workout-builder" style="width: 600px; height: 500px;"></div>
      <div data-tour="header-menu" style="width: 40px; height: 40px;"></div>
      <div data-tour="client-timer-bar" style="width: 400px; height: 40px;"></div>
      <div data-tour="client-workouts" style="width: 400px; height: 300px;"></div>
    `;

    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      left: 100,
      bottom: 200,
      right: 300,
      width: 200,
      height: 100,
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("should render trainer interactive UI tour and allow step-by-step navigation", () => {
    const handleClose = vi.fn();
    render(<DashboardTourModal role="TRAINER" isOpen={true} onClose={handleClose} />);

    // Step 1: Studio Tabs
    expect(screen.getByText(/Navigation Ribbon & Studio Tabs/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 5 • Studio Workspaces/i)).toBeInTheDocument();

    // Advance to Step 2: Client Sidebar
    fireEvent.click(screen.getByRole("button", { name: /Next \(1\/5\)/i }));
    expect(screen.getByText(/Client Management & 1-Click Invites/i)).toBeInTheDocument();

    // Advance to Step 3: AI Co-Pilot
    fireEvent.click(screen.getByRole("button", { name: /Next \(2\/5\)/i }));
    expect(screen.getByText(/AI Performance Co-Pilot & Importer/i)).toBeInTheDocument();

    // Advance to Step 4: Workout Builder
    fireEvent.click(screen.getByRole("button", { name: /Next \(3\/5\)/i }));
    expect(screen.getByText(/Interactive Logger & Weight Modes/i)).toBeInTheDocument();

    // Advance to Step 5: Tools & Settings
    fireEvent.click(screen.getByRole("button", { name: /Next \(4\/5\)/i }));
    expect(screen.getByText(/Plate Math, Exports & Profile/i)).toBeInTheDocument();

    // Finish Tour
    fireEvent.click(screen.getByRole("button", { name: /Finish & Start/i }));
    expect(handleClose).toHaveBeenCalled();
    expect(localStorage.getItem("strkyr_tour_seen_trainer")).toBe("true");
  });

  it("should render client athlete tour and handle skip", () => {
    const handleClose = vi.fn();
    render(<DashboardTourModal role="CLIENT" isOpen={true} onClose={handleClose} />);

    // Step 1: Client tabs
    expect(screen.getByText(/Your Training Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 5 • Athlete Portal/i)).toBeInTheDocument();

    // Advance to Step 2: Gym Rest Timer
    fireEvent.click(screen.getByRole("button", { name: /Next \(1\/5\)/i }));
    expect(screen.getByText(/Gym Rest Countdown Timer/i)).toBeInTheDocument();

    // Skip Tour
    fireEvent.click(screen.getByTitle("Skip Tour (Esc)"));
    expect(handleClose).toHaveBeenCalled();
    expect(localStorage.getItem("strkyr_tour_seen_client")).toBe("true");
  });

  it("should support keyboard navigation (Escape to close, ArrowRight for next)", () => {
    const handleClose = vi.fn();
    render(<DashboardTourModal role="TRAINER" isOpen={true} onClose={handleClose} />);

    // ArrowRight to Step 2
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(/Client Management & 1-Click Invites/i)).toBeInTheDocument();

    // ArrowLeft back to Step 1
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText(/Navigation Ribbon & Studio Tabs/i)).toBeInTheDocument();

    // Escape to close
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });
});
