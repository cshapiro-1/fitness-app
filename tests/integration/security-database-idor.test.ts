import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET as getWorkouts, POST as postWorkouts } from "@/app/api/workouts/route";
import { PATCH as patchClient, DELETE as deleteClient } from "@/app/api/clients/[id]/route";
import { PATCH as patchUserClient } from "@/app/api/client/[id]/route";
import { GET as getFixEnumNow } from "@/app/api/fix-enum-now/route";
import { GET as getFixDbEnums } from "@/app/api/admin/fix-db-enums/route";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workout: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe("PostgreSQL Multi-Tenancy & Authorization Security Audit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should block unassigned user from viewing another trainer's client workouts (IDOR prevention)", async () => {
    // Authenticated as Coach Bob
    (getServerSession as any).mockResolvedValue({
      user: { id: "coach-bob", email: "bob@coach.com", role: "TRAINER" },
    });

    // Client belongs to Coach Alice
    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-alice-1",
      userId: "coach-alice",
      email: "athlete-alice@gym.com",
      name: "Alice Athlete",
    });

    const req = new NextRequest("http://localhost:3000/api/workouts?clientId=client-alice-1");
    const res = await getWorkouts(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Forbidden");
  });

  it("should block unassigned user from logging workouts for another trainer's client", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "coach-bob", email: "bob@coach.com", role: "TRAINER" },
    });

    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-alice-1",
      userId: "coach-alice",
      email: "athlete-alice@gym.com",
      name: "Alice Athlete",
    });

    const req = new NextRequest("http://localhost:3000/api/workouts", {
      method: "POST",
      body: JSON.stringify({
        clientId: "client-alice-1",
        status: "COMPLETED",
        exercises: [{ name: "Squat", sets: [{ weight: 200, reps: 5 }] }],
      }),
    });

    const res = await postWorkouts(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Forbidden");
  });

  it("should block non-owning coach from updating another trainer's client record", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "coach-bob", email: "bob@coach.com", role: "TRAINER" },
    });

    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-alice-1",
      userId: "coach-alice",
      name: "Alice Athlete",
    });

    const req = new Request("http://localhost:3000/api/clients/client-alice-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Hacked Name" }),
    });

    const res = await patchClient(req, { params: Promise.resolve({ id: "client-alice-1" }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Forbidden");
  });

  it("should block non-owning coach from deleting another trainer's client record", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "coach-bob", email: "bob@coach.com", role: "TRAINER" },
    });

    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-alice-1",
      userId: "coach-alice",
      name: "Alice Athlete",
    });

    const req = new Request("http://localhost:3000/api/clients/client-alice-1", {
      method: "DELETE",
    });

    const res = await deleteClient(req, { params: Promise.resolve({ id: "client-alice-1" }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Forbidden");
  });

  it("should block user from modifying another user's profile via /api/client/[id]", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user-123", email: "user123@fit.com" },
    });

    const req = new Request("http://localhost:3000/api/client/user-999", {
      method: "PATCH",
      body: JSON.stringify({ name: "Impersonated Name" }),
    });

    const res = await patchUserClient(req, { params: Promise.resolve({ id: "user-999" }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Forbidden");
  });

  it("should permanently return 403 on /api/fix-enum-now", async () => {
    const res = await getFixEnumNow();
    expect(res.status).toBe(403);
  });

  it("should block unauthenticated access to /api/admin/fix-db-enums", async () => {
    (getServerSession as any).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/admin/fix-db-enums");
    const res = await getFixDbEnums(req);

    expect(res.status).toBe(401);
  });
});
