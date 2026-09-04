import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AnatomyExplorerPage from "@/app/anatomy/page";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn().mockReturnValue({
    data: { user: { id: "user-test", name: "Collin Shapiro", email: "collin@strkyr.com" } },
  }),
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
  }),
}));

// Mock next/dynamic to render synchronously in unit tests
vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockDynamicInteractiveBodyMap(props: any) {
      return (
        <div data-testid="interactive-body-map">
          <span>Body Map Mock ({props.selectedMuscle})</span>
          <button
            type="button"
            data-testid="mock-select-quads"
            onClick={() => props.onSelectMuscle("quads")}
          >
            Select Quads
          </button>
        </div>
      );
    };
  },
}));

describe("AnatomyExplorerPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders STRKYR header, breadcrumb navigation, and app links", () => {
    render(<AnatomyExplorerPage />);

    // Brand and breadcrumbs
    expect(screen.getByText("STRKYR")).toBeInTheDocument();
    expect(screen.getByText("Anatomy Explorer")).toBeInTheDocument();

    // App navigation buttons
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Recovery/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nutrition/i })).toBeInTheDocument();
  });

  it("toggles between Light and Dark mode and synchronizes document root and localStorage", () => {
    render(<AnatomyExplorerPage />);

    const themeToggleBtn = screen.getByTitle(/Switch to/i);
    expect(themeToggleBtn).toBeInTheDocument();

    // Click theme toggle
    fireEvent.click(themeToggleBtn);
    expect(localStorage.getItem("strkyr_theme_dark")).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Toggle back
    fireEvent.click(themeToggleBtn);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("renders mobile tab switcher and toggles between 3D Body Map and Movements", () => {
    render(<AnatomyExplorerPage />);

    const mapTabBtn = screen.getByTestId("mobile-tab-map");
    const movementsTabBtn = screen.getByTestId("mobile-tab-movements");

    expect(mapTabBtn).toBeInTheDocument();
    expect(movementsTabBtn).toBeInTheDocument();

    // Switch to Movements tab
    fireEvent.click(movementsTabBtn);
    expect(screen.getByPlaceholderText(/Search muscle, exercise, or cue/i)).toBeInTheDocument();

    // Switch back to Map tab
    fireEvent.click(mapTabBtn);
    expect(screen.getByTestId("interactive-body-map")).toBeInTheDocument();
  });

  it("switches between Strength Movements and Mobility & Stretches tabs", () => {
    render(<AnatomyExplorerPage />);

    const stretchesTab = screen.getByTestId("tab-stretches");
    expect(stretchesTab).toBeInTheDocument();

    fireEvent.click(stretchesTab);
    expect(screen.getByTestId("tab-exercises")).toBeInTheDocument();
  });

  it("filters exercise cards based on search query input", () => {
    render(<AnatomyExplorerPage />);

    const searchInput = screen.getByPlaceholderText(/Search muscle, exercise, or cue/i);
    fireEvent.change(searchInput, { target: { value: "Bench Press" } });

    expect(searchInput).toHaveValue("Bench Press");
    expect(screen.getByText("Barbell Bench Press")).toBeInTheDocument();
  });

  it("updates selected muscle when triggered from the 3D body map mock", () => {
    render(<AnatomyExplorerPage />);

    const selectQuadsBtn = screen.getByTestId("mock-select-quads");
    fireEvent.click(selectQuadsBtn);

    // Should display Quadriceps header and biomechanical details
    expect(screen.getByText(/Quadriceps \(Front Thigh\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Knee extension and hip flexion/i)).toBeInTheDocument();
  });

  it("opens diagram preview modal on thumbnail click and closes on dismiss", () => {
    render(<AnatomyExplorerPage />);

    // Find the first thumbnail button or image
    const previewButtons = screen.getAllByTitle(/Click to inspect 3D biomechanics diagram/i);
    expect(previewButtons.length).toBeGreaterThan(0);

    fireEvent.click(previewButtons[0]);

    // Modal should now be open
    expect(screen.getByText(/Medical 3D Kinesiology & Biomechanical Diagram/i)).toBeInTheDocument();

    const modalImg = screen.getByAltText("3D Anatomy");
    expect(modalImg).toBeInTheDocument();

    // Dismiss by clicking backdrop
    fireEvent.click(modalImg.parentElement!.parentElement!.parentElement!);
    expect(screen.queryByText(/Medical 3D Kinesiology & Biomechanical Diagram/i)).toBeNull();
  });
});
