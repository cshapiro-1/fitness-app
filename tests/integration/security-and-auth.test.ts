import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimitStore, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText, validateNumericBounds } from "@/lib/sanitize";
import { verifyAdminAccess } from "@/lib/adminGuard";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
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
      findUnique: vi.fn(),
    },
  },
}));

describe("Backend Security & Authentication Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
  });

  describe("Sliding-Window Rate Limiter", () => {
    it("should allow requests under the limit threshold", () => {
      const req = new NextRequest("http://localhost:3000/api/workouts", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      });

      const config = { limit: 5, windowMs: 60000, identifier: "test-allow" };
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(req, config);
        expect(result.limited).toBe(false);
      }
    });

    it("should block requests exceeding the limit threshold with 429", () => {
      const req = new NextRequest("http://localhost:3000/api/auth/signin", {
        headers: { "x-forwarded-for": "192.168.1.200" },
      });

      const config = { limit: 3, windowMs: 60000, identifier: "test-block" };
      checkRateLimit(req, config);
      checkRateLimit(req, config);
      checkRateLimit(req, config);

      const blockedResult = checkRateLimit(req, config);
      expect(blockedResult.limited).toBe(true);
      expect(blockedResult.response).toBeDefined();
      expect(blockedResult.response?.status).toBe(429);
    });
  });

  describe("Input Sanitization & Injection Defense", () => {
    it("should strip <script> tags and embedded Javascript", () => {
      const dirty = "Bench Press <script>alert('xss')</script> Heavy Set";
      const clean = sanitizeText(dirty);
      expect(clean).toBe("Bench Press  Heavy Set");
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("alert");
    });

    it("should strip HTML tags and control characters", () => {
      const dirty = "<b>Great workout!</b> <div>Felt strong</div>";
      const clean = sanitizeText(dirty);
      expect(clean).toBe("Great workout! Felt strong");
    });

    it("should clamp numeric bounds into safe ranges", () => {
      expect(validateNumericBounds(225, 0, 2000, 0)).toBe(225);
      expect(validateNumericBounds(-50, 0, 2000, 0)).toBe(0);
      expect(validateNumericBounds(50000, 0, 2000, 0)).toBe(2000);
      expect(validateNumericBounds("not-a-number", 0, 2000, 100)).toBe(100);
    });
  });

  describe("Hardened Admin Authorization Guard", () => {
    it("should allow access with matching x-admin-secret header when ADMIN_SECRET is configured", async () => {
      process.env.ADMIN_SECRET = "FitCoachAdmin2026!";
      const req = new NextRequest("http://localhost:3000/api/admin/clean-test-data", {
        headers: { "x-admin-secret": "FitCoachAdmin2026!" },
      });

      const auth = await verifyAdminAccess(req);
      expect(auth.authorized).toBe(true);
    });

    it("should allow access with matching Bearer token Authorization header when ADMIN_SECRET is configured", async () => {
      process.env.ADMIN_SECRET = "FitCoachAdmin2026!";
      const req = new NextRequest("http://localhost:3000/api/admin/setup-service-account", {
        headers: { authorization: "Bearer FitCoachAdmin2026!" },
      });

      const auth = await verifyAdminAccess(req);
      expect(auth.authorized).toBe(true);
    });

    it("should reject secret header when ADMIN_SECRET is not configured or mismatched", async () => {
      delete process.env.ADMIN_SECRET;
      delete process.env.SERVICE_ACCOUNT_PASSWORD;
      const req = new NextRequest("http://localhost:3000/api/admin/stats", {
        headers: { "x-admin-secret": "FitCoachAdmin2026!" },
      });

      const auth = await verifyAdminAccess(req);
      expect(auth.authorized).toBe(false);
    });

    it("should reject unauthenticated admin access with 401", async () => {
      delete process.env.ADMIN_SECRET;
      delete process.env.SERVICE_ACCOUNT_PASSWORD;
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/admin/stats");

      const auth = await verifyAdminAccess(req);
      expect(auth.authorized).toBe(false);
      expect(auth.response?.status).toBe(401);
    });

    it("should reject non-admin authenticated users with 403", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "user-client-1", email: "client@fit.com" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-client-1",
        email: "client@fit.com",
        isAdmin: false,
        role: "CLIENT",
      });

      const req = new NextRequest("http://localhost:3000/api/admin/stats");
      const auth = await verifyAdminAccess(req);
      expect(auth.authorized).toBe(false);
      expect(auth.response?.status).toBe(403);
    });

    it("should grant access to authenticated admin users with isAdmin: true", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "admin-user", email: "admin@fit.com" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-user",
        email: "admin@fit.com",
        isAdmin: true,
        role: "TRAINER",
      });

      const req = new NextRequest("http://localhost:3000/api/admin/stats");
      const auth = await verifyAdminAccess(req);
      expect(auth.authorized).toBe(true);
      expect(auth.userId).toBe("admin-user");
    });

    it("should preserve Google user avatar and profile details", async () => {
      (getServerSession as any).mockResolvedValue({
        user: {
          id: "collin-1",
          email: "collin@fit.com",
          name: "Collin Shapiro",
          image: "https://lh3.googleusercontent.com/a/test-avatar",
        },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "collin-1",
        email: "collin@fit.com",
        name: "Collin Shapiro",
        image: "https://lh3.googleusercontent.com/a/test-avatar",
        isAdmin: true,
        role: "TRAINER",
      });

      const session = (await getServerSession({} as any)) as any;
      expect(session?.user?.image).toBe("https://lh3.googleusercontent.com/a/test-avatar");
      expect(session?.user?.name).toBe("Collin Shapiro");
    });

    it("should support passwordless delegated Apple Sign-In configuration", async () => {
      (getServerSession as any).mockResolvedValue({
        user: {
          id: "apple-user-1",
          email: "athlete@privaterelay.appleid.com",
          name: "Apple Athlete",
          role: "CLIENT",
        },
      });

      const session = (await getServerSession({} as any)) as any;
      expect(session?.user?.email).toContain("appleid.com");
      expect(session?.user?.role).toBe("CLIENT");
    });
  });
});
