import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppHeaderMenu } from "@/app/dashboard/components/AppHeaderMenu";

describe("AppHeaderMenu Component", () => {
  it("renders trigger button with user name and avatar", () => {
    render(
      <AppHeaderMenu
        role="TRAINER"
        userName="Jose Dildine"
        userImage={null}
        onOpenTour={vi.fn()}
        onOpenReleaseNotes={vi.fn()}
      />
    );
    expect(screen.getByText("Jose Dildine")).toBeDefined();
  });

  it("toggles dropdown popover on click with clear categorized tools", () => {
    const onOpenTour = vi.fn();
    const onOpenCoachGuide = vi.fn();
    const onOpenProfile = vi.fn();

    render(
      <AppHeaderMenu
        role="TRAINER"
        userName="Jose Dildine"
        userImage={null}
        isAdmin={true}
        onOpenTour={onOpenTour}
        onOpenCoachGuide={onOpenCoachGuide}
        onOpenReleaseNotes={vi.fn()}
        onOpenProfile={onOpenProfile}
      />
    );

    const triggerBtn = screen.getByTitle("Open Studio Menu & Profile");
    fireEvent.click(triggerBtn);

    expect(screen.getByText("Master Trainer")).toBeDefined();
    expect(screen.getByText("Recovery & Mobility Hub")).toBeDefined();
    expect(screen.getByText("Nutrition & Macros Planner")).toBeDefined();
    expect(screen.getByText("Interactive App Tour")).toBeDefined();
    expect(screen.getByText("Coach AI Philosophy Guide")).toBeDefined();
    expect(screen.getByText("Studio & Billing Profile")).toBeDefined();
    expect(screen.getByText("Super Admin Portal")).toBeDefined();

    // Trigger tour click
    fireEvent.click(screen.getByText("Interactive App Tour"));
    expect(onOpenTour).toHaveBeenCalled();
  });

  it("calls onNavigateTab when Recovery & Mobility is clicked in dashboard context", () => {
    const handleNavigate = vi.fn();
    render(
      <AppHeaderMenu
        role="TRAINER"
        userName="Collin"
        userImage={null}
        onOpenTour={vi.fn()}
        onOpenReleaseNotes={vi.fn()}
        onNavigateTab={handleNavigate}
      />
    );

    fireEvent.click(screen.getByTitle("Open Studio Menu & Profile"));
    fireEvent.click(screen.getByText("Recovery & Mobility Hub"));
    expect(handleNavigate).toHaveBeenCalledWith("mobility");
  });
});
