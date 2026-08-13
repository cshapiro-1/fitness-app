import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkTrainerSubscription } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Subscription Checker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return expired when user is not found", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const result = await checkTrainerSubscription("nonexistent-user");
    expect(result.hasAccess).toBe(false);
    expect(result.status).toBe("expired");
    expect(result.reason).toBe("User not found");
  });

  it("should grant access for active subscription", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);

    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionStatus: "active",
      subscribedUntil: futureDate,
      trialEndsAt: null,
      createdAt: new Date(),
      isAdmin: false,
    });

    const result = await checkTrainerSubscription("trainer-1");
    expect(result.hasAccess).toBe(true);
    expect(result.status).toBe("active");
    expect(result.daysRemaining).toBeGreaterThan(15);
  });

  it("should grant access for valid trial period", async () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 10);

    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionStatus: "trial",
      subscribedUntil: null,
      trialEndsAt: trialEnd,
      createdAt: new Date(),
      isAdmin: false,
    });

    const result = await checkTrainerSubscription("trainer-2");
    expect(result.hasAccess).toBe(true);
    expect(result.status).toBe("trial");
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it("should deny access when trial has expired", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionStatus: "trial",
      subscribedUntil: null,
      trialEndsAt: pastDate,
      createdAt: new Date(pastDate.getTime() - 30 * 86400000),
      isAdmin: false,
    });

    const result = await checkTrainerSubscription("trainer-3");
    expect(result.hasAccess).toBe(false);
    expect(result.status).toBe("expired");
    expect(result.reason).toContain("expired");
  });
});
