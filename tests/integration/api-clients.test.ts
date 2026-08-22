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
      create: vi.fn(),
    },
    client: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
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

    it("should fetch clients isolated to trainer with self-profile pinned to top", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fitpro.com", name: "Coach Mike" },
      });

      (prisma.client.findMany as any).mockResolvedValue([
        {
          id: "client-self",
          userId: "trainer-1",
          name: "My Workouts",
          email: null,
          phone: null,
          notes: null,
          fitnessGoals: null,
          inviteStatus: "ACCEPTED",
          inviteToken: null,
          createdAt: new Date("2026-08-01"),
          user: { id: "trainer-1", email: "trainer@fitpro.com", name: "Coach Mike" },
          loginUser: null,
          workouts: [],
          workoutSessions: [],
          _count: { workoutSessions: 0 },
        },
        {
          id: "client-1",
          userId: "trainer-1",
          name: "Client Sarah",
          email: "sarah@athlete.com",
          phone: null,
          notes: null,
          fitnessGoals: null,
          inviteStatus: "ACCEPTED",
          inviteToken: null,
          createdAt: new Date("2026-08-02"),
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
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("My Workouts");
      expect(data[0].isSelf).toBe(true);
      expect(data[1].name).toBe("Client Sarah");
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
      expect(data.inviteUrl).toBeTruthy();
    });

    it("should gracefully update and return existing client if re-adding with same email under same trainer", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fitpro.com" },
      });

      (prisma.user.findFirst as any).mockResolvedValue({ id: "trainer-1", email: "trainer@fitpro.com" });

      (prisma.client.findFirst as any).mockResolvedValue({
        id: "client-existing-1",
        userId: "trainer-1",
        name: "Arnold S. (Old)",
        email: "arnold@goldgym.com",
        phone: null,
        notes: null,
        fitnessGoals: null,
        inviteStatus: "NOT_SENT",
      });

      (prisma.client.update as any).mockResolvedValue({
        id: "client-existing-1",
        userId: "trainer-1",
        name: "Arnold S. (Updated)",
        email: "arnold@goldgym.com",
        phone: "555-9999",
        notes: "Updated goals",
        fitnessGoals: "Massive Bulk",
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
          name: "Arnold S. (Updated)",
          email: "arnold@goldgym.com",
          phone: "555-9999",
          notes: "Updated goals",
          fitnessGoals: "Massive Bulk",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("Arnold S. (Updated)");
      expect(data.id).toBe("client-existing-1");
    });

    it("should return 409 conflict if email belongs to another trainer", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "trainer@fitpro.com" },
      });

      (prisma.user.findFirst as any).mockResolvedValue({ id: "trainer-1", email: "trainer@fitpro.com" });

      (prisma.client.findFirst as any).mockResolvedValue({
        id: "client-other-trainer",
        userId: "trainer-2-different",
        name: "Arnold S.",
        email: "arnold@goldgym.com",
      });

      const req = new Request("http://localhost/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Arnold S.",
          email: "arnold@goldgym.com",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("already exists in the system");
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
