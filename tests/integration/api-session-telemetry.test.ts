import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as heartbeatPOST } from "@/app/api/user/heartbeat/route";
import { GET as adminStatsGET } from "@/app/api/admin/stats/route";
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
    },
    client: {
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    workoutSession: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    workoutSet: {
      count: vi.fn(),
    },
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
      } as any);

      vi.mocked(prisma.client.update).mockResolvedValue({
        id: "client-profile-1",
        lastActiveAt: mockNow,
        lastSessionDurationSeconds: 900,
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

  describe("GET /api/admin/stats with Activity Telemetry", () => {
    it("should return lastLoginAt, lastActiveAt, and lastSessionDurationSeconds for trainers and clients", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "admin-1", email: "admin@strkyr.fit" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin-1",
        isAdmin: true,
      } as any);

      vi.mocked(prisma.user.count).mockResolvedValue(2);
      vi.mocked(prisma.client.count).mockResolvedValue(1);
      vi.mocked(prisma.workoutSession.count).mockResolvedValue(10);
      vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.workoutSet.count).mockResolvedValue(40);

      const trainerDate = new Date("2026-08-31T08:10:00Z");
      const clientDate = new Date("2026-08-31T08:20:00Z");

      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          id: "trainer-1",
          name: "Coach Tim",
          email: "tim@strkyr.fit",
          image: null,
          role: "TRAINER",
          isAdmin: false,
          subscriptionStatus: "active",
          trialEndsAt: null,
          subscribedUntil: new Date("2027-01-01"),
          lastLoginAt: trainerDate,
          lastActiveAt: trainerDate,
          lastSessionDurationSeconds: 1800,
          createdAt: trainerDate,
          _count: { clients: 3, loggedWorkouts: 15 },
        },
      ] as any);

      vi.mocked(prisma.client.findMany).mockResolvedValue([
        {
          id: "client-1",
          name: "Athlete Sarah",
          email: "sarah@athlete.com",
          phone: null,
          image: null,
          lastActiveAt: clientDate,
          lastSessionDurationSeconds: 1200,
          createdAt: clientDate,
          user: { id: "trainer-1", name: "Coach Tim", email: "tim@strkyr.fit" },
          loginUser: {
            id: "user-sarah",
            name: "Athlete Sarah",
            email: "sarah@athlete.com",
            createdAt: clientDate,
            lastLoginAt: clientDate,
            lastActiveAt: clientDate,
            lastSessionDurationSeconds: 1200,
          },
          _count: { workoutSessions: 8 },
        },
      ] as any);

      const req = new NextRequest("http://localhost:3000/api/admin/stats");
      const res = await adminStatsGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.trainers).toBeDefined();
      expect(data.trainers.length).toBe(1);
      expect(data.trainers[0].workoutsLoggedForClients).toBe(15);
      expect(data.trainers[0].lastSessionDurationSeconds).toBe(1800);

      expect(data.clients).toBeDefined();
      expect(data.clients.length).toBe(1);
      expect(data.clients[0].workoutsLogged).toBe(8);
      expect(data.clients[0].lastSessionDurationSeconds).toBe(1200);
      expect(data.clients[0].trainerName).toBe("Coach Tim");
    });
  });
});
