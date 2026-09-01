import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as heartbeatPOST } from "@/app/api/user/heartbeat/route";
import { GET as adminStatsGET } from "@/app/api/admin/stats/route";
import { DELETE as adminUserDELETE } from "@/app/api/admin/users/[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/stripe", () => ({
  stripe: null,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    client: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    workoutSession: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    workoutSet: {
      count: vi.fn(),
    },
    trainingProgram: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
  },
}));

describe("User Session Telemetry & Activity Tracking Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/user/heartbeat", () => {
    it("should return 401 Unauthorized if no active session", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/user/heartbeat", {
        method: "POST",
        body: JSON.stringify({ durationSeconds: 120 }),
      });

      const res = await heartbeatPOST(req);
      expect(res.status).toBe(401);
    });

    it("should update User and linked Client lastActiveAt and lastSessionDurationSeconds", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@strkyr.fit" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "trainer-1",
        clientProfileId: "client-profile-1",
        lastLoginAt: new Date("2026-08-31T08:00:00Z"),
        lastSessionDurationSeconds: 60,
      } as any);

      const mockNow = new Date("2026-08-31T08:15:00Z");
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "trainer-1",
        lastActiveAt: mockNow,
        lastSessionDurationSeconds: 900,
        totalSessionSeconds: 900,
      } as any);

      vi.mocked(prisma.client.update).mockResolvedValue({
        id: "client-profile-1",
        lastActiveAt: mockNow,
        lastSessionDurationSeconds: 900,
        totalSessionSeconds: 900,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/user/heartbeat", {
        method: "POST",
        body: JSON.stringify({ durationSeconds: 900 }),
      });

      const res = await heartbeatPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.lastSessionDurationSeconds).toBe(900);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "trainer-1" },
          data: expect.objectContaining({
            lastSessionDurationSeconds: 900,
          }),
        })
      );
      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "client-profile-1" },
          data: expect.objectContaining({
            lastSessionDurationSeconds: 900,
          }),
        })
      );
    });
  });

  describe("GET /api/admin/stats with Organic vs Admin Usage Separation", () => {
    it("should separate admin/developer usage from organic customer usage", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "admin-collin", email: "collin.shapiro1@gmail.com" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin-collin",
        isAdmin: true,
      } as any);

      vi.mocked(prisma.user.count).mockResolvedValue(2);
      vi.mocked(prisma.client.count).mockResolvedValue(1);
      vi.mocked(prisma.workoutSession.count).mockResolvedValue(10);
      vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.workoutSet.count).mockResolvedValue(40);

      const now = new Date("2026-08-31T08:10:00Z");

      vi.mocked(prisma.user.findMany).mockResolvedValue([
        // Admin / Dev user (Collin)
        {
          id: "admin-collin",
          name: "Collin Shapiro",
          email: "collin.shapiro1@gmail.com",
          image: null,
          role: "ADMIN",
          isAdmin: true,
          subscriptionStatus: "active",
          trialEndsAt: null,
          subscribedUntil: new Date("2099-01-01"),
          lastLoginAt: now,
          lastActiveAt: now,
          lastSessionDurationSeconds: 7200,
          loginCount: 50,
          totalSessionSeconds: 144000,
          createdAt: now,
          _count: { clients: 1, loggedWorkouts: 20 },
        },
        // Organic Customer Trainer (Coach Tim)
        {
          id: "trainer-tim",
          name: "Coach Tim",
          email: "tim@gym.com",
          image: null,
          role: "TRAINER",
          isAdmin: false,
          subscriptionStatus: "active",
          trialEndsAt: null,
          subscribedUntil: new Date("2027-01-01"),
          lastLoginAt: now,
          lastActiveAt: now,
          lastSessionDurationSeconds: 1800,
          loginCount: 4,
          totalSessionSeconds: 7200,
          createdAt: now,
          _count: { clients: 2, loggedWorkouts: 10 },
        },
      ] as any);

      vi.mocked(prisma.client.findMany).mockResolvedValue([
        // Organic Customer Client (Sarah)
        {
          id: "client-sarah",
          name: "Athlete Sarah",
          email: "sarah@athlete.com",
          phone: null,
          image: null,
          lastActiveAt: now,
          lastSessionDurationSeconds: 1200,
          loginCount: 2,
          totalSessionSeconds: 2400,
          createdAt: now,
          user: { id: "trainer-tim", name: "Coach Tim", email: "tim@gym.com" },
          loginUser: {
            id: "user-sarah",
            name: "Athlete Sarah",
            email: "sarah@athlete.com",
            createdAt: now,
            lastLoginAt: now,
            lastActiveAt: now,
            lastSessionDurationSeconds: 1200,
            loginCount: 2,
            totalSessionSeconds: 2400,
          },
          _count: { workoutSessions: 5 },
        },
      ] as any);

      const req = new NextRequest("http://localhost:3000/api/admin/stats");
      const res = await adminStatsGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      // Check tagging
      expect(data.trainers[0].isInternalAdmin).toBe(true); // Collin
      expect(data.trainers[1].isInternalAdmin).toBe(false); // Tim
      expect(data.clients[0].isInternalAdmin).toBe(false); // Sarah

      // Check Organic Separation
      expect(data.stats.organicTrainersCount).toBe(1);
      expect(data.stats.organicClientsCount).toBe(1);
      expect(data.stats.organicTotalLogins).toBe(6); // Tim (4) + Sarah (2)
      expect(data.stats.organicAvgSessionSeconds).toBe(1500); // (1800 + 1200) / 2

      // Check Admin Isolated Metrics
      expect(data.stats.adminTotalLogins).toBe(50); // Collin's 50 logins isolated
      expect(data.stats.adminAvgSessionSeconds).toBe(2880); // 144000 / 50
    });
  });

  describe("DELETE /api/admin/users/[id]", () => {
    it("should allow admin to delete a user account", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "admin-1", email: "collin.shapiro1@gmail.com" },
      } as any);

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ id: "admin-1", isAdmin: true } as any)
        .mockResolvedValueOnce({ id: "target-user-1", email: "coach@fit.com" } as any);

      vi.mocked(prisma.user.delete).mockResolvedValue({ id: "target-user-1" } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/users/target-user-1", {
        method: "DELETE",
      });

      const res = await adminUserDELETE(req, { params: Promise.resolve({ id: "target-user-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "target-user-1" } });
    });
  });
});
