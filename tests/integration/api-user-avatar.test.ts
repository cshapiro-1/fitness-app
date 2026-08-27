import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/user/avatar/route";
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
  },
}));

describe("User Avatar Streaming Proxy API - GET /api/user/avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthorized and no email provided", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/user/avatar");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("should stream avatar response when valid user email is resolved", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { email: "collin@gym.com" },
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      image: "https://lh3.googleusercontent.com/a/ACg8ocAvatarTest",
      name: "Collin Shapiro",
    });

    // Mock global fetch for Google avatar stream
    const mockImageBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: async () => mockImageBuffer,
    }) as any;

    const req = new Request("http://localhost:3000/api/user/avatar?email=collin@gym.com");
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("cache-control")).toContain("max-age=86400");
  });
});
