import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkUserSubscription, PRICING_PLANS } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Direct-to-Consumer Fitness Journey & Subscription Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PRICING_PLANS Model", () => {
    it("should export valid consumer tiers and coach tier with correct amounts", () => {
      expect(PRICING_PLANS.INDIVIDUAL_MONTHLY.amountCents).toBe(999);
      expect(PRICING_PLANS.INDIVIDUAL_MONTHLY.price).toBe("$9.99/mo");
      expect(PRICING_PLANS.INDIVIDUAL_ANNUAL.amountCents).toBe(7999);
      expect(PRICING_PLANS.INDIVIDUAL_ANNUAL.price).toBe("$79.99/yr");
      expect(PRICING_PLANS.COACH_PRO.amountCents).toBe(2900);
      expect(PRICING_PLANS.INDIVIDUAL_MONTHLY.features.length).toBeGreaterThan(3);
    });
  });

  describe("checkUserSubscription", () => {
    it("should grant access if user has active trial", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-consumer-1",
        trialEndsAt: futureDate,
        subscriptionStatus: "trial",
        subscribedUntil: null,
        createdAt: new Date(),
        isAdmin: false,
      });

      const res = await checkUserSubscription("user-consumer-1");
      expect(res.hasAccess).toBe(true);
      expect(res.status).toBe("trial");
      expect(res.daysRemaining).toBeGreaterThanOrEqual(13);
    });

    it("should grant access if user has active STRKYR Pro subscription", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 300);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-consumer-pro",
        trialEndsAt: null,
        subscriptionStatus: "active",
        subscribedUntil: futureDate,
        createdAt: new Date(),
        isAdmin: false,
      });

      const res = await checkUserSubscription("user-consumer-pro");
      expect(res.hasAccess).toBe(true);
      expect(res.status).toBe("active");
      expect(res.daysRemaining).toBeGreaterThan(250);
    });

    it("should flag expired access when past trial and without subscription", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-expired",
        trialEndsAt: pastDate,
        subscriptionStatus: "trial",
        subscribedUntil: null,
        createdAt: new Date("2026-01-01"),
        isAdmin: false,
      });

      const res = await checkUserSubscription("user-expired");
      expect(res.hasAccess).toBe(false);
      expect(res.status).toBe("expired");
      expect(res.daysRemaining).toBe(0);
    });
  });
});
