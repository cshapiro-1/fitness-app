import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalyticsView } from "@/app/dashboard/components/AnalyticsView";
import { DashboardAnalytics } from "@/app/dashboard/utils/analytics";

describe("Mobile Revamped AnalyticsView Component", () => {
  const mockAnalytics: DashboardAnalytics = {
    workouts: [
      {
        id: "w1",
        completedAt: "2026-10-01T12:00:00Z",
        exerciseCount: 3,
        setCount: 9,
        peakWeight: 225,
        peakReps: 5,
        totalVolume: 8500,
      },
      {
        id: "w2",
        completedAt: "2026-10-05T12:00:00Z",
        exerciseCount: 3,
        setCount: 9,
        peakWeight: 235,
        peakReps: 5,
        totalVolume: 9200,
      },
    ],
    exercises: [
      {
        name: "Barbell Bench Press",
        muscleGroup: "Chest",
        maxWeight: 235,
        maxReps: 5,
        avgTopWeight: 230,
        maxEstimated1RM: 264,
        totalVolume: 17700,
        sessions: 2,
        totalSets: 6,
        weightChangePercent: 4.4,
        trend: [
          {
            completedAt: "2026-10-01T12:00:00Z",
            workoutId: "w1",
            topWeight: 225,
            topReps: 5,
            estimatedOneRepMax: 253,
            totalVolume: 8500,
            setCount: 3,
          },
          {
            completedAt: "2026-10-05T12:00:00Z",
            workoutId: "w2",
            topWeight: 235,
            topReps: 5,
            estimatedOneRepMax: 264,
            totalVolume: 9200,
            setCount: 3,
          },
        ],
      },
      {
        name: "Barbell Squat",
        muscleGroup: "Legs",
        maxWeight: 315,
        maxReps: 5,
        avgTopWeight: 315,
        maxEstimated1RM: 354,
        totalVolume: 22000,
        sessions: 2,
        totalSets: 6,
        weightChangePercent: 0,
        trend: [
          {
            completedAt: "2026-10-01T12:00:00Z",
            workoutId: "w1",
            topWeight: 315,
            topReps: 5,
            estimatedOneRepMax: 354,
            totalVolume: 11000,
            setCount: 3,
          },
        ],
      },
    ],
    muscleGroups: [
      {
        name: "Chest",
        totalVolume: 17700,
        totalSets: 6,
        exerciseCount: 1,
        exercises: [],
      },
      {
        name: "Legs",
        totalVolume: 22000,
        totalSets: 6,
        exerciseCount: 1,
        exercises: [],
      },
    ],
    acwr: {
      acuteLoad: 17700,
      chronicLoad: 16000,
      ratio: 1.11,
      zone: "optimal",
      recommendation: "Optimal training overload — You are primed for progression and PR attempts.",
    },
    symmetry: {
      pushVolume: 17700,
      pullVolume: 16500,
      pushToPullRatio: 1.07,
      quadVolume: 12000,
      hamstringVolume: 10000,
      quadToHamRatio: 1.2,
      anteriorVolume: 17700,
      posteriorVolume: 26500,
      coreVolume: 4000,
      armsVolume: 8000,
      radarPoints: [
        { label: "Chest (Push)", value: 17700, normalizedPercent: 85 },
        { label: "Back (Pull)", value: 16500, normalizedPercent: 80 },
        { label: "Legs", value: 22000, normalizedPercent: 100 },
        { label: "Shoulders", value: 9000, normalizedPercent: 50 },
        { label: "Arms", value: 8000, normalizedPercent: 45 },
      ],
    },
    intensity: {
      zone1Count: 4,
      zone1Volume: 5000,
      zone1Percent: 33,
      zone2Count: 6,
      zone2Volume: 9000,
      zone2Percent: 50,
      zone3Count: 2,
      zone3Volume: 3700,
      zone3Percent: 17,
      totalTrackedSets: 12,
    },
    multiLift: {
      availableLifts: ["Barbell Bench Press", "Barbell Squat"],
      timeline: [
        { date: "2026-10-01", "Barbell Bench Press": 0, "Barbell Squat": 0 },
        { date: "2026-10-05", "Barbell Bench Press": 4.4, "Barbell Squat": 0 },
      ],
    },
    plateaus: [
      {
        exercise: "Barbell Bench Press",
        sessionsStagnant: 0,
        currentMaxWeight: 235,
        estimated1RM: 264,
        insightType: "breakthrough",
        message: "Barbell Bench Press shows strong progressive overload (+4.4% strength gain).",
        actionableCue: "Maintain current linear progression cadence.",
      },
    ],
    overall: {
      totalWorkouts: 2,
      totalExercises: 2,
      totalSets: 12,
      totalVolume: 39700,
      weeklyAvgWorkouts: 3.5,
      heaviestSet: { exercise: "Barbell Squat", weight: 315, reps: 5 },
      highestRepSet: { exercise: "Barbell Bench Press", weight: 225, reps: 5 },
      best1RM: { exercise: "Barbell Squat", weight: 315, reps: 5, estimated1RM: 354 },
      mostTrainedExercise: { exercise: "Barbell Bench Press", sessions: 2 },
    },
  };

  it("should render the 3 mobile sub-navigation tabs (Gym Floor, Lift Growth, Readiness)", () => {
    render(<AnalyticsView analytics={mockAnalytics} />);

    expect(screen.getByRole("button", { name: /Gym Floor/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lift Growth/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Readiness/i })).toBeInTheDocument();
  });

  it("should default to the Gym Floor tab with 1RM calculator, plate breakdown, and PR Hall of Fame", () => {
    render(<AnalyticsView analytics={mockAnalytics} />);

    // Momentum cards
    expect(screen.getByText("Total Workouts")).toBeInTheDocument();
    expect(screen.getByText("Total Tonnage")).toBeInTheDocument();
    expect(screen.getByText("39,700")).toBeInTheDocument();

    // Gym floor 1RM & plate target calculator
    expect(screen.getByText("Gym Floor 1RM & Plate Target")).toBeInTheDocument();
    expect(screen.getByText(/264/)).toBeInTheDocument(); // Est 1RM
    expect(screen.getByText(/Barbell Loading/i)).toBeInTheDocument();

    // PR Hall of Fame
    expect(screen.getByText("PR Hall of Fame")).toBeInTheDocument();
    expect(screen.getAllByText("Barbell Squat").length).toBeGreaterThan(0);
    expect(screen.getByText("315 lbs")).toBeInTheDocument();
  });

  it("should allow switching working weight intensity tiers and updating barbell plates", () => {
    render(<AnalyticsView analytics={mockAnalytics} />);

    // Click 90% Power tier button
    const powerTierBtn = screen.getByRole("button", { name: /90%/i });
    fireEvent.click(powerTierBtn);

    // 90% of 264 is ~238 rounded to nearest 5 is 240 lbs.
    expect(screen.getByText(/240 lbs Total/i)).toBeInTheDocument();

    // Switch to 35 lb bar mode
    const bar35Btn = screen.getByRole("button", { name: /35 lb Bar/i });
    fireEvent.click(bar35Btn);
    expect(screen.getByText(/plates \+ 35 lb bar/i)).toBeInTheDocument();
  });

  it("should switch to Lift Growth tab and render progression line chart and muscle group bar chart", () => {
    render(<AnalyticsView analytics={mockAnalytics} />);

    const liftGrowthTab = screen.getByRole("button", { name: /Lift Growth/i });
    fireEvent.click(liftGrowthTab);

    // Muscle group filter pills
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Legs" })).toBeInTheDocument();

    // Progression curve label
    expect(screen.getByText("Selected Exercise Progression Curve")).toBeInTheDocument();

    // Metric switches
    expect(screen.getByRole("button", { name: "Top Weight" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Est. 1RM" }).length).toBe(2);
    expect(screen.getByRole("button", { name: "Session Volume" })).toBeInTheDocument();
  });

  it("should switch to Readiness tab and render ACWR readiness battery and muscular balance", () => {
    render(<AnalyticsView analytics={mockAnalytics} />);

    const readinessTab = screen.getByRole("button", { name: /Readiness/i });
    fireEvent.click(readinessTab);

    expect(screen.getByText("Workload & Recovery Readiness")).toBeInTheDocument();
    expect(screen.getByText(/ACWR 1.11/i)).toBeInTheDocument();
    expect(screen.getByText(/Prime Zone/i)).toBeInTheDocument();
    expect(screen.getByText(/Muscular Balance & Kinetic Symmetry/i)).toBeInTheDocument();
    expect(screen.getByText(/1.07 : 1.0/i)).toBeInTheDocument(); // Push : Pull
  });

  it("should render clean empty state when no workouts are logged", () => {
    const emptyAnalytics: DashboardAnalytics = {
      ...mockAnalytics,
      workouts: [],
      exercises: [],
    };

    render(<AnalyticsView analytics={emptyAnalytics} />);
    expect(screen.getByText("No Logged Workouts Yet")).toBeInTheDocument();
  });
});
