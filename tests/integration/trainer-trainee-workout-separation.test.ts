import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getWorkouts } from "@/app/api/workouts/route";
import { GET as getClientWorkouts } from "@/app/api/workouts/client/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ limited: false }),
  RATE_LIMIT_PRESETS: { MUTATION: {} },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    workout: {
      findMany: vi.fn(),
    },
  },
}));

describe("Trainer vs Trainee Workout Separation (Jose Dildine & Collin Shapiro)", () => {
  const joseUserId = "trainer-jose-id";
  const collinUserId = "user-collin-id";
  const collinClientId = "cmu72hiyb000004ignycanesd";
  const joseClientId = "client-jose-self";

  const joseClientProfile = {
    id: joseClientId,
    userId: joseUserId,
    name: "Jose Dildine (You)",
    email: "chisailor87@gmail.com",
  };

  const collinClientProfile = {
    id: collinClientId,
    userId: joseUserId, // Coached by Jose!
    name: "Collin Shapiro",
    email: "collin.shapiro1@gmail.com",
  };

  const joseSessions = Array.from({ length: 52 }, (_, i) => ({
    id: `jose-session-${i}`,
    clientId: joseClientId,
    loggedById: joseUserId,
    loggedByName: "Jose Dildine",
    loggedByRole: "TRAINER",
    notes: `Jose personal workout ${i}`,
    createdAt: new Date("2026-03-01T10:00:00Z"),
    exercises: [],
  }));

  const collinSessions = Array.from({ length: 44 }, (_, i) => ({
    id: `collin-session-${i}`,
    clientId: collinClientId,
    loggedById: joseUserId, // Logged by Coach Jose for Collin
    loggedByName: "Jose Dildine",
    loggedByRole: "TRAINER",
    notes: `Collin coached workout ${i}`,
    createdAt: new Date("2026-03-02T10:00:00Z"),
    exercises: [],
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT combine Collin workouts when Jose queries his personal workouts via /api/workouts?clientId=joseClientId", async () => {
    (getServerSession as any).mockResolvedValue({
      user: {
        id: joseUserId,
        name: "Jose Dildine",
        email: "chisailor87@gmail.com",
        role: "TRAINER",
        clientProfileId: joseClientId,
      },
    });

    (prisma.client.findUnique as any).mockImplementation((args: any) => {
      if (args.where?.id === joseClientId) return Promise.resolve(joseClientProfile);
      if (args.where?.id === collinClientId) return Promise.resolve(collinClientProfile);
      return Promise.resolve(null);
    });

    (prisma.client.findMany as any).mockImplementation((args: any) => {
      // If finding self clients for Jose
      if (args.where?.userId === joseUserId) {
        return Promise.resolve([joseClientProfile]);
      }
      return Promise.resolve([]);
    });

    (prisma.workoutSession.findMany as any).mockImplementation((args: any) => {
      const clientIds = args.where?.clientId?.in || (args.where?.clientId ? [args.where.clientId] : []);
      // If querying jose's client id
      if (clientIds.includes(joseClientId) && !clientIds.includes(collinClientId)) {
        return Promise.resolve(joseSessions);
      }
      // If combined
      if (clientIds.includes(joseClientId) && clientIds.includes(collinClientId)) {
        return Promise.resolve([...joseSessions, ...collinSessions]);
      }
      return Promise.resolve([]);
    });

    (prisma.workout.findMany as any).mockResolvedValue([]);

    const req = new NextRequest(`http://localhost:3000/api/workouts?clientId=${joseClientId}`);
    const res = await getWorkouts(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    // Jose's personal workouts must be EXACTLY 52 sessions, with ZERO Collin sessions
    expect(data.length).toBe(52);
    const hasCollinWorkouts = data.some((w: any) => w.notes.includes("Collin"));
    expect(hasCollinWorkouts).toBe(false);
  });

  it("should NOT combine Jose workouts when Collin queries his workouts via /api/workouts?clientId=collinClientId", async () => {
    (getServerSession as any).mockResolvedValue({
      user: {
        id: collinUserId,
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        role: "CLIENT",
        clientProfileId: collinClientId,
      },
    });

    (prisma.client.findUnique as any).mockImplementation((args: any) => {
      if (args.where?.id === collinClientId) return Promise.resolve(collinClientProfile);
      if (args.where?.id === joseClientId) return Promise.resolve(joseClientProfile);
      return Promise.resolve(null);
    });

    (prisma.client.findMany as any).mockImplementation((args: any) => {
      // Notice: Before our fix, querying where userId == targetClient.userId (which is joseUserId)
      // returned Jose's (You) profile!
      if (args.where?.userId === joseUserId) {
        return Promise.resolve([joseClientProfile]);
      }
      if (args.where?.email?.equals === "collin.shapiro1@gmail.com") {
        return Promise.resolve([collinClientProfile]);
      }
      return Promise.resolve([]);
    });

    (prisma.workoutSession.findMany as any).mockImplementation((args: any) => {
      const clientIds = args.where?.clientId?.in || (args.where?.clientId ? [args.where.clientId] : []);
      // If query was strictly isolated to Collin
      if (clientIds.includes(collinClientId) && !clientIds.includes(joseClientId)) {
        return Promise.resolve(collinSessions);
      }
      // If corrupted / combined
      if (clientIds.includes(collinClientId) && clientIds.includes(joseClientId)) {
        return Promise.resolve([...collinSessions, ...joseSessions]);
      }
      return Promise.resolve([]);
    });

    (prisma.workout.findMany as any).mockResolvedValue([]);

    const req = new NextRequest(`http://localhost:3000/api/workouts?clientId=${collinClientId}`);
    const res = await getWorkouts(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    // Collin's workouts must be EXACTLY 44 sessions, with ZERO Jose sessions
    expect(data.length).toBe(44);
    const hasJoseWorkouts = data.some((w: any) => w.notes.includes("Jose"));
    expect(hasJoseWorkouts).toBe(false);
  });

  it("should NOT combine Jose workouts when Collin fetches /api/workouts/client", async () => {
    (getServerSession as any).mockResolvedValue({
      user: {
        id: collinUserId,
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        role: "CLIENT",
        clientProfileId: collinClientId,
      },
    });

    (prisma.user.findFirst as any).mockResolvedValue({
      id: collinUserId,
      name: "Collin Shapiro",
      email: "collin.shapiro1@gmail.com",
      role: "CLIENT",
      clientProfileId: collinClientId,
    });

    (prisma.client.findMany as any).mockImplementation((args: any) => {
      if (args.where?.email?.equals === "collin.shapiro1@gmail.com") {
        return Promise.resolve([collinClientProfile]);
      }
      if (args.where?.userId === joseUserId) {
        return Promise.resolve([joseClientProfile]);
      }
      return Promise.resolve([]);
    });

    (prisma.workoutSession.findMany as any).mockImplementation((args: any) => {
      const clientIds = args.where?.OR?.[0]?.clientId?.in || [];
      if (clientIds.includes(collinClientId) && !clientIds.includes(joseClientId)) {
        return Promise.resolve(collinSessions);
      }
      if (clientIds.includes(joseClientId)) {
        return Promise.resolve([...collinSessions, ...joseSessions]);
      }
      return Promise.resolve([]);
    });

    (prisma.workout.findMany as any).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/workouts/client");
    const res = await getClientWorkouts(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.length).toBe(44);
    const hasJoseWorkouts = data.some((w: any) => w.notes.includes("Jose"));
    expect(hasJoseWorkouts).toBe(false);
  });
});
