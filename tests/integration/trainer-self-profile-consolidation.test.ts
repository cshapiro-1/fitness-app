import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getClients } from "@/app/api/clients/route";
import { GET as getUserProfile, PATCH as updateUserProfile } from "@/app/api/user/profile/route";
import { GET as getWorkouts } from "@/app/api/workouts/route";
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
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    workout: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    nutritionLog: {
      updateMany: vi.fn(),
    },
    supplementLog: {
      updateMany: vi.fn(),
    },
  },
}));

describe("Trainer Profile & 'My Workouts' Consolidation (Zero Data Loss)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should consolidate legacy 'My Workouts' and duplicate personal clients into a unified trainer self-profile without losing any workouts", async () => {
    const trainerSession = {
      user: {
        id: "trainer-collin-1",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        role: "TRAINER",
        image: "https://example.com/collin.jpg",
      },
    };
    (getServerSession as any).mockResolvedValue(trainerSession);

    // Mock trainer User in DB
    (prisma.user.findUnique as any).mockImplementation((args: any) => {
      if (args.where?.id === "trainer-collin-1" || args.where?.email === "collin.shapiro1@gmail.com") {
        return Promise.resolve({
          id: "trainer-collin-1",
          name: "Collin Shapiro",
          email: "collin.shapiro1@gmail.com",
          image: "https://example.com/collin.jpg",
          phone: "555-0100",
          notes: "Strength & Conditioning Coach",
          fitnessGoals: "500 lb Deadlift",
          role: "TRAINER",
          clientProfileId: null, // initially unlinked
          _count: { clients: 3 },
        });
      }
      return Promise.resolve(null);
    });

    // Mock existing clients in DB: 2 duplicate self-profiles + 1 athlete
    const existingClients = [
      {
        id: "client-my-workouts-legacy",
        userId: "trainer-collin-1",
        name: "My Workouts",
        email: null,
        image: null,
        phone: null,
        notes: "Old personal logs",
        fitnessGoals: "Hypertrophy",
        inviteStatus: "ACCEPTED",
        createdAt: new Date("2026-08-01"),
        workouts: [],
        workoutSessions: [{ id: "session-1" }, { id: "session-2" }],
        _count: { workoutSessions: 2 },
      },
      {
        id: "client-personal-dup",
        userId: "trainer-collin-1",
        name: "My Workouts (Personal)",
        email: "collin.shapiro1@gmail.com",
        image: null,
        phone: null,
        notes: null,
        fitnessGoals: null,
        inviteStatus: "ACCEPTED",
        createdAt: new Date("2026-08-15"),
        workouts: [],
        workoutSessions: [{ id: "session-3" }],
        _count: { workoutSessions: 1 },
      },
      {
        id: "client-alice",
        userId: "trainer-collin-1",
        name: "Alice Walker",
        email: "alice@example.com",
        image: "https://example.com/alice.jpg",
        inviteStatus: "ACCEPTED",
        createdAt: new Date("2026-08-20"),
        workouts: [],
        workoutSessions: [{ id: "session-alice-1" }],
        _count: { workoutSessions: 1 },
      },
    ];

    (prisma.client.findMany as any).mockResolvedValue([...existingClients]);
    (prisma.user.update as any).mockResolvedValue({});
    (prisma.client.update as any).mockResolvedValue({});
    (prisma.client.deleteMany as any).mockResolvedValue({ count: 1 });
    (prisma.workoutSession.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.workout.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.nutritionLog.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.supplementLog.updateMany as any).mockResolvedValue({ count: 0 });

    const req = new NextRequest("http://localhost:3000/api/clients");
    const res = await getClients(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    // Verify workout re-attribution was called with duplicate IDs (ZERO DATA LOSS)
    expect(prisma.workoutSession.updateMany).toHaveBeenCalledWith({
      where: { clientId: { in: ["client-personal-dup"] } },
      data: { clientId: "client-my-workouts-legacy" },
    });

    // Verify User clientProfileId was linked
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "trainer-collin-1" },
      data: { clientProfileId: "client-my-workouts-legacy" },
    });

    // Verify duplicate was removed after merging
    expect(prisma.client.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["client-personal-dup"] } },
    });

    // Verify client list contains Alice and the consolidated self-profile
    expect(data.length).toBe(2);

    const selfProfile = data.find((c: any) => c.isSelf);
    expect(selfProfile).toBeDefined();
    expect(selfProfile.name).toBe("Collin Shapiro (You)");
    expect(selfProfile.image).toBe("https://example.com/collin.jpg");
    expect(selfProfile.id).toBe("client-my-workouts-legacy");

    // Alice is retained
    const aliceProfile = data.find((c: any) => c.id === "client-alice");
    expect(aliceProfile).toBeDefined();
    expect(aliceProfile.name).toBe("Alice Walker");
    expect(aliceProfile.isSelf).toBe(false);

    // Self profile is pinned to the very top (index 0)
    expect(data[0].isSelf).toBe(true);
  });

  it("should bi-directionally synchronize trainer profile changes to the linked client record in PATCH /api/user/profile", async () => {
    (getServerSession as any).mockResolvedValue({
      user: {
        id: "trainer-collin-1",
        email: "collin.shapiro1@gmail.com",
        role: "TRAINER",
      },
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "trainer-collin-1",
      email: "collin.shapiro1@gmail.com",
    });

    (prisma.user.update as any).mockResolvedValue({
      id: "trainer-collin-1",
      name: "Coach Collin",
      email: "collin.shapiro1@gmail.com",
      image: "https://example.com/coach-new.png",
      phone: "555-9999",
      notes: "Olympic Lifting Specialist",
      fitnessGoals: "315 lb Clean & Jerk",
      role: "TRAINER",
      clientProfileId: "client-self-123",
    });

    (prisma.client.updateMany as any).mockResolvedValue({ count: 1 });

    const patchReq = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Coach Collin",
        image: "https://example.com/coach-new.png",
        phone: "555-9999",
        notes: "Olympic Lifting Specialist",
        fitnessGoals: "315 lb Clean & Jerk",
      }),
    });

    const patchRes = await updateUserProfile(patchReq);
    expect(patchRes.status).toBe(200);

    // Verify prisma.client.updateMany synchronized all fields to client table with (You) suffix
    expect(prisma.client.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { id: "client-self-123" },
          { email: { equals: "collin.shapiro1@gmail.com", mode: "insensitive" } },
        ],
      },
      data: {
        name: "Coach Collin (You)",
        image: "https://example.com/coach-new.png",
        phone: "555-9999",
        notes: "Olympic Lifting Specialist",
        fitnessGoals: "315 lb Clean & Jerk",
      },
    });
  });

  it("should auto-resolve and return clientProfileId in GET /api/user/profile for trainers", async () => {
    (getServerSession as any).mockResolvedValue({
      user: {
        id: "trainer-dan-1",
        name: "Dan Coach",
        email: "dan@fitpro.com",
        role: "TRAINER",
      },
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "trainer-dan-1",
      name: "Dan Coach",
      email: "dan@fitpro.com",
      role: "TRAINER",
      clientProfileId: null,
      _count: { clients: 1 },
    });

    (prisma.client.findFirst as any).mockResolvedValue({
      id: "client-dan-self",
      name: "My Workouts",
      userId: "trainer-dan-1",
    });

    (prisma.user.update as any).mockResolvedValue({});

    const req = new NextRequest("http://localhost:3000/api/user/profile");
    const res = await getUserProfile();

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "trainer-dan-1" },
      data: { clientProfileId: "client-dan-self" },
    });

    expect(data.user.clientProfileId).toBe("client-dan-self");
  });

  it("should retrieve consolidated personal workouts when querying GET /api/workouts with the personal profile ID", async () => {
    (getServerSession as any).mockResolvedValue({
      user: {
        id: "trainer-collin-1",
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
        role: "TRAINER",
        clientProfileId: "client-collin-self",
      },
    });

    (prisma.client.findUnique as any).mockResolvedValue({
      id: "client-collin-self",
      name: "Collin Shapiro (You)",
      email: "collin.shapiro1@gmail.com",
      userId: "trainer-collin-1",
    });

    (prisma.client.findMany as any).mockResolvedValue([
      { id: "client-collin-self" },
    ]);

    const mockPersonalWorkouts = [
      {
        id: "session-collin-1",
        clientId: "client-collin-self",
        status: "COMPLETED",
        notes: "Heavy Deadlift PR Session",
        exercises: [{ name: "Deadlift", sets: [{ weight: 495, reps: 3 }] }],
      },
    ];

    (prisma.workoutSession.findMany as any).mockResolvedValue(mockPersonalWorkouts);
    (prisma.workout.findMany as any).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/workouts?clientId=client-collin-self");
    const res = await getWorkouts(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.length).toBe(1);
    expect(data[0].id).toBe("session-collin-1");
    expect(data[0].exercises[0].sets[0].weight).toBe(495);
  });
});
