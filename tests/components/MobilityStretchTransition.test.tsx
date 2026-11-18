import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MobilityTab } from "@/app/dashboard/components/MobilityTab";

describe("MobilityTab Stretch Transition Buffer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    // Mock AudioContext class cleanly
    class MockAudioContext {
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          frequency: { setValueAtTime: vi.fn() },
        };
      }
      createGain() {
        return {
          connect: vi.fn(),
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
        };
      }
    }
    window.AudioContext = MockAudioContext as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders the transition buffer settings with 0s, 5s, and 10s options", () => {
    render(<MobilityTab />);

    expect(screen.getByText("Get Ready Transition Buffer")).toBeInTheDocument();
    expect(
      screen.getByText("Gives you 5 seconds between stretches to get into position before the timer begins.")
    ).toBeInTheDocument();

    const instantOpt = screen.getByTestId("transition-option-0");
    const fiveSecOpt = screen.getByTestId("transition-option-5");
    const tenSecOpt = screen.getByTestId("transition-option-10");

    expect(instantOpt).toBeInTheDocument();
    expect(fiveSecOpt).toBeInTheDocument();
    expect(tenSecOpt).toBeInTheDocument();
  });

  it("allows switching transition buffer settings and stores to localStorage", () => {
    render(<MobilityTab />);

    const instantOpt = screen.getByTestId("transition-option-0");
    fireEvent.click(instantOpt);
    expect(localStorage.getItem("strkyr_stretch_transition_seconds")).toBe("0");

    const tenSecOpt = screen.getByTestId("transition-option-10");
    fireEvent.click(tenSecOpt);
    expect(localStorage.getItem("strkyr_stretch_transition_seconds")).toBe("10");

    const fiveSecOpt = screen.getByTestId("transition-option-5");
    fireEvent.click(fiveSecOpt);
    expect(localStorage.getItem("strkyr_stretch_transition_seconds")).toBe("5");
  });

  it("starts routine with 5s transition 'Get Ready' buffer countdown", () => {
    render(<MobilityTab />);

    // Click "Start Timer" on the first routine
    const startButtons = screen.getAllByRole("button", { name: /start timer/i });
    expect(startButtons.length).toBeGreaterThan(0);
    fireEvent.click(startButtons[0]);

    // Should render the transition view
    expect(screen.getByTestId("transition-view")).toBeInTheDocument();
    expect(screen.getByText("Get Ready to Switch")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-transition-buffer")).toHaveTextContent("5s Buffer");
    expect(screen.getByTestId("start-stretch-now")).toBeInTheDocument();
  });

  it("bypasses transition countdown immediately when 'Start Stretch Now' is clicked", () => {
    render(<MobilityTab />);

    const startButtons = screen.getAllByRole("button", { name: /start timer/i });
    fireEvent.click(startButtons[0]);

    expect(screen.getByTestId("transition-view")).toBeInTheDocument();

    const startNowBtn = screen.getByTestId("start-stretch-now");
    fireEvent.click(startNowBtn);

    // Transition should end, active stretch view should appear
    expect(screen.queryByTestId("transition-view")).not.toBeInTheDocument();
    expect(screen.getByTestId("stretch-active-view")).toBeInTheDocument();
  });

  it("automatically advances from 5s transition buffer to active stretch after 5 seconds", () => {
    render(<MobilityTab />);

    const startButtons = screen.getAllByRole("button", { name: /start timer/i });
    fireEvent.click(startButtons[0]);

    expect(screen.getByTestId("transition-view")).toBeInTheDocument();

    // Advance 5 seconds of timer ticks
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should transition into active stretch view
    expect(screen.queryByTestId("transition-view")).not.toBeInTheDocument();
    expect(screen.getByTestId("stretch-active-view")).toBeInTheDocument();
  });

  it("toggles transition buffer in modal top bar between 5s and 0s", () => {
    render(<MobilityTab />);

    const startButtons = screen.getAllByRole("button", { name: /start timer/i });
    fireEvent.click(startButtons[0]);

    const toggleBtn = screen.getByTestId("toggle-transition-buffer");
    expect(toggleBtn).toHaveTextContent("5s Buffer");

    // Clicking toggles to 0s and immediately starts stretch
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem("strkyr_stretch_transition_seconds")).toBe("0");
    expect(screen.getByTestId("toggle-transition-buffer")).toHaveTextContent("0s Buffer");
    expect(screen.getByTestId("stretch-active-view")).toBeInTheDocument();
  });

  it("triggers transition buffer when advancing stretches or switching sides", () => {
    render(<MobilityTab />);

    const startButtons = screen.getAllByRole("button", { name: /start timer/i });
    fireEvent.click(startButtons[0]);

    // Skip initial transition
    fireEvent.click(screen.getByTestId("start-stretch-now"));
    expect(screen.getByTestId("stretch-active-view")).toBeInTheDocument();

    // Skip Arm circles (sides: "both") -> advances to next stretch (Leg swings, sides: "left_right")
    const skipBtn = screen.getByTitle("Skip to next stretch");
    fireEvent.click(skipBtn);

    // Should enter transition for Leg swings (Left Side)
    expect(screen.getByTestId("transition-view")).toBeInTheDocument();
    expect(screen.getByText("👈 Left Side")).toBeInTheDocument();
    expect(screen.getByText("Leg swings")).toBeInTheDocument();

    // Start left side
    fireEvent.click(screen.getByTestId("start-stretch-now"));

    // Now skip left side -> triggers transition for Right Side!
    const skipBtn2 = screen.getByTitle("Skip to next stretch");
    fireEvent.click(skipBtn2);

    expect(screen.getByTestId("transition-view")).toBeInTheDocument();
    expect(screen.getByText("👉 Right Side")).toBeInTheDocument();
  });

  it("starts routine immediately when transition buffer is set to 0s", () => {
    localStorage.setItem("strkyr_stretch_transition_seconds", "0");
    render(<MobilityTab />);

    const startButtons = screen.getAllByRole("button", { name: /start timer/i });
    fireEvent.click(startButtons[0]);

    // Should directly be in active stretch view without transition view
    expect(screen.queryByTestId("transition-view")).not.toBeInTheDocument();
    expect(screen.getByTestId("stretch-active-view")).toBeInTheDocument();
  });
});
