import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardTourModal } from "@/app/dashboard/components/DashboardTourModal";

describe("DashboardTourModal Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render trainer tour with all tabs and allow step-by-step navigation", () => {
    const handleClose = vi.fn();
    render(<DashboardTourModal role="TRAINER" isOpen={true} onClose={handleClose} />);

    // Step 1: Builder
    expect(screen.getByText("Workout Builder & AI Programming")).toBeInTheDocument();
    expect(screen.getByText("Design & Assign Workouts with AI Co-Pilot")).toBeInTheDocument();

    // Advance to Step 2: Roster
    fireEvent.click(screen.getByText("Next Feature (1/4)"));
    expect(screen.getByText("Client Roster & Instant Invites")).toBeInTheDocument();

    // Advance to Step 3: History
    fireEvent.click(screen.getByText("Next Feature (2/4)"));
    expect(screen.getByText("Workout History & Session Replays")).toBeInTheDocument();

    // Advance to Step 4: Analytics
    fireEvent.click(screen.getByText("Next Feature (3/4)"));
    expect(screen.getByText("Kinematic Analytics & AI Insights")).toBeInTheDocument();

    // Finish Tour
    fireEvent.click(screen.getByText("Finish Tour & Start Training"));
    expect(handleClose).toHaveBeenCalled();
    expect(localStorage.getItem("strkyr_tour_seen_trainer")).toBe("true");
  });

  it("should render client athlete tour with appropriate athlete tabs", () => {
    const handleClose = vi.fn();
    render(<DashboardTourModal role="CLIENT" isOpen={true} onClose={handleClose} />);

    // Step 1: Assigned Workouts
    expect(screen.getByText("Assigned Workouts")).toBeInTheDocument();
    expect(screen.getByText("Execute Coach-Assigned Workouts")).toBeInTheDocument();

    // Advance to Step 2: In-Gym Logger
    fireEvent.click(screen.getByText("Next Feature (1/4)"));
    expect(screen.getByText("In-Gym Set Logger & Rest Timer")).toBeInTheDocument();

    // Finish
    fireEvent.click(screen.getByText("Next Feature (2/4)"));
    fireEvent.click(screen.getByText("Next Feature (3/4)"));
    fireEvent.click(screen.getByText("Finish Tour & Start Training"));
    expect(handleClose).toHaveBeenCalled();
    expect(localStorage.getItem("strkyr_tour_seen_client")).toBe("true");
  });
});
