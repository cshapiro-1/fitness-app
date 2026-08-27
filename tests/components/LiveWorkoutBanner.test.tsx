import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LiveWorkoutBanner } from "@/app/dashboard/components/LiveWorkoutBanner";

describe("LiveWorkoutBanner Component", () => {
  it("should render live pulsing badge, routine title, and elapsed timer", () => {
    const handleResume = vi.fn();
    const handleComplete = vi.fn();

    render(
      <LiveWorkoutBanner
        workoutId="live-123"
        workoutTitle="Upper Body Hypertrophy"
        startedByName="Coach Collin"
        exerciseCount={4}
        athleteName="Jose Dildine"
        isCoachView={true}
        onResume={handleResume}
        onComplete={handleComplete}
      />
    );

    expect(screen.getByText("LIVE")).toBeDefined();
    expect(screen.getByText("Upper Body Hypertrophy")).toBeDefined();
    expect(screen.getByText("Athlete: Jose Dildine")).toBeDefined();
    expect(screen.getByText(/4 exercises/)).toBeDefined();
    expect(screen.getByText("Started by Coach Collin")).toBeDefined();
    expect(screen.getByText("Resume & Edit")).toBeDefined();
    expect(screen.getByText("Finish")).toBeDefined();
  });

  it("should trigger onResume when Resume & Edit button is clicked", () => {
    const handleResume = vi.fn();
    const handleComplete = vi.fn();

    render(
      <LiveWorkoutBanner
        workoutId="live-123"
        workoutTitle="Lower Body Power"
        onResume={handleResume}
        onComplete={handleComplete}
      />
    );

    const resumeBtn = screen.getByText("Resume & Edit");
    fireEvent.click(resumeBtn);
    expect(handleResume).toHaveBeenCalled();
  });

  it("should trigger onComplete when Finish button is clicked", () => {
    const handleResume = vi.fn();
    const handleComplete = vi.fn();

    render(
      <LiveWorkoutBanner
        workoutId="live-123"
        workoutTitle="Lower Body Power"
        onResume={handleResume}
        onComplete={handleComplete}
      />
    );

    const finishBtn = screen.getByText("Finish");
    fireEvent.click(finishBtn);
    expect(handleComplete).toHaveBeenCalled();
  });
});
