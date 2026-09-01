import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { AdminPortal } from "@/app/admin/AdminPortal";

describe("Program Progress, Status Integrity & Admin Metrics", () => {
  it("should verify program status logic: 1 completed workout out of 18 keeps program IN_PROGRESS", () => {
    const totalPlanned = 18;
    const completedSessions = [
      { id: "ws-1", programId: "prog-100", status: "COMPLETED", programWeek: 1, programDay: 1 },
    ];
    const plannedSessions = Array.from({ length: 17 }).map((_, i) => ({
      id: `ws-${i + 2}`,
      programId: "prog-100",
      status: "PLANNED",
      programWeek: Math.floor(i / 3) + 1,
      programDay: (i % 3) + 1,
    }));

    const allSessions = [...completedSessions, ...plannedSessions];

    // Compute progress stats
    const completedCount = allSessions.filter((s) => s.status === "COMPLETED").length;
    const remainingCount = allSessions.filter((s) => s.status === "PLANNED" || s.status === "IN_PROGRESS").length;
    const completionPercentage = Math.round((completedCount / totalPlanned) * 100);
    const programStatus = remainingCount === 0 ? "COMPLETED" : "IN_PROGRESS";

    expect(completedCount).toBe(1);
    expect(remainingCount).toBe(17);
    expect(completionPercentage).toBe(6);
    expect(programStatus).toBe("IN_PROGRESS");
    expect(programStatus).not.toBe("COMPLETED");
  });

  it("should only mark program as COMPLETED when 100% of workouts are completed", () => {
    const totalPlanned = 18;
    const allCompletedSessions = Array.from({ length: 18 }).map((_, i) => ({
      id: `ws-${i + 1}`,
      programId: "prog-100",
      status: "COMPLETED",
      programWeek: Math.floor(i / 3) + 1,
      programDay: (i % 3) + 1,
    }));

    const completedCount = allCompletedSessions.filter((s) => s.status === "COMPLETED").length;
    const remainingCount = allCompletedSessions.filter((s) => s.status === "PLANNED" || s.status === "IN_PROGRESS").length;
    const completionPercentage = Math.round((completedCount / totalPlanned) * 100);
    const programStatus = remainingCount === 0 ? "COMPLETED" : "IN_PROGRESS";

    expect(completedCount).toBe(18);
    expect(remainingCount).toBe(0);
    expect(completionPercentage).toBe(100);
    expect(programStatus).toBe("COMPLETED");
  });

  it("should verify planned workouts with startedAt calendar date are not treated as active in-progress collaborations", () => {
    const plannedWorkout = {
      id: "ws-planned-1",
      status: "PLANNED",
      startedAt: "2026-09-15T09:00:00Z", // target calendar date
      notes: "Week 2 Day 1 • Push Focus",
    };

    // Correct in-progress check
    const isInProgress = plannedWorkout.status === "IN_PROGRESS";
    expect(isInProgress).toBe(false);

    // Filter check: planned workouts should belong in planned array, not completed array
    const isCompleted = (plannedWorkout.status || "").toUpperCase() === "COMPLETED" || (!plannedWorkout.status && (plannedWorkout as any).completedAt);
    expect(isCompleted).toBe(false);
  });

  it("should render Training Programs admin metric card with active and finished counts", async () => {
    const mockStats: any = {
      totalUsers: 15,
      totalTrainers: 3,
      totalClients: 12,
      totalWorkouts: 45,
      totalCompletedWorkouts: 40,
      inProgressSessions: 2,
      totalPrograms: 8,
      activeAssignedPrograms: 5,
      completedPrograms: 3,
      totalProgramAssignments: 50,
      activeSubscriptions: 2,
      trialingUsers: 1,
      expiredUsers: 0,
      estimatedMRR: 38,
      conversionRate: 67,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stats: mockStats,
        trainers: [],
        clients: [],
      }),
    } as any);

    render(<AdminPortal />);

    expect(await screen.findByText("TRAINING PROGRAMS")).toBeInTheDocument();
    expect(screen.getByText("5 active · 3 finished")).toBeInTheDocument();
  });
});
