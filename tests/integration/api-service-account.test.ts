import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as setupServiceAccountGet } from "@/app/api/admin/setup-service-account/route";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "admin-user", email: "admin@fitcoach.pro", isAdmin: true },
  }),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Service Account & Client Account Separation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provision service account with trainer and admin privileges", async () => {
    (prisma.user.upsert as any).mockResolvedValue({
      id: "service-user-1",
      email: "service@fitcoach.pro",
      name: "FitCoach Master Admin",
      role: "TRAINER",
      isAdmin: true,
      subscriptionStatus: "active",
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "personal-user-1",
      email: "collin.shapiro1@gmail.com",
      name: "Collin",
      role: "TRAINER",
      isAdmin: true,
    });

    (prisma.client.findFirst as any).mockResolvedValue({
      id: "client-collin-1",
      email: "collin.shapiro1@gmail.com",
    });

    (prisma.user.update as any).mockResolvedValue({
      id: "personal-user-1",
      email: "collin.shapiro1@gmail.com",
      role: "CLIENT",
      isAdmin: false,
      clientProfileId: "client-collin-1",
    });

    const res = await setupServiceAccountGet(
      new Request("http://localhost/api/admin/setup-service-account", {
        headers: { "x-admin-secret": "FitCoachAdmin2026!" },
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.serviceAccount.email).toBe("service@fitcoach.pro");
    expect(data.serviceAccount.isAdmin).toBe(true);
    expect(data.serviceAccount.role).toBe("TRAINER");
    expect(data.personalClientAccount.role).toBe("CLIENT");
    expect(data.personalClientAccount.isAdmin).toBe(false);
  });
});
