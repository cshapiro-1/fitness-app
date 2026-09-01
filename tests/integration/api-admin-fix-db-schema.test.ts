import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/fix-db-schema/route";
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
    },
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
  },
}));

describe("Admin Fix DB Schema API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should block non-admin users from running schema migration", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user-1", email: "client@test.com", role: "CLIENT", isAdmin: false },
    });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-1",
      email: "client@test.com",
      isAdmin: false,
      role: "CLIENT",
    });

    const req = new NextRequest("http://localhost:3000/api/admin/fix-db-schema");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("should successfully execute schema synchronization for admin users", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "admin-1", email: "collin.shapiro1@gmail.com", role: "ADMIN", isAdmin: true },
    });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "admin-1",
      email: "collin.shapiro1@gmail.com",
      isAdmin: true,
      role: "ADMIN",
    });

    const req = new NextRequest("http://localhost:3000/api/admin/fix-db-schema");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.results.some((r: string) => r.includes("Program Planner"))).toBe(true);
    expect(prisma.$executeRawUnsafe).toHaveBeenCalled();
  });
});
