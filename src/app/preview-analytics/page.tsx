"use client";

import React, { useState } from "react";
import { AnalyticsView } from "../dashboard/components/AnalyticsView";
import { DashboardAnalytics } from "../dashboard/utils/analytics";
import { Dumbbell, User, Sparkles, RefreshCw, Smartphone } from "lucide-react";

// Dataset 1: Collin Shapiro (Comprehensive 44-Workout Coached Progression)
const collinAnalytics: DashboardAnalytics = {
  workouts: [
    { id: "w1", completedAt: "2026-10-12T10:30:00Z", exerciseCount: 4, setCount: 16, peakWeight: 245, peakReps: 5, totalVolume: 18200 },
    { id: "w2", completedAt: "2026-10-15T11:00:00Z", exerciseCount: 4, setCount: 16, peakWeight: 335, peakReps: 5, totalVolume: 22400 },
    { id: "w3", completedAt: "2026-10-19T10:15:00Z", exerciseCount: 5, setCount: 18, peakWeight: 250, peakReps: 5, totalVolume: 24800 },
    { id: "w4", completedAt: "2026-10-23T12:00:00Z", exerciseCount: 4, setCount: 15, peakWeight: 405, peakReps: 3, totalVolume: 26500 },
    { id: "w5", completedAt: "2026-10-27T10:45:00Z", exerciseCount: 5, setCount: 17, peakWeight: 255, peakReps: 4, totalVolume: 25100 },
    { id: "w6", completedAt: "2026-10-31T11:30:00Z", exerciseCount: 4, setCount: 16, peakWeight: 345, peakReps: 5, totalVolume: 27900 },
  ],
  exercises: [
    {
      name: "Barbell Bench Press",
      muscleGroup: "Chest",
      maxWeight: 255,
      maxReps: 5,
      avgTopWeight: 242,
      maxEstimated1RM: 287,
      totalVolume: 34200,
      sessions: 6,
      totalSets: 24,
      weightChangePercent: 12.5,
      trend: [
        { completedAt: "2026-10-01T10:00:00Z", workoutId: "w1", topWeight: 225, topReps: 5, estimatedOneRepMax: 253, totalVolume: 5600, setCount: 4 },
        { completedAt: "2026-10-08T10:00:00Z", workoutId: "w2", topWeight: 235, topReps: 5, estimatedOneRepMax: 264, totalVolume: 6100, setCount: 4 },
        { completedAt: "2026-10-15T10:00:00Z", workoutId: "w3", topWeight: 240, topReps: 5, estimatedOneRepMax: 270, totalVolume: 6400, setCount: 4 },
        { completedAt: "2026-10-22T10:00:00Z", workoutId: "w4", topWeight: 245, topReps: 5, estimatedOneRepMax: 276, totalVolume: 6800, setCount: 4 },
        { completedAt: "2026-10-27T10:00:00Z", workoutId: "w5", topWeight: 250, topReps: 5, estimatedOneRepMax: 281, totalVolume: 7100, setCount: 4 },
        { completedAt: "2026-10-31T10:00:00Z", workoutId: "w6", topWeight: 255, topReps: 4, estimatedOneRepMax: 287, totalVolume: 7400, setCount: 4 },
      ],
    },
    {
      name: "Barbell Back Squat",
      muscleGroup: "Legs",
      maxWeight: 345,
      maxReps: 5,
      avgTopWeight: 325,
      maxEstimated1RM: 388,
      totalVolume: 42500,
      sessions: 5,
      totalSets: 20,
      weightChangePercent: 9.5,
      trend: [
        { completedAt: "2026-10-03T10:00:00Z", workoutId: "w1", topWeight: 315, topReps: 5, estimatedOneRepMax: 354, totalVolume: 7800, setCount: 4 },
        { completedAt: "2026-10-10T10:00:00Z", workoutId: "w2", topWeight: 325, topReps: 5, estimatedOneRepMax: 366, totalVolume: 8200, setCount: 4 },
        { completedAt: "2026-10-17T10:00:00Z", workoutId: "w3", topWeight: 335, topReps: 5, estimatedOneRepMax: 377, totalVolume: 8600, setCount: 4 },
        { completedAt: "2026-10-24T10:00:00Z", workoutId: "w4", topWeight: 340, topReps: 5, estimatedOneRepMax: 383, totalVolume: 8900, setCount: 4 },
        { completedAt: "2026-10-31T10:00:00Z", workoutId: "w5", topWeight: 345, topReps: 5, estimatedOneRepMax: 388, totalVolume: 9000, setCount: 4 },
      ],
    },
    {
      name: "Conventional Deadlift",
      muscleGroup: "Back",
      maxWeight: 405,
      maxReps: 3,
      avgTopWeight: 385,
      maxEstimated1RM: 429,
      totalVolume: 31200,
      sessions: 4,
      totalSets: 16,
      weightChangePercent: 11.0,
      trend: [
        { completedAt: "2026-10-05T10:00:00Z", workoutId: "w1", topWeight: 365, topReps: 5, estimatedOneRepMax: 411, totalVolume: 7300, setCount: 4 },
        { completedAt: "2026-10-12T10:00:00Z", workoutId: "w2", topWeight: 385, topReps: 4, estimatedOneRepMax: 422, totalVolume: 7800, setCount: 4 },
        { completedAt: "2026-10-23T10:00:00Z", workoutId: "w3", topWeight: 405, topReps: 3, estimatedOneRepMax: 429, totalVolume: 8100, setCount: 4 },
      ],
    },
    {
      name: "Standing Overhead Press",
      muscleGroup: "Shoulders",
      maxWeight: 155,
      maxReps: 5,
      avgTopWeight: 155,
      maxEstimated1RM: 174,
      totalVolume: 16800,
      sessions: 4,
      totalSets: 16,
      weightChangePercent: 0,
      trend: [
        { completedAt: "2026-10-07T10:00:00Z", workoutId: "w1", topWeight: 155, topReps: 5, estimatedOneRepMax: 174, totalVolume: 4200, setCount: 4 },
        { completedAt: "2026-10-14T10:00:00Z", workoutId: "w2", topWeight: 155, topReps: 5, estimatedOneRepMax: 174, totalVolume: 4200, setCount: 4 },
        { completedAt: "2026-10-21T10:00:00Z", workoutId: "w3", topWeight: 155, topReps: 4, estimatedOneRepMax: 174, totalVolume: 4100, setCount: 4 },
        { completedAt: "2026-10-28T10:00:00Z", workoutId: "w4", topWeight: 155, topReps: 4, estimatedOneRepMax: 174, totalVolume: 4100, setCount: 4 },
      ],
    },
    {
      name: "Incline Dumbbell Press",
      muscleGroup: "Chest",
      maxWeight: 85,
      maxReps: 8,
      avgTopWeight: 80,
      maxEstimated1RM: 105,
      totalVolume: 19800,
      sessions: 4,
      totalSets: 16,
      weightChangePercent: 13.3,
      trend: [
        { completedAt: "2026-10-02T10:00:00Z", workoutId: "w1", topWeight: 75, topReps: 8, estimatedOneRepMax: 93, totalVolume: 4400, setCount: 4 },
        { completedAt: "2026-10-11T10:00:00Z", workoutId: "w2", topWeight: 80, topReps: 8, estimatedOneRepMax: 99, totalVolume: 4800, setCount: 4 },
        { completedAt: "2026-10-20T10:00:00Z", workoutId: "w3", topWeight: 85, topReps: 8, estimatedOneRepMax: 105, totalVolume: 5300, setCount: 4 },
      ],
    },
  ],
  muscleGroups: [
    { name: "Chest", totalVolume: 54000, totalSets: 40, exerciseCount: 2, exercises: [] },
    { name: "Legs", totalVolume: 42500, totalSets: 20, exerciseCount: 1, exercises: [] },
    { name: "Back", totalVolume: 31200, totalSets: 16, exerciseCount: 1, exercises: [] },
    { name: "Shoulders", totalVolume: 16800, totalSets: 16, exerciseCount: 1, exercises: [] },
  ],
  acwr: {
    acuteLoad: 27900,
    chronicLoad: 24800,
    ratio: 1.12,
    zone: "optimal",
    recommendation: "Prime Training Zone (0.8–1.3). Fatigue adaptation is steady and neuromuscular readiness is primed for progressive overload and PR attempts.",
  },
  symmetry: {
    pushVolume: 70800,
    pullVolume: 67200,
    pushToPullRatio: 1.05,
    quadVolume: 42500,
    hamstringVolume: 36000,
    quadToHamRatio: 1.18,
    anteriorVolume: 70800,
    posteriorVolume: 84500,
    coreVolume: 12000,
    armsVolume: 18500,
    radarPoints: [
      { label: "Chest (Push)", value: 54000, normalizedPercent: 92 },
      { label: "Back (Pull)", value: 48500, normalizedPercent: 86 },
      { label: "Legs (Quad)", value: 42500, normalizedPercent: 100 },
      { label: "Hamstrings", value: 36000, normalizedPercent: 85 },
      { label: "Shoulders", value: 16800, normalizedPercent: 55 },
      { label: "Arms", value: 18500, normalizedPercent: 60 },
    ],
  },
  intensity: {
    zone1Count: 18,
    zone1Volume: 22000,
    zone1Percent: 24,
    zone2Count: 42,
    zone2Volume: 74000,
    zone2Percent: 55,
    zone3Count: 16,
    zone3Volume: 28900,
    zone3Percent: 21,
    totalTrackedSets: 76,
  },
  multiLift: {
    availableLifts: ["Barbell Bench Press", "Barbell Back Squat", "Conventional Deadlift"],
    timeline: [
      { date: "2026-10-01", "Barbell Bench Press": 0, "Barbell Back Squat": 0, "Conventional Deadlift": 0 },
      { date: "2026-10-10", "Barbell Bench Press": 4.4, "Barbell Back Squat": 3.2, "Conventional Deadlift": 5.5 },
      { date: "2026-10-20", "Barbell Bench Press": 8.9, "Barbell Back Squat": 6.3, "Conventional Deadlift": 8.2 },
      { date: "2026-10-31", "Barbell Bench Press": 12.5, "Barbell Back Squat": 9.5, "Conventional Deadlift": 11.0 },
    ],
  },
  plateaus: [
    {
      exercise: "Standing Overhead Press",
      sessionsStagnant: 4,
      currentMaxWeight: 155,
      estimated1RM: 174,
      insightType: "plateau",
      message: "Standing Overhead Press has stalled at 155 lbs across the last 4 sessions.",
      actionableCue: "Drop working weight by 10% (140 lbs) for 1 session (Dynamic Effort / speed work), then progress in 2.5 lb micro-increments or wave down to 5x3.",
    },
    {
      exercise: "Barbell Bench Press",
      sessionsStagnant: 0,
      currentMaxWeight: 255,
      estimated1RM: 287,
      insightType: "breakthrough",
      message: "Barbell Bench Press shows strong progressive overload (+12.5% strength gain across block).",
      actionableCue: "Maintain current linear progression cadence. Re-test 1RM milestone in 2 weeks.",
    },
  ],
  overall: {
    totalWorkouts: 44,
    totalExercises: 14,
    totalSets: 176,
    totalVolume: 142850,
    weeklyAvgWorkouts: 3.8,
    heaviestSet: { exercise: "Conventional Deadlift", weight: 405, reps: 3, completedAt: "2026-10-23T12:00:00Z" },
    highestRepSet: { exercise: "Barbell Bench Press", weight: 225, reps: 8, completedAt: "2026-10-01T10:00:00Z" },
    best1RM: { exercise: "Conventional Deadlift", weight: 405, reps: 3, estimated1RM: 429, completedAt: "2026-10-23T12:00:00Z" },
    mostTrainedExercise: { exercise: "Barbell Bench Press", sessions: 18 },
  },
};

export default function MobilePreviewAnalyticsPage() {
  const [profileName] = useState("Collin Shapiro (44 Workouts)");

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", paddingBottom: "50px" }}>
      {/* Mobile Top Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          height: "54px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "15px",
            }}
          >
            S
          </div>
          <span style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>STRKYR</span>
          <span
            style={{
              fontSize: "10px",
              color: "#16a34a",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "2px 6px",
              borderRadius: "6px",
              fontWeight: 800,
            }}
          >
            MOBILE DEV
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a
            href="/dashboard"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#2563eb",
              textDecoration: "none",
              padding: "5px 10px",
              background: "#eff6ff",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
            }}
          >
            Dashboard →
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: "12px 10px", maxWidth: "480px", margin: "0 auto" }}>
        {/* Banner with profile indicator */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "8px 12px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155", fontWeight: 700 }}>
            <Smartphone size={16} style={{ color: "#2563eb" }} />
            <span>Interactive Mobile Dev Preview</span>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
            {profileName}
          </span>
        </div>

        {/* The Revamped Analytics Component */}
        <AnalyticsView analytics={collinAnalytics} />
      </main>
    </div>
  );
}
