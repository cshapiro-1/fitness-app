import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as unsubscribeGet, POST as unsubscribePost } from "@/app/api/notifications/unsubscribe/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      updateMany: vi.fn(),
    },
  },
}));

describe("Unsubscribe Notification Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if neither email nor clientId is provided", async () => {
    const req = new Request("http://localhost/api/notifications/unsubscribe");
    const res = await unsubscribeGet(req);
    expect(res.status).toBe(400);
  });

  it("should unsubscribe client and user by email and return HTML confirmation", async () => {
    (prisma.client.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.user.updateMany as any).mockResolvedValue({ count: 1 });

    const req = new Request("http://localhost/api/notifications/unsubscribe?email=client@fitness.com");
    const res = await unsubscribeGet(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("Successfully Unsubscribed");
    expect(html).toContain("client@fitness.com");

    expect(prisma.client.updateMany).toHaveBeenCalledWith({
      where: { email: "client@fitness.com" },
      data: { emailNotifications: false },
    });
  });

  it("should allow re-subscribing when resubscribe=true is passed", async () => {
    (prisma.client.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.user.updateMany as any).mockResolvedValue({ count: 1 });

    const req = new Request("http://localhost/api/notifications/unsubscribe?email=client@fitness.com&resubscribe=true");
    const res = await unsubscribeGet(req);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Notifications Re-enabled");

    expect(prisma.client.updateMany).toHaveBeenCalledWith({
      where: { email: "client@fitness.com" },
      data: { emailNotifications: true },
    });
  });

  it("should update preferences via POST JSON endpoint", async () => {
    (prisma.client.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.user.updateMany as any).mockResolvedValue({ count: 1 });

    const req = new Request("http://localhost/api/notifications/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "client@fitness.com", enabled: false }),
    });

    const res = await unsubscribePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.enabled).toBe(false);
  });
});
