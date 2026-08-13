import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as checkoutRoute } from "@/app/api/stripe/checkout/route";
import { POST as webhookRoute } from "@/app/api/stripe/webhook/route";
import { POST as portalRoute } from "@/app/api/stripe/portal/route";
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

describe("Stripe Payment Processing & Webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/stripe/checkout", () => {
    it("should reject unauthenticated checkout requests with 401", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "monthly" }),
      });
      const res = await checkoutRoute(req as any);
      expect(res.status).toBe(401);
    });

    it("should process fallback simulated checkout for trainers when Stripe keys not set", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-123", email: "coach@gym.com" },
      });

      (prisma.user.update as any).mockResolvedValue({
        id: "trainer-123",
        subscriptionStatus: "active",
      });

      const req = new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "annual" }),
      });

      const res = await checkoutRoute(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "trainer-123" },
          data: expect.objectContaining({
            subscriptionStatus: "active",
          }),
        })
      );
    });
  });

  describe("POST /api/stripe/webhook", () => {
    it("should activate subscription on checkout.session.completed event", async () => {
      (prisma.user.update as any).mockResolvedValue({ id: "user-456", subscriptionStatus: "active" });

      const payload = {
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: "user-456",
            subscription: "sub_12345",
            metadata: { plan: "monthly" },
          },
        },
      };

      const req = new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await webhookRoute(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-456" },
          data: expect.objectContaining({
            subscriptionStatus: "active",
            subscriptionProvider: "stripe",
            subscriptionId: "sub_12345",
          }),
        })
      );
    });

    it("should mark subscription expired on customer.subscription.deleted event", async () => {
      (prisma.user.update as any).mockResolvedValue({ id: "user-789", subscriptionStatus: "expired" });

      const payload = {
        type: "customer.subscription.deleted",
        data: {
          object: {
            metadata: { userId: "user-789" },
          },
        },
      };

      const req = new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await webhookRoute(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-789" },
          data: expect.objectContaining({
            subscriptionStatus: "expired",
          }),
        })
      );
    });
  });

  describe("POST /api/stripe/portal", () => {
    it("should reject unauthenticated billing portal requests", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new Request("http://localhost/api/stripe/portal", { method: "POST" });
      const res = await portalRoute(req as any);
      expect(res.status).toBe(401);
    });
  });
});
