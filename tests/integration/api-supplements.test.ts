import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getSupps, POST as addSupp, PATCH as updateSupp, DELETE as deleteSupp } from "@/app/api/nutrition/supplements/route";
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
    },
    client: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    supplementLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Supplements API Route (/api/nutrition/supplements)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/nutrition/supplements?clientId=c1");
    const res = await getSupps(req);
    expect(res.status).toBe(401);
  });

  it("should fetch supplements for a given client and date", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", email: "coach@gym.com" },
    });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "trainer-1", email: "coach@gym.com" });
    (prisma.client.findFirst as any).mockResolvedValue({ id: "c1", userId: "trainer-1" });
    (prisma.supplementLog.findMany as any).mockResolvedValue([
      { id: "supp-1", clientId: "c1", name: "Creatine Monohydrate", dosage: "5g", taken: true },
      { id: "supp-2", clientId: "c1", name: "Omega-3 Fish Oil", dosage: "2000mg", taken: false },
    ]);

    const req = new Request("http://localhost/api/nutrition/supplements?clientId=c1&date=2026-08-13");
    const res = await getSupps(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.supplements.length).toBe(2);
    expect(data.supplements[0].name).toBe("Creatine Monohydrate");
  });

  it("should log a new supplement via POST", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", email: "coach@gym.com" },
    });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "trainer-1", email: "coach@gym.com" });
    (prisma.client.findFirst as any).mockResolvedValue({ id: "c1", userId: "trainer-1" });
    (prisma.supplementLog.create as any).mockResolvedValue({
      id: "supp-3",
      clientId: "c1",
      name: "Magnesium Glycinate",
      dosage: "400mg",
      timing: "Bedtime",
      taken: true,
    });

    const req = new Request("http://localhost/api/nutrition/supplements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: "c1",
        name: "Magnesium Glycinate",
        dosage: "400mg",
        timing: "Bedtime",
      }),
    });

    const res = await addSupp(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.supplement.name).toBe("Magnesium Glycinate");
    expect(data.supplement.dosage).toBe("400mg");
  });

  it("should toggle supplement taken status via PATCH", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "trainer-1", email: "coach@gym.com" },
    });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "trainer-1", email: "coach@gym.com" });
    (prisma.supplementLog.findUnique as any).mockResolvedValue({ id: "supp-1", clientId: "c1", taken: true });
    (prisma.client.findFirst as any).mockResolvedValue({ id: "c1", userId: "trainer-1" });
    (prisma.supplementLog.update as any).mockResolvedValue({ id: "supp-1", clientId: "c1", taken: false });

    const req = new Request("http://localhost/api/nutrition/supplements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "supp-1", taken: false }),
    });

    const res = await updateSupp(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.supplement.taken).toBe(false);
  });
});
