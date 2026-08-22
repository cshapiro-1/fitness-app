import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/summarize-workout/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe("POST /api/ai/summarize-workout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/ai/summarize-workout", {
      method: "POST",
      body: JSON.stringify({ workout: null }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return generated AI summary for valid workout payload", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "coach-1", email: "coach@strkyr.fit" },
    });

    const req = new NextRequest("http://localhost:3000/api/ai/summarize-workout", {
      method: "POST",
      body: JSON.stringify({
        workout: {
          exercises: [
            {
              name: "Barbell Back Squat",
              sets: [{ weight: "315", reps: "5" }],
            },
          ],
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalVolumeLbs).toBe(1575);
    expect(data.totalSets).toBe(1);
    expect(data.summary).toContain("Legs");
    expect(data.summary).toContain("Barbell Back Squat");
  });
});
