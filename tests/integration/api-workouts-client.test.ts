import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getClientWorkouts } from "@/app/api/workouts/client/route";
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
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    client: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
    },
    workout: {
      findMany: vi.fn(),
    },
  },
}));

describe("GET /api/workouts/client - Name Variation & Multi-Client Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should match both 'Collin' and 'Collin S.' when logged in user is 'Collin Shapiro'", async () => {
    (getServerSession as any).mockResolvedValue({
      user: {
        id: "user-collin",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        role: "CLIENT",
      },
    });

    (prisma.user.findFirst as any).mockResolvedValue({
      id: "user-collin",
      name: "Collin Shapiro",
      email: "collin.shapiro1@gmail.com",
      clientProfileId: "client-collin-1",
    });

    (prisma.client.findMany as any).mockImplementation((args: any) => {
      // If searching by email
      if (args.where?.email) {
        return Promise.resolve([{ id: "client-collin-1" }]);
      }
      // If searching by name variants (Collin Shapiro, Collin, Collin S., Collin S)
      if (args.where?.OR) {
        return Promise.resolve([
          { id: "client-collin-1", name: "Collin" },
          { id: "client-collin-2", name: "Collin S." },
        ]);
      }
      return Promise.resolve([]);
    });

    const mockSessions = [
      {
        id: "session-aug24",
        clientId: "client-collin-2",
        status: "COMPLETED",
        notes: "Yesterday's heavy leg session",
        createdAt: new Date("2026-08-24T15:00:00Z"),
        exercises: [],
        client: { id: "client-collin-2", name: "Collin S.", email: null },
      },
      {
        id: "session-aug21",
        clientId: "client-collin-1",
        status: "COMPLETED",
        notes: "Upper body strength",
        createdAt: new Date("2026-08-21T15:00:00Z"),
        exercises: [],
        client: { id: "client-collin-1", name: "Collin", email: "collin.shapiro1@gmail.com" },
      },
    ];

    (prisma.workoutSession.findMany as any).mockResolvedValue(mockSessions);
    (prisma.workout.findMany as any).mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/workouts/client");
    const res = await getClientWorkouts(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(2);
    expect(data[0].id).toBe("session-aug24");
    expect(data[0].notes).toBe("Yesterday's heavy leg session");

    // Verify workoutSession.findMany was called with both client IDs (client-collin-1 and client-collin-2)
    const findManyCall = (prisma.workoutSession.findMany as any).mock.calls[0][0];
    const clientInClause = findManyCall.where.OR.find((cond: any) => cond.clientId?.in);
    expect(clientInClause.clientId.in).toContain("client-collin-1");
    expect(clientInClause.clientId.in).toContain("client-collin-2");
  });
});
