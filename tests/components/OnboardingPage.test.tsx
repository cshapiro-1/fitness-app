import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OnboardingPage from "@/app/onboarding/page";

// Mock NextAuth session and router
vi.mock("next-auth/react", () => ({
  useSession: vi.fn().mockReturnValue({
    data: { user: { id: "test-user-id", name: "Jose Dildine", email: "trainer@fit.com" } },
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

  it("should render Step 1 role selection options initially", () => {
    render(<OnboardingPage />);
    expect(screen.getByText("Welcome to FitCoach!")).toBeInTheDocument();
    expect(screen.getByText("I am a Trainer")).toBeInTheDocument();
    expect(screen.getByText("I am an Athlete")).toBeInTheDocument();
  });

  it("should transition from Step 1 to Step 2 when Trainer is selected", () => {
    render(<OnboardingPage />);
    const trainerBtn = screen.getByText("I am a Trainer");
    fireEvent.click(trainerBtn);

    expect(screen.getByText("Coach Studio Setup")).toBeInTheDocument();
    expect(screen.getByText("Primary Specialty")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jose Dildine")).toBeInTheDocument();
  });

  it("should navigate through the entire multi-step trainer wizard to completion", async () => {
    render(<OnboardingPage />);

    // Step 1: Select Trainer
    fireEvent.click(screen.getByText("I am a Trainer"));

    // Step 2: Customize specialty and click Continue
    fireEvent.click(screen.getByText("Continue"));

    // Step 3: Choose Custom Client
    expect(screen.getByText("Add Your First Client")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add a Real Client Now"));

    // Fill Client Name
    const clientNameInput = screen.getByPlaceholderText("e.g. Alex Morgan");
    fireEvent.change(clientNameInput, { target: { value: "Collin Shapiro" } });

    // Click Review & Launch
    fireEvent.click(screen.getByText("Review & Launch"));

    // Step 4: Summary Card verification
    expect(screen.getByText("Your Studio is Ready!")).toBeInTheDocument();
    expect(screen.getByText("Client: Collin Shapiro")).toBeInTheDocument();

    // Click Launch Coach Dashboard
    const launchBtn = screen.getByText("Launch Coach Dashboard");
    fireEvent.click(launchBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/role",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ role: "TRAINER" }),
        })
      );
    });
  });
});
