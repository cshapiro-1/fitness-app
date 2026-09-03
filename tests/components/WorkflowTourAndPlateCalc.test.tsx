import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardTourModal } from "@/app/dashboard/components/DashboardTourModal";
import { PlateCalculatorModal } from "@/app/dashboard/components/PlateCalculatorModal";
import { RestTimer } from "@/app/dashboard/components/RestTimer";

describe("Integrated UI Component Workflow Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = `
      <div data-tour="studio-tabs" style="width: 500px; height: 50px;"></div>
      <div data-tour="client-sidebar" style="width: 250px; height: 400px;"></div>
      <div data-tour="ai-copilot" style="width: 100px; height: 40px;"></div>
      <div data-tour="workout-builder" style="width: 600px; height: 500px;"></div>
      <div data-tour="header-menu" style="width: 40px; height: 40px;"></div>
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

  it("should run through the spotlight tour, open plate calculator with 0lb bar, and trigger rest timer", () => {
    // 1. Tour Workflow
    const onCloseTour = vi.fn();
    const { unmount: unmountTour } = render(
      <DashboardTourModal role="TRAINER" isOpen={true} onClose={onCloseTour} />
    );

    expect(screen.getByText(/Navigation Ribbon & Studio Tabs/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next \(1\/5\)/i }));
    expect(screen.getByText(/Client Management & 1-Click Invites/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next \(2\/5\)/i }));
    expect(screen.getByText(/AI Performance Co-Pilot/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next \(3\/5\)/i }));
    expect(screen.getByText(/Interactive Logger & Weight Modes/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next \(4\/5\)/i }));
    expect(screen.getByText(/Plate Math, Exports & Profile/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Finish & Start/i }));

    expect(onCloseTour).toHaveBeenCalled();
    expect(localStorage.getItem("strkyr_tour_seen_trainer")).toBe("true");
    unmountTour();

    // 2. Plate Calculator Workflow (0 lbs option)
    const onClosePlate = vi.fn();
    const { unmount: unmountPlate } = render(
      <PlateCalculatorModal onClose={onClosePlate} />
    );

    expect(screen.getByText(/Barbell & Plate Calculator/i)).toBeInTheDocument();
    const noBarBtn = screen.getByText("No Bar (0 lbs)");
    fireEvent.click(noBarBtn);

    const input = screen.getByDisplayValue("135");
    fireEvent.change(input, { target: { value: "90" } });
    expect(screen.getByText("45 lbs")).toBeInTheDocument(); // 90 total / 2 = 45 per side
    unmountPlate();

    // 3. Rest Timer Workflow (defaults to 30s)
    const onCloseTimer = vi.fn();
    render(<RestTimer initialSeconds={30} onClose={onCloseTimer} />);
    expect(screen.getByText("0:30")).toBeInTheDocument();
    expect(screen.getByText("Rest Timer")).toBeInTheDocument();
  });
});
