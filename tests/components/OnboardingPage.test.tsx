import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OnboardingPage from "@/app/onboarding/page";

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
    expect(screen.getByText("Continue to Client Roster")).toBeInTheDocument();
  });

  it("should transition to Step 2 and configure custom client", () => {
    render(<OnboardingPage />);
    const continueBtn = screen.getByText("Continue to Client Roster");
    fireEvent.click(continueBtn);

    expect(screen.getByText("Add Your First Client")).toBeInTheDocument();
    expect(screen.getByText("Start with Sample Athletes")).toBeInTheDocument();
    expect(screen.getByText("Add Real Client Now")).toBeInTheDocument();
  });

  it("should complete coach onboarding and set role as TRAINER with coach profile", async () => {
    render(<OnboardingPage />);

    // Step 1 -> Step 2
    fireEvent.click(screen.getByText("Continue to Client Roster"));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByText("Continue to Summary"));

    // Step 3: Summary card
    expect(screen.getByText("Your Coach Studio is Ready!")).toBeInTheDocument();
    expect(screen.getByText("30-Day Full Access Coach Pass Activated")).toBeInTheDocument();

    // Click Launch Coach Studio
    const launchBtn = screen.getByText("Launch Coach Studio");
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
