import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as invitePost } from "@/app/api/invite/route";
import { POST as clientInvitePost } from "@/app/api/clients/[id]/invite/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

describe("Invite Link API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/invite", () => {
    it("should return 401 if unauthenticated", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest("http://localhost/api/invite", {
        method: "POST",
        body: JSON.stringify({ clientId: "client-123" }),
      });
      const res = await invitePost(req);
      expect(res.status).toBe(401);
    });

    it("should generate a valid invite token and absolute inviteUrl", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fitpro.com" },
      });

      (prisma.client.update as any).mockResolvedValue({
        id: "client-123",
        inviteToken: "abc123token",
        inviteStatus: "PENDING",
      });

      const req = new NextRequest("http://strkyr.fit/api/invite", {
        method: "POST",
        headers: {
          host: "strkyr.fit",
        },
        body: JSON.stringify({ clientId: "client-123" }),
      });

      const res = await invitePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.inviteToken).toBeTruthy();
      expect(data.inviteUrl).toContain("/invite/");
      expect(data.inviteUrl).not.toContain("undefined");
      expect(data.client.inviteStatus).toBe("PENDING");
    });
  });

  describe("POST /api/clients/[id]/invite", () => {
    it("should return 401 if unauthenticated", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest("http://localhost/api/clients/client-123/invite", {
        method: "POST",
      });
      const res = await clientInvitePost(req, { params: Promise.resolve({ id: "client-123" }) });
      expect(res.status).toBe(401);
    });

    it("should generate token, update client, and return top-level inviteToken and inviteUrl", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fitpro.com" },
      });

      (prisma.client.update as any).mockResolvedValue({
        id: "client-123",
        inviteToken: "def456token",
        inviteStatus: "PENDING",
      });

      const req = new NextRequest("http://strkyr.fit/api/clients/client-123/invite", {
        method: "POST",
        headers: {
          host: "strkyr.fit",
        },
      });

      const res = await clientInvitePost(req, { params: Promise.resolve({ id: "client-123" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.inviteToken).toBeTruthy();
      expect(data.inviteToken).not.toBe("undefined");
      expect(data.inviteUrl).toContain("/invite/");
      expect(data.inviteUrl).not.toContain("undefined");
      expect(data.client.id).toBe("client-123");
    });
  });
});
