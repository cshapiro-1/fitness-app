import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/workouts/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
    },
    workoutSession: {
      deleteMany: vi.fn(),
    },
    trainingProgram: {
      updateMany: vi.fn(),
    },
  },
}));

describe("DELETE /api/workouts - Bulk Removal of Assigned Workouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully remove all planned and in-progress workouts for a client and reset active program", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Mike" },
    });

    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-123",
      userId: "trainer-1",
      name: "Alex Athlete",
      email: "alex@athlete.com",
    });

    (prisma.workoutSession.deleteMany as any).mockResolvedValue({ count: 18 });
    (prisma.trainingProgram.updateMany as any).mockResolvedValue({ count: 1 });

    const req = new NextRequest("http://localhost:3000/api/workouts?clientId=client-123", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.count).toBe(18);
    expect(json.message).toContain("Successfully removed 18 assigned workouts");

    expect(prisma.workoutSession.deleteMany).toHaveBeenCalledWith({
      where: {
        clientId: "client-123",
        status: { in: ["PLANNED", "IN_PROGRESS"] },
      },
    });

    expect(prisma.trainingProgram.updateMany).toHaveBeenCalledWith({
      where: {
        clientId: "client-123",
        status: "IN_PROGRESS",
      },
      data: {
        status: "DRAFT",
        clientId: null,
        startDate: null,
        endDate: null,
      },
    });
  });

  it("should remove planned workouts for a specific programId when provided", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Mike" },
    });

    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-123",
      userId: "trainer-1",
      name: "Alex Athlete",
      email: "alex@athlete.com",
    });

    (prisma.workoutSession.deleteMany as any).mockResolvedValue({ count: 12 });
    (prisma.trainingProgram.updateMany as any).mockResolvedValue({ count: 1 });

    const req = new NextRequest("http://localhost:3000/api/workouts?clientId=client-123&programId=prog-abc", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.count).toBe(12);

    expect(prisma.workoutSession.deleteMany).toHaveBeenCalledWith({
      where: {
        clientId: "client-123",
        programId: "prog-abc",
        status: { in: ["PLANNED", "IN_PROGRESS"] },
      },
    });
  });
});
