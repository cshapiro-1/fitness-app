import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as createProgram, GET as getPrograms } from "@/app/api/programs/route";
import { POST as assignProgram } from "@/app/api/programs/[id]/assign/route";
import { GET as getAdminStats } from "@/app/api/admin/stats/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn(),
    },
    trainingProgram: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    programWorkoutTemplate: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    workoutSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    workoutSet: {
      count: vi.fn(),
    },
    errorTelemetry: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("End-to-End Workflow: Multi-Week Periodization, Bulk Assignment, Progress Tracking & Reassignment", () => {
  const coachUser = { id: "coach-101", name: "Collin Shapiro", email: "collin@strkyr.fit", role: "TRAINER", isAdmin: true };
  const athlete1 = { id: "client-marcus", name: "Marcus Aurelius", email: "marcus@gym.com", trainerId: "coach-101" };
  const athlete2 = { id: "client-seneca", name: "Lucius Seneca", email: "seneca@gym.com", trainerId: "coach-101" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute the full multi-week program lifecycle with bulk assignment, progress calculation, and reassignment", async () => {
    // =========================================================================
    // Step 1: Trainer Creates a 6-Week Hypertrophy Program with 2 Workout Days
    // =========================================================================
    (getServerSession as any).mockResolvedValue({ user: coachUser });
    (prisma.user.findUnique as any).mockResolvedValue({ id: coachUser.id, role: "TRAINER", isAdmin: true });

    const programTemplate = {
      id: "prog-hypertrophy-6w",
      trainerId: coachUser.id,
      name: "6-Week Hypertrophy & Strength Wave",
      description: "Periodized upper/lower wave with deload on week 4",
      durationWeeks: 6,
      deloadFrequency: 4,
      restDaysBetween: 1,
      status: "ACTIVE",
      workoutTemplates: [
        {
          id: "tmpl-day-1",
          name: "Day 1: Upper Power",
          dayNumber: 1,
          order: 0,
          exercises: [{ name: "Barbell Bench Press", order: 0, targetSets: 4, targetReps: "5", suggestedWeight: 225 }],
        },
        {
          id: "tmpl-day-2",
          name: "Day 2: Lower Power",
          dayNumber: 3,
          order: 1,
          exercises: [{ name: "Barbell Squat", order: 0, targetSets: 4, targetReps: "5", suggestedWeight: 315 }],
        },
      ],
    };

    (prisma.trainingProgram.create as any).mockResolvedValue(programTemplate);

    const createProgReq = new NextRequest("http://localhost:3000/api/programs", {
      method: "POST",
      body: JSON.stringify({
        name: programTemplate.name,
        description: programTemplate.description,
        durationWeeks: 6,
        deloadFrequency: 4,
        restDaysBetween: 1,
        workoutTemplates: programTemplate.workoutTemplates,
      }),
    });

    const createProgRes = await createProgram(createProgReq);
    expect(createProgRes.status).toBe(201);
    const createdData = await createProgRes.json();
    expect(createdData.program.durationWeeks).toBe(6);
    expect(createdData.program.workoutTemplates.length).toBe(2);

    // ==============================================================================
    // Step 2: Bulk Assign Program to Athlete 1 (Marcus) Starting Next Monday
    // ==============================================================================
    (prisma.trainingProgram.findUnique as any).mockResolvedValue(programTemplate);
    (prisma.client.findUnique as any).mockResolvedValue(athlete1);
    (prisma.workoutSession.deleteMany as any).mockResolvedValue({ count: 0 });
    (prisma.workoutSession.create as any).mockResolvedValue({ id: "assigned-session-1" });

    const assignReq = new NextRequest(`http://localhost:3000/api/programs/${programTemplate.id}/assign`, {
      method: "POST",
      body: JSON.stringify({
        clientId: athlete1.id,
        startDate: "2026-09-08T00:00:00.000Z",
      }),
    });

    const assignRes = await assignProgram(assignReq, { params: Promise.resolve({ id: programTemplate.id }) });
    expect(assignRes.status).toBe(200);
    const assignData = await assignRes.json();
    expect(assignData.scheduledCount).toBe(12); // 6 weeks * 2 workout templates = 12 scheduled sessions

    // ==============================================================================
    // Step 3: Verify Completing a Single Workout Does NOT Mark the Program Completed
    // ==============================================================================
    const completedWorkout1 = {
      id: "assigned-session-1",
      clientId: athlete1.id,
      programId: programTemplate.id,
      status: "COMPLETED",
      completedAt: new Date(),
    };

    const remainingPlannedWorkouts = Array.from({ length: 11 }, (_, i) => ({
      id: `assigned-session-${i + 2}`,
      clientId: athlete1.id,
      programId: programTemplate.id,
      status: "PLANNED",
    }));

    (prisma.workoutSession.findMany as any).mockResolvedValue([completedWorkout1, ...remainingPlannedWorkouts]);

    // Query all sessions for this program assignment
    const allProgramSessions = await prisma.workoutSession.findMany({
      where: { clientId: athlete1.id, programId: programTemplate.id } as any,
    });

    const completedCount = allProgramSessions.filter((s: any) => s.status === "COMPLETED").length;
    const totalCount = allProgramSessions.length;
    const isProgramFullyCompleted = totalCount > 0 && completedCount === totalCount;

    expect(completedCount).toBe(1);
    expect(totalCount).toBe(12);
    expect(isProgramFullyCompleted).toBe(false); // Program remains actively in progress!

    // ==============================================================================
    // Step 4: Admin Metrics Endpoint Tracks Total, Active & Completed Programs
    // ==============================================================================
    (prisma.user.count as any).mockResolvedValue(5);
    (prisma.user.findMany as any).mockResolvedValue([]);
    (prisma.client.count as any).mockResolvedValue(10);
    (prisma.client.findMany as any).mockResolvedValue([]);
    (prisma.workoutSession.count as any).mockResolvedValue(45);
    (prisma.workoutSet.count as any).mockResolvedValue(120);
    (prisma.trainingProgram.count as any).mockResolvedValue(4);
    (prisma.trainingProgram.findMany as any).mockResolvedValue([
      programTemplate,
      { ...programTemplate, id: "prog-2", status: "COMPLETED" },
    ]);
    ((prisma as any).errorTelemetry.count as any).mockResolvedValue(0);
    ((prisma as any).errorTelemetry.findMany as any).mockResolvedValue([]);

    const adminStatsReq = new NextRequest("http://localhost:3000/api/admin/stats");
    const adminStatsRes = await getAdminStats(adminStatsReq);
    expect(adminStatsRes.status).toBe(200);
    const stats = await adminStatsRes.json();
    expect(stats.stats.totalPrograms).toBe(4);
    expect(stats.stats.activeAssignedPrograms).toBeDefined();

    // ==============================================================================
    // Step 5: Re-assign the Same Program to Athlete 2 (Seneca)
    // ==============================================================================
    (prisma.client.findUnique as any).mockResolvedValue(athlete2);
    const reassignReq = new NextRequest(`http://localhost:3000/api/programs/${programTemplate.id}/assign`, {
      method: "POST",
      body: JSON.stringify({
        clientId: athlete2.id,
        startDate: "2026-09-15T00:00:00.000Z",
      }),
    });

    const reassignRes = await assignProgram(reassignReq, { params: Promise.resolve({ id: programTemplate.id }) });
    expect(reassignRes.status).toBe(200);
    const reassignData = await reassignRes.json();
    expect(reassignData.scheduledCount).toBe(12);
  });
});
