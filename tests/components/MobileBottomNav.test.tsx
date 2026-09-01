import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileBottomNav } from "@/components/MobileBottomNav";

describe("MobileBottomNav Component Tests", () => {
  it("should render all 5 mobile navigation items and trigger tab selection for Trainer", () => {
    const handleSelectTab = vi.fn();

    render(
      <MobileBottomNav
        currentTab="log"
        onSelectTab={handleSelectTab}
        role="TRAINER"
        hasActiveWorkout={false}
      />
    );

    expect(screen.getByText("Train")).toBeInTheDocument();
    expect(screen.getByText("Programs")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("Recovery")).toBeInTheDocument();

    // Click Programs tab
    fireEvent.click(screen.getByText("Programs"));
    expect(handleSelectTab).toHaveBeenCalledWith("programs");

    // Click History tab
    fireEvent.click(screen.getByText("History"));
    expect(handleSelectTab).toHaveBeenCalledWith("history");
  });

  it("should render athlete role specific labels and show active workout badge", () => {
    const handleSelectTab = vi.fn();

    render(
      <MobileBottomNav
        currentTab="programs"
        onSelectTab={handleSelectTab}
        role="CLIENT"
        hasActiveWorkout={true}
      />
    );

    expect(screen.getByText("Workout")).toBeInTheDocument();
    expect(screen.getByText("Programs")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
