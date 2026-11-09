import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as updateRole, GET as getRole } from "@/app/api/user/role/route";
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
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Onboarding & Role Separation API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should onboard a new user as an Athlete (CLIENT) training solo", async () => {
    const sessionUser = {
      id: "athlete-user-1",
      email: "newathlete@example.com",
      name: "New Athlete",
    };
    (getServerSession as any).mockResolvedValue({ user: sessionUser });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "athlete-user-1",
      email: "newathlete@example.com",
      name: "New Athlete",
      role: "TRAINER", // Default before choosing
      clientProfileId: null,
      trainerId: null,
    });

    (prisma.client.findFirst as any).mockResolvedValue(null);

    const createdSoloClient = {
      id: "solo-client-profile-1",
      userId: "athlete-user-1",
      name: "New Athlete",
      email: "newathlete@example.com",
      inviteStatus: "ACCEPTED",
    };
    (prisma.client.create as any).mockResolvedValue(createdSoloClient);

    (prisma.user.update as any).mockImplementation((args: any) =>
      Promise.resolve({
        id: "athlete-user-1",
        role: args.data.role,
        clientProfileId: args.data.clientProfileId,
        hasCompletedOnboarding: args.data.hasCompletedOnboarding,
      })
    );

    const req = new NextRequest("http://localhost/api/user/role", {
      method: "POST",
      body: JSON.stringify({
        role: "CLIENT",
        fitnessGoals: "Hypertrophy & Muscle Building (Intermediate)",
      }),
    });

    const res = await updateRole(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.role).toBe("CLIENT");
    expect(data.clientProfileId).toBe("solo-client-profile-1");

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "athlete-user-1" },
        data: expect.objectContaining({
          role: "CLIENT",
          clientProfileId: "solo-client-profile-1",
          hasCompletedOnboarding: true,
          fitnessGoals: "Hypertrophy & Muscle Building (Intermediate)",
        }),
      })
    );
  });

  it("should onboard an athlete with a coach invite code and link to coach's client profile", async () => {
    const sessionUser = {
      id: "invited-athlete-id",
      email: "invited@athlete.com",
      name: "Invited Athlete",
    };
    (getServerSession as any).mockResolvedValue({ user: sessionUser });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "invited-athlete-id",
      email: "invited@athlete.com",
      name: "Invited Athlete",
      role: "TRAINER",
      clientProfileId: null,
      trainerId: null,
    });

    const existingCoachClientRecord = {
      id: "coach-created-client-id",
      userId: "trainer-jose-id", // Coach Jose
      name: "Invited Athlete",
      email: null,
      inviteToken: "token-abc-123",
      inviteStatus: "PENDING",
    };

    (prisma.client.findFirst as any).mockImplementation((args: any) => {
      if (args.where?.OR?.[0]?.inviteToken === "token-abc-123") {
        return Promise.resolve(existingCoachClientRecord);
      }
      return Promise.resolve(null);
    });

    (prisma.client.update as any).mockResolvedValue({
      ...existingCoachClientRecord,
      inviteStatus: "ACCEPTED",
      email: "invited@athlete.com",
    });

    (prisma.user.update as any).mockImplementation((args: any) =>
      Promise.resolve({
        id: "invited-athlete-id",
        role: args.data.role,
        clientProfileId: args.data.clientProfileId,
        trainerId: args.data.trainerId,
        hasCompletedOnboarding: args.data.hasCompletedOnboarding,
      })
    );

    const req = new NextRequest("http://localhost/api/user/role", {
      method: "POST",
      body: JSON.stringify({
        role: "CLIENT",
        inviteCode: "token-abc-123",
      }),
    });

    const res = await updateRole(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.role).toBe("CLIENT");
    expect(data.clientProfileId).toBe("coach-created-client-id");
    expect(data.trainerId).toBe("trainer-jose-id");

    // Client record was marked as ACCEPTED
    expect(prisma.client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "coach-created-client-id" },
        data: expect.objectContaining({
          inviteStatus: "ACCEPTED",
          email: "invited@athlete.com",
        }),
      })
    );
  });

  it("should onboard a coach (TRAINER) and create their personal tracking profile", async () => {
    const sessionUser = {
      id: "new-coach-id",
      email: "newcoach@example.com",
      name: "Coach Jordan",
    };
    (getServerSession as any).mockResolvedValue({ user: sessionUser });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "new-coach-id",
      email: "newcoach@example.com",
      name: "Coach Jordan",
      role: "TRAINER",
      clientProfileId: null,
      trainerId: null,
    });

    (prisma.client.findFirst as any).mockResolvedValue(null);

    const createdTrainerPersonalProfile = {
      id: "coach-personal-profile-id",
      userId: "new-coach-id",
      name: "Coach Jordan (You)",
      email: "newcoach@example.com",
      inviteStatus: "ACCEPTED",
    };
    (prisma.client.create as any).mockResolvedValue(createdTrainerPersonalProfile);

    (prisma.user.update as any).mockImplementation((args: any) =>
      Promise.resolve({
        id: "new-coach-id",
        role: args.data.role,
        clientProfileId: args.data.clientProfileId,
        hasCompletedOnboarding: args.data.hasCompletedOnboarding,
      })
    );

    const req = new NextRequest("http://localhost/api/user/role", {
      method: "POST",
      body: JSON.stringify({
        role: "TRAINER",
      }),
    });

    const res = await updateRole(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.role).toBe("TRAINER");
    expect(data.clientProfileId).toBe("coach-personal-profile-id");

    // Coach personal profile was created
    expect(prisma.client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "new-coach-id",
          name: "Coach Jordan (You)",
          email: "newcoach@example.com",
          inviteStatus: "ACCEPTED",
        }),
      })
    );
  });
});
