import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LiveWorkoutBanner } from "@/app/dashboard/components/LiveWorkoutBanner";

describe("LiveWorkoutBanner Component Tests (Mobile & Desktop)", () => {
  it("should render compact workout details and trigger resume and complete actions", () => {
    const handleResume = vi.fn();
    const handleComplete = vi.fn();

    render(
      <LiveWorkoutBanner
        workoutTitle="Upper Body Push Power"
        startedAt={new Date().toISOString()}
        startedByName="Coach Collin"
        exerciseCount={5}
        athleteName="Alex Athlete"
        isCoachView={true}
        onResume={handleResume}
        onComplete={handleComplete}
      />
    );

    expect(screen.getByText("Upper Body Push Power")).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText(/Athlete: Alex Athlete/)).toBeInTheDocument();
    expect(screen.getByText(/By Coach Collin/)).toBeInTheDocument();

    // Click Resume
    const resumeBtn = screen.getByText("Resume & Edit");
    fireEvent.click(resumeBtn);
    expect(handleResume).toHaveBeenCalled();

    // Click Finish
    const finishBtn = screen.getByText("Finish");
    fireEvent.click(finishBtn);
    expect(handleComplete).toHaveBeenCalled();
  });
});
