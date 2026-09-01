import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileNavDrawer } from "@/app/dashboard/components/MobileNavDrawer";

describe("MobileNavDrawer Component Tests", () => {
  it("should render trainer mobile drawer links and trigger callbacks", () => {
    const handleClose = vi.fn();
    const handleTour = vi.fn();
    const handleGuide = vi.fn();
    const handleProfile = vi.fn();

    render(
      <MobileNavDrawer
        role="TRAINER"
        isOpen={true}
        onClose={handleClose}
        userName="Coach Collin"
        onOpenTour={handleTour}
        onOpenCoachGuide={handleGuide}
        onOpenProfile={handleProfile}
      />
    );

    expect(screen.getByText("Coach Studio")).toBeInTheDocument();
    expect(screen.getByText("Coach Collin")).toBeInTheDocument();
    expect(screen.getByText("Recovery & Mobility")).toBeInTheDocument();
    expect(screen.getByText("Nutrition & Macros")).toBeInTheDocument();
    expect(screen.getByText("Interactive App Tour")).toBeInTheDocument();
    expect(screen.getByText("Coach AI Philosophy Guide")).toBeInTheDocument();
    expect(screen.getByText("Studio & Billing Profile")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Interactive App Tour"));
    expect(handleTour).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it("should render athlete mobile drawer links", () => {
    const handleClose = vi.fn();
    render(
      <MobileNavDrawer
        role="CLIENT"
        isOpen={true}
        onClose={handleClose}
        userName="Sarah Connor"
      />
    );

    expect(screen.getByText("Athlete Portal")).toBeInTheDocument();
    expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.getByText("Recovery & Mobility")).toBeInTheDocument();
  });

  it("should trigger onNavigateTab when Recovery & Mobility is clicked", () => {
    const handleClose = vi.fn();
    const handleNavigate = vi.fn();

    render(
      <MobileNavDrawer
        role="TRAINER"
        isOpen={true}
        onClose={handleClose}
        userName="Coach Collin"
        onNavigateTab={handleNavigate}
      />
    );

    fireEvent.click(screen.getByText("Recovery & Mobility"));
    expect(handleNavigate).toHaveBeenCalledWith("mobility");
    expect(handleClose).toHaveBeenCalled();
  });
});
