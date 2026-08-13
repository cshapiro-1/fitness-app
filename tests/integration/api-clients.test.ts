import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/clients/route";
import { PATCH, DELETE } from "@/app/api/clients/[id]/route";
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
      findFirst: vi.fn(),
    },
    client: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("API: /api/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/clients", () => {
    it("should return 401 if unauthenticated", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const res = await GET(new Request("http://localhost/api/clients"));
      expect(res.status).toBe(401);
    });

    it("should fetch clients isolated to trainer without leaking trainer email", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fitpro.com", name: "Coach Mike" },
      });

      (prisma.client.findMany as any).mockResolvedValue([
        {
          id: "client-1",
          userId: "trainer-1",
          name: "Client Sarah",
          email: null,
          phone: null,
          notes: null,
          fitnessGoals: null,
          inviteStatus: "NOT_SENT",
          inviteToken: null,
          createdAt: new Date("2026-08-01"),
          user: { id: "trainer-1", email: "trainer@fitpro.com", name: "Coach Mike" },
          loginUser: null,
          workouts: [],
          workoutSessions: [],
          _count: { workoutSessions: 0 },
        },
      ]);

      const res = await GET(new Request("http://localhost/api/clients"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      // Email should be null, NOT the trainer's email!
      expect(data[0].email).toBeNull();
      expect(data[0].inviteStatus).toBe("NOT_SENT");
    });
  });

  describe("POST /api/clients", () => {
    it("should reject creation if name is missing", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fitpro.com" },
      });

      const req = new Request("http://localhost/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should create client with NOT_SENT invite by default", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fitpro.com" },
      });

      (prisma.client.create as any).mockResolvedValue({
        id: "client-new",
        userId: "trainer-1",
        name: "Arnold S.",
        email: "arnold@goldgym.com",
        phone: "555-1234",
        notes: "Heavy lifter",
        fitnessGoals: "Mr Olympia",
        inviteStatus: "NOT_SENT",
        createdAt: new Date(),
        workouts: [],
        workoutSessions: [],
        _count: { workoutSessions: 0 },
      });

      const req = new Request("http://localhost/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Arnold S.",
          email: "arnold@goldgym.com",
          phone: "555-1234",
          notes: "Heavy lifter",
          fitnessGoals: "Mr Olympia",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("Arnold S.");
      expect(data.inviteStatus).toBe("NOT_SENT");
      expect(data.inviteToken).toBeNull();
    });
  });

  describe("PATCH & DELETE /api/clients/[id]", () => {
    it("should update client attributes", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1" },
      });

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "c-1",
        name: "Old Name",
      });

      (prisma.client.update as any).mockResolvedValue({
        id: "c-1",
        name: "New Name",
        email: "new@fit.com",
        phone: "555-9999",
        notes: "Updated",
        fitnessGoals: "Bulk",
        inviteStatus: "NOT_SENT",
        inviteToken: null,
      });

      (prisma.user.findFirst as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/clients/c-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name", email: "new@fit.com" }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "c-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("New Name");
    });

    it("should delete client", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1" },
      });

      (prisma.client.delete as any).mockResolvedValue({ id: "c-1" });

      const req = new Request("http://localhost/api/clients/c-1", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "c-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
