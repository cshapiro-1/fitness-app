import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OnboardingPage from "@/app/onboarding/page";

// Mock NextAuth session and router
vi.mock("next-auth/react", () => ({
  useSession: vi.fn().mockReturnValue({
    data: { user: { id: "test-user-id", name: "Collin Shapiro", email: "collin@fit.com" } },
    update: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
  }),
}));

describe("Onboarding Workflow Component & Journey Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as any);
  });

  it("should render Step 1 path selection options initially with Personal Workout Journey recommended", () => {
    render(<OnboardingPage />);
    expect(screen.getByText("Welcome to STRKYR")).toBeInTheDocument();
    expect(screen.getByText("Personal Workout Journey")).toBeInTheDocument();
    expect(screen.getByText("Coach & Trainer Studio")).toBeInTheDocument();
    expect(screen.getByText("RECOMMENDED")).toBeInTheDocument();
  });

  it("should transition from Step 1 to Step 2 when Personal Workout Journey is selected", () => {
    render(<OnboardingPage />);
    const journeyBtn = screen.getByText("Personal Workout Journey");
    fireEvent.click(journeyBtn);

    expect(screen.getByText("Customize Your Training Path")).toBeInTheDocument();
    expect(screen.getByText("🎯 Primary Fitness Goal")).toBeInTheDocument();
    expect(screen.getByText("📅 Preferred Training Split")).toBeInTheDocument();
  });

  it("should navigate through the entire consumer journey wizard and initialize athlete profile", async () => {
    render(<OnboardingPage />);

    // Step 1: Select Personal Journey
    fireEvent.click(screen.getByText("Personal Workout Journey"));

    // Step 2: Click Continue to Preview
    fireEvent.click(screen.getByText("Continue to Preview"));

    // Step 3: Verify Pro Trial and Summary
    expect(screen.getByText("Your Fitness Journey is Ready")).toBeInTheDocument();
    expect(screen.getByText("14-Day Free STRKYR Pro Membership Activated")).toBeInTheDocument();

    // Click Start My Workout Journey
    const startBtn = screen.getByText("Start My Workout Journey");
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/role",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ role: "CLIENT" }),
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
