import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getPrograms, POST as createProgram } from "@/app/api/programs/route";
import { GET as getProgramById, PUT as updateProgram, DELETE as deleteProgram } from "@/app/api/programs/[id]/route";
import { POST as assignProgram } from "@/app/api/programs/[id]/assign/route";
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
    user: {
      findUnique: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    trainingProgram: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    programWorkoutTemplate: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Training Programs API & Assignment Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a training program with any custom duration weeks and custom deload frequency", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Mike" },
    });

    const mockCreatedProgram = {
      id: "prog-123",
      trainerId: "trainer-1",
      name: "10-Week Custom Prep Block",
      durationWeeks: 10,
      status: "DRAFT",
      progressionRate: 3.0,
      deloadFrequency: 5,
      workoutTemplates: [
        {
          id: "wt-1",
          name: "Push Day",
          order: 0,
          cadence: "WEEKLY",
          exercises: [
            {
              id: "ex-1",
              name: "Bench Press",
              targetSets: 4,
              targetReps: "6-8",
              suggestedWeight: 185,
              supersetGroup: "A1",
              restSeconds: 45,
            },
          ],
        },
      ],
    };

    (prisma.trainingProgram.create as any).mockResolvedValue(mockCreatedProgram);

    const req = new NextRequest("http://localhost:3000/api/programs", {
      method: "POST",
      body: JSON.stringify({
        name: "10-Week Custom Prep Block",
        durationWeeks: 10,
        progressionRate: 3.0,
        deloadFrequency: 5,
        workoutTemplates: [
          {
            name: "Push Day",
            cadence: "WEEKLY",
            exercises: [
              {
                name: "Bench Press",
                targetSets: 4,
                targetReps: "6-8",
                suggestedWeight: 185,
                supersetGroup: "A1",
                restSeconds: 45,
              },
            ],
          },
        ],
      }),
    });

    const res = await createProgram(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.program.name).toBe("10-Week Custom Prep Block");
    expect(json.program.durationWeeks).toBe(10);
    expect(json.program.deloadFrequency).toBe(5);
  });

  it("should return both master templates and client-assigned programs for trainer", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Mike" },
    });

    const mockPrograms = [
      {
        id: "p1",
        name: "Master Template 1",
        trainerId: "trainer-1",
        clientId: null,
        workoutTemplates: [],
        workoutSessions: [],
      },
      {
        id: "p2",
        name: "Assigned Client Program",
        trainerId: "trainer-1",
        clientId: "client-1",
        workoutTemplates: [],
        workoutSessions: [],
      },
    ];

    (prisma.trainingProgram.findMany as any).mockResolvedValue(mockPrograms);

    const req = new NextRequest("http://localhost:3000/api/programs?clientId=client-1");
    const res = await getPrograms(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.programs.length).toBe(2);
    expect(prisma.trainingProgram.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trainerId: "trainer-1",
          OR: [{ clientId: "client-1" }, { clientId: null }],
        }),
      })
    );
  });

  it("should assign a program to a client and materialize planned workouts over the duration", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Mike" },
    });

    const mockProgram = {
      id: "prog-123",
      trainerId: "trainer-1",
      name: "6-Week Hypertrophy Surge",
      durationWeeks: 6,
      status: "DRAFT",
      progressionRate: 2.5,
      deloadFrequency: 4,
      workoutTemplates: [
        {
          id: "wt-1",
          name: "Push Day",
          order: 0,
          cadence: "WEEKLY",
          dayOfWeek: 1, // Monday
          exercises: [
            {
              id: "ex-1",
              name: "Bench Press",
              order: 0,
              targetSets: 3,
              targetReps: "8",
              suggestedWeight: 100,
              rpe: 8,
              supersetGroup: null,
              restSeconds: 90,
            },
          ],
        },
      ],
    };

    (prisma.trainingProgram.findUnique as any).mockResolvedValue(mockProgram);
    (prisma.client.findUnique as any).mockResolvedValue({ id: "client-abc", name: "Alex Athlete" });
    (prisma.workoutSession.deleteMany as any).mockResolvedValue({ count: 0 });
    (prisma.workoutSession.create as any).mockResolvedValue({ id: "session-1" });
    (prisma.trainingProgram.update as any).mockResolvedValue({
      ...mockProgram,
      status: "IN_PROGRESS",
      clientId: "client-abc",
    });

    const req = new NextRequest("http://localhost:3000/api/programs/prog-123/assign", {
      method: "POST",
      body: JSON.stringify({
        clientId: "client-abc",
        startDate: "2026-09-01",
      }),
    });

    const res = await assignProgram(req, { params: Promise.resolve({ id: "prog-123" }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.scheduledCount).toBe(6); // 6 weeks * 1 day/wk
    expect(prisma.workoutSession.create).toHaveBeenCalledTimes(6);
  });

  it("should update in-progress program and sync changes to upcoming planned sessions", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Mike" },
    });

    const existingProgram = {
      id: "prog-123",
      trainerId: "trainer-1",
      clientId: "client-abc",
      name: "6-Week Hypertrophy Surge",
      durationWeeks: 6,
      startDate: "2026-09-01",
      status: "IN_PROGRESS",
      progressionRate: 2.5,
      deloadFrequency: 4,
      workoutTemplates: [],
    };

    (prisma.trainingProgram.findUnique as any)
      .mockResolvedValueOnce(existingProgram) // for initial check
      .mockResolvedValueOnce({ ...existingProgram, name: "Updated Program Title" }); // for return

    (prisma.trainingProgram.update as any).mockResolvedValue(existingProgram);
    (prisma.programWorkoutTemplate.deleteMany as any).mockResolvedValue({ count: 1 });
    (prisma.programWorkoutTemplate.create as any).mockResolvedValue({ id: "wt-new" });
    (prisma.workoutSession.findMany as any).mockResolvedValue([{ programWeek: 2 }]);
    (prisma.workoutSession.deleteMany as any).mockResolvedValue({ count: 4 });
    (prisma.workoutSession.create as any).mockResolvedValue({ id: "session-new" });

    const req = new NextRequest("http://localhost:3000/api/programs/prog-123", {
      method: "PUT",
      body: JSON.stringify({
        name: "Updated Program Title",
        durationWeeks: 6,
        workoutTemplates: [
          {
            name: "New Day Split",
            cadence: "WEEKLY",
            exercises: [
              {
                name: "Incline Dumbbell Press",
                targetSets: 4,
                targetReps: "10-12",
                suggestedWeight: 60,
                supersetGroup: "B1",
                restSeconds: 60,
              },
            ],
          },
        ],
      }),
    });

    const res = await updateProgram(req, { params: Promise.resolve({ id: "prog-123" }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.program.name).toBe("Updated Program Title");
  });
});
