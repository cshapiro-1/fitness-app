import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as updateRole } from "@/app/api/user/role/route";
import { GET as getAdminStats } from "@/app/api/admin/stats/route";
import { DELETE as deleteAdminUser } from "@/app/api/admin/users/[id]/route";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    user: {
      count: vi.fn().mockResolvedValue(2),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    client: {
      count: vi.fn().mockResolvedValue(4),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    workoutSession: {
      count: vi.fn().mockResolvedValue(10),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    workout: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    workoutSet: {
      count: vi.fn().mockResolvedValue(30),
    },
    nutritionLog: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    supplementLog: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    trainingProgram: {
      count: vi.fn().mockResolvedValue(1),
    },
  },
}));

describe("Role Switching & Admin Duplicates Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Role Switching (/api/user/role)", () => {
    it("should switch to CLIENT and auto-link an existing self client profile if clientProfileId is missing", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "collin-user-id", email: "collin.shapiro1@gmail.com", role: "TRAINER" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "collin-user-id",
        email: "collin.shapiro1@gmail.com",
        name: "Collin Shapiro",
        role: "TRAINER",
        clientProfileId: null,
        isAdmin: true,
      });

      (prisma.client.findFirst as any).mockResolvedValue({
        id: "collin-self-client-id",
        name: "Collin Shapiro (You)",
        email: "collin.shapiro1@gmail.com",
      });

      (prisma.user.update as any).mockResolvedValue({
        id: "collin-user-id",
        email: "collin.shapiro1@gmail.com",
        role: "CLIENT",
        clientProfileId: "collin-self-client-id",
      });

      const req = new NextRequest("http://localhost:3000/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CLIENT" }),
      });

      const res = await updateRole(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.role).toBe("CLIENT");
      expect(data.clientProfileId).toBe("collin-self-client-id");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "collin-user-id" },
        data: {
          role: "CLIENT",
          clientProfileId: "collin-self-client-id",
        },
      });
    });

    it("should switch to TRAINER mode successfully", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "collin-user-id", email: "collin.shapiro1@gmail.com", role: "CLIENT" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "collin-user-id",
        email: "collin.shapiro1@gmail.com",
        name: "Collin Shapiro",
        role: "CLIENT",
        clientProfileId: "collin-self-client-id",
        isAdmin: true,
      });

      (prisma.user.update as any).mockResolvedValue({
        id: "collin-user-id",
        email: "collin.shapiro1@gmail.com",
        role: "TRAINER",
        clientProfileId: "collin-self-client-id",
      });

      const req = new NextRequest("http://localhost:3000/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "TRAINER" }),
      });

      const res = await updateRole(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.role).toBe("TRAINER");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "collin-user-id" },
        data: {
          role: "TRAINER",
          clientProfileId: "collin-self-client-id",
        },
      });
    });
  });

  describe("2. NextAuth JWT Callback Role Preservation", () => {
    it("should preserve role: CLIENT for collin.shapiro1@gmail.com while ensuring isAdmin: true", async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "collin-user-id",
        email: "collin.shapiro1@gmail.com",
        name: "Collin Shapiro",
        role: "CLIENT",
        isAdmin: true,
        clientProfileId: "collin-self-client-id",
      });

      const initialToken: any = {
        email: "collin.shapiro1@gmail.com",
        role: "CLIENT",
      };

      const resultToken = await jwtCallback!({
        token: initialToken,
        user: undefined as any,
        account: null,
        profile: undefined,
        trigger: "update",
      });

      expect(resultToken.role).toBe("CLIENT");
      expect(resultToken.isAdmin).toBe(true);
      expect(resultToken.clientProfileId).toBe("collin-self-client-id");
      expect(prisma.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: "TRAINER" }),
        })
      );
    });
  });

  describe("3. Admin Stats Deduplication & Separation (/api/admin/stats)", () => {
    it("should self-heal duplicate self-clients by migrating workouts and separating coach self-logs from roster athletes", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "admin-collin", email: "collin.shapiro1@gmail.com", role: "TRAINER", isAdmin: true },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-collin",
        isAdmin: true,
      });

      const trainerCollin = {
        id: "admin-collin",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        role: "TRAINER",
        isAdmin: true,
        clientProfileId: "primary-self-client",
        createdAt: new Date("2026-01-01"),
        loggedWorkouts: [{ createdAt: new Date() }],
        _count: { clients: 3, loggedWorkouts: 25 },
      };

      (prisma.user.findMany as any).mockImplementation((args: any) => {
        if (args?.where?.role) {
          return Promise.resolve([trainerCollin]);
        }
        return Promise.resolve([trainerCollin]);
      });

      const rawClients = [
        {
          id: "primary-self-client",
          userId: "admin-collin",
          name: "Collin Shapiro (You)",
          email: "collin.shapiro1@gmail.com",
          createdAt: new Date("2026-01-02"),
          user: { id: "admin-collin", name: "Collin Shapiro", email: "collin.shapiro1@gmail.com" },
          workoutSessions: [{ createdAt: new Date() }],
          _count: { workoutSessions: 10 },
        },
        {
          id: "orphan-self-client",
          userId: "admin-collin",
          name: "My Workouts",
          email: "collin.shapiro1@gmail.com",
          createdAt: new Date("2026-01-05"),
          user: { id: "admin-collin", name: "Collin Shapiro", email: "collin.shapiro1@gmail.com" },
          workoutSessions: [{ createdAt: new Date() }],
          _count: { workoutSessions: 3 },
        },
        {
          id: "athlete-jane",
          userId: "admin-collin",
          name: "Jane Athlete",
          email: "jane@athlete.com",
          createdAt: new Date("2026-02-01"),
          user: { id: "admin-collin", name: "Collin Shapiro", email: "collin.shapiro1@gmail.com" },
          workoutSessions: [{ createdAt: new Date() }],
          _count: { workoutSessions: 12 },
        },
      ];

      (prisma.client.findMany as any).mockResolvedValue(rawClients);

      const req = new NextRequest("http://localhost/api/admin/stats");
      const res = await getAdminStats(req);
      const data = await res.json();

      expect(res.status).toBe(200);

      // Verify workouts from duplicate profile were safely migrated to primary
      expect(prisma.workoutSession.updateMany).toHaveBeenCalledWith({
        where: { clientId: { in: ["orphan-self-client"] } },
        data: { clientId: "primary-self-client" },
      });

      // Verify duplicate profile was pruned
      expect(prisma.client.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["orphan-self-client"] } },
      });

      // Verify stats separation
      expect(data.stats.rosterAthletesCount).toBe(1);
      expect(data.stats.trainerSelfProfilesCount).toBe(1);

      // Verify client categorization in returned array
      const returnedPrimary = data.clients.find((c: any) => c.id === "primary-self-client");
      expect(returnedPrimary.isTrainerSelfProfile).toBe(true);
      expect(returnedPrimary.trainerName).toBe("Collin Shapiro (Self)");

      const returnedJane = data.clients.find((c: any) => c.id === "athlete-jane");
      expect(returnedJane.isTrainerSelfProfile).toBe(false);
      expect(returnedJane.trainerName).toBe("Collin Shapiro");

      // Verify trainer breakdown
      const returnedTrainer = data.trainers.find((t: any) => t.id === "admin-collin");
      expect(returnedTrainer.clientCount).toBe(1);
      expect(returnedTrainer.personalWorkoutsCount).toBe(13);
      expect(returnedTrainer.workoutsLoggedForClients).toBe(12);
    });
  });

  describe("4. Protective Client Deletion (/api/admin/users/[id])", () => {
    it("should reject deletion of a client profile actively linked as a coach's primary personal profile", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "admin-collin", email: "collin.shapiro1@gmail.com", isAdmin: true },
      });

      (prisma.user.findUnique as any).mockImplementation((args: any) => {
        if (args?.where?.id === "admin-collin") {
          return Promise.resolve({ id: "admin-collin", isAdmin: true });
        }
        return Promise.resolve(null);
      });

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "coach-self-client",
        name: "Collin Shapiro (You)",
        email: "collin.shapiro1@gmail.com",
        userId: "admin-collin",
      });

      (prisma.user.findFirst as any).mockResolvedValue({
        id: "admin-collin",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
      });

      const req = new NextRequest("http://localhost:3000/api/admin/users/coach-self-client", {
        method: "DELETE",
      });

      const res = await deleteAdminUser(req, {
        params: Promise.resolve({ id: "coach-self-client" }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Cannot delete primary personal workout profile for coach");
      expect(prisma.client.delete).not.toHaveBeenCalled();
    });

    it("should allow deletion of regular clients by admin", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "admin-collin", email: "collin.shapiro1@gmail.com", isAdmin: true },
      });

      (prisma.user.findUnique as any).mockImplementation((args: any) => {
        if (args?.where?.id === "admin-collin") {
          return Promise.resolve({ id: "admin-collin", isAdmin: true });
        }
        return Promise.resolve(null);
      });

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "regular-client-id",
        name: "Test Client",
        email: "test@client.com",
        userId: "other-trainer",
      });

      (prisma.user.findFirst as any).mockResolvedValue(null);
      (prisma.client.delete as any).mockResolvedValue({ id: "regular-client-id" });

      const req = new NextRequest("http://localhost:3000/api/admin/users/regular-client-id", {
        method: "DELETE",
      });

      const res = await deleteAdminUser(req, {
        params: Promise.resolve({ id: "regular-client-id" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: "regular-client-id" } });
    });
  });
});
