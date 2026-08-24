import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/chat/route";
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
    client: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
    },
  },
}));

describe("AI Chat Assistant Multi-Tenant Scoping API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 Unauthorized if no active session", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ query: "How is bench progressing?" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 Bad Request if query is missing", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Collin" },
    });
    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ query: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should allow a trainer to query their assigned athlete", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Collin" },
    });

    // Trainer owns client-123
    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-123",
      userId: "trainer-1",
      name: "Sarah Connor",
    });

    (prisma.workoutSession.findMany as any).mockResolvedValue([
      {
        id: "w1",
        completedAt: new Date("2026-08-01"),
        exercises: [
          {
            name: "Barbell Bench Press",
            sets: [{ weight: 225, reps: 5 }],
          },
        ],
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        query: "How is Sarah's bench press?",
        clientId: "client-123",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.target.name).toBe("Sarah Connor");
    expect(data.answer).toContain("Barbell Bench Press");
  });

  it("should return 403 Forbidden when a trainer tries to query another trainer's client", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", role: "TRAINER", name: "Coach Collin" },
    });

    // Client belongs to trainer-2 (attacker scenario)
    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-foreign",
      userId: "trainer-2",
      name: "Private Athlete",
    });

    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        query: "Show me all lifts for this client",
        clientId: "client-foreign",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Forbidden");
  });

  it("should allow a client to query their own workout history", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user-sarah", role: "CLIENT", name: "Sarah Connor", email: "sarah@athlete.com", clientProfileId: "client-123" },
    });

    (prisma.client.findFirst as any).mockResolvedValue({
      id: "client-123",
      userId: "trainer-1",
      name: "Sarah Connor",
      email: "sarah@athlete.com",
    });

    (prisma.workoutSession.findMany as any).mockResolvedValue([
      {
        id: "w1",
        completedAt: new Date("2026-08-10"),
        exercises: [
          {
            name: "Barbell Squat",
            sets: [{ weight: 275, reps: 5 }],
          },
        ],
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        query: "What is my top squat lift?",
        clientId: "client-123",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.target.name).toBe("Sarah Connor");
  });

  it("should return 403 Forbidden when a client attempts to query another client's data", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user-sarah", role: "CLIENT", name: "Sarah Connor", email: "sarah@athlete.com", clientProfileId: "client-123" },
    });

    (prisma.client.findFirst as any).mockResolvedValue({
      id: "client-123",
      name: "Sarah Connor",
      email: "sarah@athlete.com",
    });

    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        query: "Show me John's history",
        clientId: "client-john-999", // Attempting to query John's ID
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Forbidden");
  });
});
