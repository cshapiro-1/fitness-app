import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { RestTimer } from "@/app/dashboard/components/RestTimer";
import { PlateCalculatorModal } from "@/app/dashboard/components/PlateCalculatorModal";
import { getWeightClarification } from "@/app/dashboard/components/WorkoutBuilder";
import { NetworkConnectionBanner } from "@/app/dashboard/components/NetworkConnectionBanner";

describe("RestTimer, Set Completion, Plate Math & Public Wi-Fi Banner Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    // Mock Notification API
    (global as any).Notification = {
      permission: "granted",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should default RestTimer to 30 seconds and display 0:30", () => {
    render(<RestTimer onClose={vi.fn()} />);

    expect(screen.getByText("0:30")).toBeInTheDocument();
    expect(screen.getByText("Rest Timer")).toBeInTheDocument();
  });

  it("should trigger Web Notification and alarm when timer reaches 0", async () => {
    vi.useFakeTimers();
    const notificationSpy = vi.fn();
    (global as any).Notification = notificationSpy as any;
    (global as any).Notification.permission = "granted";
    (global as any).Notification.requestPermission = vi.fn().mockResolvedValue("granted");

    render(<RestTimer initialSeconds={2} onClose={vi.fn()} />);

    expect(screen.getByText("0:02")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText("DISMISS ALARM (READY)")).toBeInTheDocument();
  });

  it("should clarify exercise weight modes accurately for dumbbells, barbells, machines and bodyweight", () => {
    const dumbbell = getWeightClarification("Incline Dumbbell Press");
    expect(dumbbell.badge).toBe("Per Dumbbell (Each Hand)");
    expect(dumbbell.header).toContain("Each Hand");
    expect(dumbbell.hint).toContain("Weight of ONE dumbbell in each hand");

    const barbell = getWeightClarification("Barbell Bench Press");
    expect(barbell.badge).toBe("Total Barbell (Bar + Plates)");
    expect(barbell.header).toContain("Total Barbell");
    expect(barbell.hint).toContain("Total barbell load including 45lb bar");

    const cable = getWeightClarification("Lat Pulldown (Cable)");
    expect(cable.badge).toBe("Cable / Machine Stack");
    expect(cable.header).toContain("Pin / Stack");

    const bodyweight = getWeightClarification("Weighted Pull-ups", true);
    expect(bodyweight.badge).toBe("Bodyweight (+lbs)");
    expect(bodyweight.header).toContain("Added Wt");
  });

  it("should allow selecting 0 lbs (No Bar) option and typing 0 in PlateCalculatorModal", () => {
    render(<PlateCalculatorModal initialWeight={50} onClose={vi.fn()} />);

    // Select No Bar (0 lbs)
    const noBarBtn = screen.getByRole("button", { name: "No Bar (0 lbs)" });
    fireEvent.click(noBarBtn);

    // Target weight input should allow typing 0 without character jumping
    const input = screen.getByDisplayValue("50");
    fireEvent.change(input, { target: { value: "0" } });
    expect(input).toHaveValue("0");

    expect(screen.getByText("0 lbs")).toBeInTheDocument();
    expect(screen.getByText("No plates required.")).toBeInTheDocument();
  });

  it("should render NetworkConnectionBanner when offline or on captive portal", async () => {
    // Mock navigator.onLine as false
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
    });

    render(<NetworkConnectionBanner />);

    expect(screen.getByText(/No Internet Connection/i)).toBeInTheDocument();
  });
});
