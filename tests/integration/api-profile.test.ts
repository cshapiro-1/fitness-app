import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/user/profile/route";
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
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/subscription", () => ({
  checkTrainerSubscription: vi.fn().mockResolvedValue({
    hasAccess: true,
    status: "active",
    daysRemaining: 30,
    trialEndsAt: null,
    subscribedUntil: new Date("2027-01-01"),
    isAdmin: false,
  }),
}));

describe("API: /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/user/profile", () => {
    it("should return 401 if unauthenticated", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("should return trainer profile, image, and subscription details", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@pro.com" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "trainer-1",
        email: "trainer@pro.com",
        name: "Coach Mike",
        image: "https://example.com/mike.jpg",
        phone: "555-1234",
        notes: "Strength coach",
        fitnessGoals: null,
        role: "TRAINER",
        isAdmin: false,
        subscriptionProvider: "stripe",
        subscriptionStatus: "active",
        subscribedUntil: new Date("2027-01-01"),
        trialEndsAt: null,
        _count: { clients: 12 },
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.name).toBe("Coach Mike");
      expect(data.user.image).toBe("https://example.com/mike.jpg");
      expect(data.user.clientCount).toBe(12);
      expect(data.subscription.status).toBe("active");
    });
  });

  describe("PATCH /api/user/profile", () => {
    it("should update trainer name and profile picture", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@pro.com" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({ id: "trainer-1" });
      (prisma.user.update as any).mockResolvedValue({
        id: "trainer-1",
        name: "Coach Mike Pro",
        image: "https://example.com/new-pic.jpg",
        email: "trainer@pro.com",
        phone: "555-9999",
        notes: "Updated bio",
        fitnessGoals: "Lead championship",
      });

      const req = new Request("http://localhost/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Coach Mike Pro",
          image: "https://example.com/new-pic.jpg",
          phone: "555-9999",
        }),
      });

      const res = await PATCH(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.image).toBe("https://example.com/new-pic.jpg");
      expect(data.user.name).toBe("Coach Mike Pro");
    });
  });
});
