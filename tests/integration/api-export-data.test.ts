import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/user/export-data/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    client: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe("GDPR & CCPA Data Portability API (GET /api/user/export-data)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if request is unauthenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return structured GDPR/CCPA export bundle with user profile and workout trees for authenticated user", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user-trainer-1", email: "trainer@gym.com", name: "Coach Mike" },
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-trainer-1",
      name: "Coach Mike",
      email: "trainer@gym.com",
      phone: "555-1234",
      role: "TRAINER",
      fitnessGoals: "Hypertrophy",
      notes: "CSCS Coach",
      subscriptionStatus: "active",
      subscribedUntil: new Date("2027-01-01"),
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-08-01"),
    });

    (prisma.client.findMany as any).mockResolvedValue([
      {
        id: "client-a",
        name: "Athlete Alice",
        email: "alice@athlete.com",
        phone: null,
        fitnessGoals: "Strength",
        notes: null,
        createdAt: new Date("2026-02-01"),
        workoutSessions: [
          {
            id: "session-1",
            status: "COMPLETED",
            startedAt: new Date("2026-08-10T10:00:00Z"),
            completedAt: new Date("2026-08-10T11:00:00Z"),
            notes: "Great session",
            createdAt: new Date("2026-08-10T10:00:00Z"),
            exercises: [
              {
                id: "ex-1",
                name: "Bench Press",
                category: "STRENGTH",
                isBodyweight: false,
                order: 0,
                sets: [{ id: "set-1", order: 0, weight: 185, reps: 5, notes: null }],
              },
            ],
          },
        ],
      },
    ]);

    (prisma.client.findFirst as any).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.formatVersion).toBe("STRKYR-GDPR-CCPA-1.0");
    expect(data.compliance.gdprCompliant).toBe(true);
    expect(data.compliance.ccpaCompliant).toBe(true);
    expect(data.userProfile.email).toBe("trainer@gym.com");
    expect(data.trainerData.totalClients).toBe(1);
    expect(data.trainerData.clients[0].name).toBe("Athlete Alice");
    expect(data.trainerData.clients[0].workoutSessions[0].exercises[0].name).toBe("Bench Press");

    const contentDisposition = res.headers.get("Content-Disposition");
    expect(contentDisposition).toContain("attachment; filename=");
  });
});
