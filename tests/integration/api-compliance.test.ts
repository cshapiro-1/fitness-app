import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE as deleteAccount } from "@/app/api/user/delete-account/route";
import { POST as restorePurchases } from "@/app/api/billing/restore/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

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
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    client: {
      deleteMany: vi.fn(),
    },
    account: {
      deleteMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/subscription", () => ({
  checkTrainerSubscription: vi.fn().mockResolvedValue({
    hasAccess: true,
    status: "active",
    daysRemaining: 25,
  }),
}));

describe("App Store Compliance APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DELETE /api/user/delete-account", () => {
    it("should reject unauthenticated deletion request with 401", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const res = await deleteAccount();
      expect(res.status).toBe(401);
    });

    it("should cascade delete user records, clients, sessions, and accounts", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-del", email: "del@fitness.com" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({ id: "trainer-del" });
      (prisma.user.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.client.deleteMany as any).mockResolvedValue({ count: 3 });
      (prisma.account.deleteMany as any).mockResolvedValue({ count: 1 });
      (prisma.session.deleteMany as any).mockResolvedValue({ count: 2 });
      (prisma.user.delete as any).mockResolvedValue({ id: "trainer-del" });

      const res = await deleteAccount();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.client.deleteMany).toHaveBeenCalledWith({ where: { userId: "trainer-del" } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "trainer-del" } });
    });
  });

  describe("POST /api/billing/restore", () => {
    it("should restore active subscription for user", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-sub", email: "trainer@fit.com" },
      });

      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "trainer-sub",
        subscribedUntil: futureDate,
      });

      const res = await restorePurchases();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.restored).toBe(true);
      expect(data.status).toBe("active");
    });
  });
});
