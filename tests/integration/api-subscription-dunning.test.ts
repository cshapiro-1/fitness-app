import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/cron/subscription-dunning/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => {
  const mockTrainers = [
    {
      id: "trainer-expiring-2days",
      name: "Coach Tim",
      email: "tim@fit.com",
      role: "TRAINER",
      emailNotifications: true,
      subscriptionStatus: "trial",
      trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
      subscribedUntil: null,
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    },
    {
      id: "trainer-lapsed-3days",
      name: "Coach Dan",
      email: "dan@fit.com",
      role: "TRAINER",
      emailNotifications: true,
      subscriptionStatus: "expired",
      trialEndsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days in past
      subscribedUntil: null,
      createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
    },
    {
      id: "trainer-quarterly-active",
      name: "Coach Sarah",
      email: "sarah@fit.com",
      role: "TRAINER",
      emailNotifications: true,
      subscriptionStatus: "active",
      trialEndsAt: null,
      subscribedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // exactly 90 days
    },
  ];

  const mockClients = [
    {
      id: "client-quarterly",
      name: "Client Jake",
      email: "jake@client.com",
      emailNotifications: true,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days (multiple of 90)
    },
  ];

  return {
    prisma: {
      user: {
        findMany: vi.fn().mockResolvedValue(mockTrainers),
      },
      client: {
        findMany: vi.fn().mockResolvedValue(mockClients),
      },
    },
  };
});

describe("Subscription Dunning & Quarterly Feedback Cron API", () => {
  it("should process trial expiry notices, lapsed reminders, and quarterly feedback surveys", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/subscription-dunning", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.stats.trialExpiryNoticesSent).toBeGreaterThanOrEqual(1);
    expect(json.stats.lapsedRemindersSent).toBeGreaterThanOrEqual(1);
    expect(json.stats.quarterlyFeedbackSent).toBeGreaterThanOrEqual(1);
  });
});
