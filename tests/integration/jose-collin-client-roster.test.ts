import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getClients } from "@/app/api/clients/route";
import { GET as getAdminStats } from "@/app/api/admin/stats/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/subscription", () => ({
  checkTrainerSubscription: vi.fn().mockResolvedValue({
    status: "active",
    plan: "PRO_MONTHLY",
    isActive: true,
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(2),
    },
    client: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(2),
    },
    workoutSession: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(44),
    },
    workout: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    workoutSet: {
      count: vi.fn().mockResolvedValue(150),
    },
    nutritionLog: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    supplementLog: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    trainingProgram: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

describe("Jose Dildine & Collin Shapiro Client Relationship", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should include Collin Shapiro as an athlete on Jose Dildine's roster without treating him as a self-profile", async () => {
    const joseSession = {
      user: {
        id: "trainer-jose",
        name: "Jose Dildine",
        email: "chisailor87@gmail.com",
        role: "TRAINER",
      },
    };
    (getServerSession as any).mockResolvedValue(joseSession);

    (prisma.user.findUnique as any).mockImplementation((args: any) => {
      if (args.where?.id === "trainer-jose" || args.where?.email === "chisailor87@gmail.com") {
        return Promise.resolve({
          id: "trainer-jose",
          name: "Jose Dildine",
          email: "chisailor87@gmail.com",
          clientProfileId: "client-jose-self",
          role: "TRAINER",
        });
      }
      return Promise.resolve(null);
    });

    const joseClients = [
      {
        id: "client-jose-self",
        userId: "trainer-jose",
        name: "Jose Dildine (You)",
        email: "chisailor87@gmail.com",
        createdAt: new Date("2026-01-01"),
        workouts: [],
        workoutSessions: [],
        _count: { workoutSessions: 52 },
      },
      {
        id: "cmu72hiyb000004ignycanesd",
        userId: "trainer-jose",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        createdAt: new Date("2026-02-01"),
        workouts: [],
        workoutSessions: [{ id: "session-1", notes: "Trap Bar Deadlift" }],
        _count: { workoutSessions: 44 },
      },
    ];

    (prisma.client.findMany as any).mockResolvedValue([...joseClients]);

    const req = new NextRequest("http://localhost:3000/api/clients");
    const res = await getClients(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    // Verify both Jose's self profile and Collin are returned
    expect(data.length).toBe(2);

    const collinInJoseRoster = data.find((c: any) => c.id === "cmu72hiyb000004ignycanesd");
    expect(collinInJoseRoster).toBeDefined();
    expect(collinInJoseRoster.name).toBe("Collin Shapiro");
    expect(collinInJoseRoster.isSelf).toBe(false);
    expect(collinInJoseRoster.email).toBe("collin.shapiro1@gmail.com");
    expect(collinInJoseRoster._count.workoutSessions).toBe(44);

    const joseSelf = data.find((c: any) => c.id === "client-jose-self");
    expect(joseSelf).toBeDefined();
    expect(joseSelf.isSelf).toBe(true);

    // Verify Collin was NOT deleted or merged
    expect(prisma.client.deleteMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: expect.arrayContaining(["cmu72hiyb000004ignycanesd"]) } },
      })
    );
  });

  it("should not rename Collin's client record in DB when Collin logs into Coach Studio", async () => {
    const collinSession = {
      user: {
        id: "user-collin",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        role: "TRAINER",
        clientProfileId: "cmu72hiyb000004ignycanesd",
      },
    };
    (getServerSession as any).mockResolvedValue(collinSession);

    (prisma.user.findUnique as any).mockImplementation((args: any) => {
      if (args.where?.id === "user-collin" || args.where?.email === "collin.shapiro1@gmail.com") {
        return Promise.resolve({
          id: "user-collin",
          name: "Collin Shapiro",
          email: "collin.shapiro1@gmail.com",
          clientProfileId: "cmu72hiyb000004ignycanesd",
          role: "TRAINER",
        });
      }
      return Promise.resolve(null);
    });

    const collinClient = {
      id: "cmu72hiyb000004ignycanesd",
      userId: "trainer-jose", // Coached by Jose!
      name: "Collin Shapiro",
      email: "collin.shapiro1@gmail.com",
      createdAt: new Date("2026-02-01"),
      workouts: [],
      workoutSessions: [],
      _count: { workoutSessions: 44 },
    };

    (prisma.client.findMany as any).mockResolvedValue([collinClient]);

    const req = new NextRequest("http://localhost:3000/api/clients");
    const res = await getClients(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    // Verify it formats Collin as Self with (You) for Collin's own UI
    expect(data.length).toBe(1);
    expect(data[0].name).toBe("Collin Shapiro (You)");
    expect(data[0].isSelf).toBe(true);

    // Verify DB update did NOT change client name in database because userId !== user-collin
    expect(prisma.client.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cmu72hiyb000004ignycanesd" },
        data: expect.objectContaining({ name: "Collin Shapiro (You)" }),
      })
    );
  });

  it("should classify Collin Shapiro as a Coached Athlete under Coach Jose Dildine in /api/admin/stats", async () => {
    const adminSession = {
      user: {
        id: "user-collin",
        email: "collin.shapiro1@gmail.com",
        isAdmin: true,
      },
    };
    (getServerSession as any).mockResolvedValue(adminSession);

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-collin",
      isAdmin: true,
    });

    const trainers = [
      {
        id: "trainer-jose",
        name: "Jose Dildine",
        email: "chisailor87@gmail.com",
        role: "TRAINER",
        isAdmin: false,
        clientProfileId: "client-jose-self",
        createdAt: new Date("2026-01-01"),
        loggedWorkouts: [],
        _count: { clients: 2, loggedWorkouts: 52 },
      },
      {
        id: "user-collin",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        role: "TRAINER",
        isAdmin: true,
        clientProfileId: "cmu72hiyb000004ignycanesd",
        createdAt: new Date("2026-01-01"),
        loggedWorkouts: [],
        _count: { clients: 0, loggedWorkouts: 44 },
      },
    ];

    (prisma.user.findMany as any).mockResolvedValue(trainers);

    const clientsRaw = [
      {
        id: "client-jose-self",
        userId: "trainer-jose",
        name: "Jose Dildine (You)",
        email: "chisailor87@gmail.com",
        createdAt: new Date("2026-01-01"),
        user: { id: "trainer-jose", name: "Jose Dildine", email: "chisailor87@gmail.com" },
        workoutSessions: [{ createdAt: new Date() }],
        _count: { workoutSessions: 52 },
      },
      {
        id: "cmu72hiyb000004ignycanesd",
        userId: "trainer-jose",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        createdAt: new Date("2026-02-01"),
        user: { id: "trainer-jose", name: "Jose Dildine", email: "chisailor87@gmail.com" },
        loginUser: { id: "user-collin", name: "Collin Shapiro", email: "collin.shapiro1@gmail.com" },
        workoutSessions: [{ createdAt: new Date() }],
        _count: { workoutSessions: 44 },
      },
    ];

    (prisma.client.findMany as any).mockResolvedValue(clientsRaw);

    const req = new NextRequest("http://localhost:3000/api/admin/stats");
    const res = await getAdminStats(req);
    const data = await res.json();

    expect(res.status).toBe(200);

    // Verify stats separation: 1 roster athlete (Collin) and 1 trainer self profile (Jose)
    expect(data.stats.rosterAthletesCount).toBe(1);

    // Verify Collin's client record in admin stats
    const collinInStats = data.clients.find((c: any) => c.id === "cmu72hiyb000004ignycanesd");
    expect(collinInStats).toBeDefined();
    expect(collinInStats.name).toBe("Collin Shapiro");
    expect(collinInStats.trainerName).toBe("Jose Dildine");
    expect(collinInStats.isTrainerSelfProfile).toBe(false);

    // Verify Jose's trainer metrics include Collin as a coached client
    const joseTrainer = data.trainers.find((t: any) => t.id === "trainer-jose");
    expect(joseTrainer).toBeDefined();
    expect(joseTrainer.clientCount).toBe(1);
  });
});
