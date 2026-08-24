import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OnboardingPage from "@/app/onboarding/page";
import { CoachWalkthroughModal } from "@/app/dashboard/components/CoachWalkthroughModal";

// Mock NextAuth session and router
vi.mock("next-auth/react", () => ({
  useSession: vi.fn().mockReturnValue({
    data: { user: { id: "test-coach-id", name: "Collin Shapiro", email: "coach@fit.com" } },
    update: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
  }),
}));

describe("Coach Studio Onboarding Workflow Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as any);
  });

  it("should render Step 1 coach profile setup form with prefilled name", () => {
    render(<OnboardingPage />);
    expect(screen.getByText("Coach Studio Setup")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Collin Shapiro")).toBeInTheDocument();
    expect(screen.getByText("Primary Specialty")).toBeInTheDocument();
    expect(screen.getByText("Continue to Client Setup")).toBeInTheDocument();
  });

  it("should transition to Step 2 and allow adding a real client or skipping without sample athletes", () => {
    render(<OnboardingPage />);
    const continueBtn = screen.getByText("Continue to Client Setup");
    fireEvent.click(continueBtn);

    expect(screen.getByText("Add Your First Client")).toBeInTheDocument();
    expect(screen.getByText("Add Athlete Now")).toBeInTheDocument();
    expect(screen.getByText("I'll Add Clients Later")).toBeInTheDocument();
    expect(screen.queryByText("Start with Sample Athletes")).toBeNull();
  });

  it("should complete coach onboarding through the 4-Pillar Walkthrough and set role as TRAINER", async () => {
    render(<OnboardingPage />);

    // Step 1 -> Step 2
    fireEvent.click(screen.getByText("Continue to Client Setup"));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByText("Continue to Coach Walkthrough"));

    // Step 3: Coach-Governed AI Walkthrough
    expect(screen.getByText("You Are the Final Authority. AI is Your Co-Pilot.")).toBeInTheDocument();

    // Advance through pillars
    fireEvent.click(screen.getByText("Next Pillar (1/4)"));
    expect(screen.getByText("Natural Language Free-Text Routine Generation")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Next Pillar (2/4)"));
    expect(screen.getByText("24/7 Client Guidance with Coach Telemetry")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Next Pillar (3/4)"));
    expect(screen.getByText("Automated Kinematics & Hands-Off Retention")).toBeInTheDocument();

    // Complete Walkthrough & Launch
    const launchBtn = screen.getByText("Complete Walkthrough & Launch");
    fireEvent.click(launchBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/role",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ role: "TRAINER" }),
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/profile",
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });
});

describe("CoachWalkthroughModal Standalone Tests", () => {
  it("should render modal when open and allow navigation across all 4 pillars", () => {
    const handleClose = vi.fn();
    render(<CoachWalkthroughModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText("You Are the Final Authority. AI is Your Co-Pilot.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Next Pillar (1/4)"));
    expect(screen.getByText("Natural Language Free-Text Routine Generation")).toBeInTheDocument();
  });
});
