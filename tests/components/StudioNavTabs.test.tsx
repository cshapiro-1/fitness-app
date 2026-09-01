import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudioNavTabs } from "@/app/dashboard/components/StudioNavTabs";

describe("StudioNavTabs Component Tests", () => {
  it("should render all 5 distinct tabs with labels, subtitles, and badges", () => {
    const handleSelect = vi.fn();
    render(
      <StudioNavTabs
        activeTab="log"
        onSelectTab={handleSelect}
        plannedCount={3}
        completedCount={15}
        hasActiveWorkout={false}
      />
    );

    expect(screen.getByText("Workout Logger")).toBeInTheDocument();
    expect(screen.getByText("Training Programs")).toBeInTheDocument();
    expect(screen.getByText("Workout History")).toBeInTheDocument();
    expect(screen.getByText("Analytics & Volume")).toBeInTheDocument();
    expect(screen.getByText("Recovery & Mobility")).toBeInTheDocument();

    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("15")).toBeInTheDocument();

    // Click on Programs tab
    fireEvent.click(screen.getByText("Training Programs"));
    expect(handleSelect).toHaveBeenCalledWith("programs");

    // Click on Recovery tab
    fireEvent.click(screen.getByText("Recovery & Mobility"));
    expect(handleSelect).toHaveBeenCalledWith("mobility");
  });
});
