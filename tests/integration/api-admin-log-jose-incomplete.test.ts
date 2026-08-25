import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/admin/log-jose-incomplete/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
    client: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Admin Route: Log Jose Incomplete Workout to Collin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return planned workouts for Jose via GET", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "trainer-jose",
      name: "Jose Dildine",
      email: "chisailor67@gmail.com",
      clients: [{ id: "client-collin", name: "Collin", email: "collin.shapiro1@gmail.com", userId: "trainer-jose" }],
    } as any);

    vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([
      {
        id: "planned-session-1",
        clientId: "client-collin",
        status: "PLANNED",
        createdAt: new Date("2026-08-24T12:00:00Z"),
        notes: "Draft session",
        exercises: [],
        client: { name: "Collin", email: "collin.shapiro1@gmail.com" },
      } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/admin/log-jose-incomplete");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.plannedWorkouts.length).toBe(1);
    expect(data.plannedWorkouts[0].id).toBe("planned-session-1");
  });

  it("should update candidate planned workout to COMPLETED for Collin on August 24 via POST", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "trainer-jose",
      name: "Jose Dildine",
      email: "chisailor67@gmail.com",
      clients: [{ id: "client-collin", name: "Collin Shapiro", email: "collin.shapiro1@gmail.com", userId: "trainer-jose" }],
    } as any);

    vi.mocked(prisma.workoutSession.findFirst).mockResolvedValue({
      id: "planned-session-1",
      clientId: "client-collin",
      status: "PLANNED",
      notes: "Leg Press & Bench block",
      exercises: [{ id: "ex-1", name: "Leg Press", sets: [{ weight: 450, reps: 10 }] }],
    } as any);

    vi.mocked(prisma.workoutSession.update).mockResolvedValue({
      id: "planned-session-1",
      status: "COMPLETED",
      completedAt: new Date("2026-08-24T17:30:00.000Z"),
      loggedByName: "Jose Dildine",
      loggedByRole: "TRAINER",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/admin/log-jose-incomplete", { method: "POST" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.workoutSession.update).toHaveBeenCalled();
  });
});
