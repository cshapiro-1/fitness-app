import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/import-text-history/route";
import { parseSMSWorkoutText, parseSMSBackupXML, parseChatExport, parseBulkAndroidFile } from "@/lib/smsWorkoutParser";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    workoutSession: {
      create: vi.fn(),
    },
  },
}));

describe("SMS & Text Message Workout Importer (Multi-Client)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseSMSWorkoutText parser logic", () => {
    it("should parse multi-client text headers and attribute workouts correctly", () => {
      const rawText = `[Collin Shapiro]
8/10 - Upper Power
Bench Press 4x8 @ 185, 205, 215, 225
Incline DB Press 3x10 @ 65s

[Sarah Jenkins]
8/12 - Lower Strength
Barbell Squat 4x6 @ 275, 295, 315, 315
Romanian Deadlift 3x8 @ 225`;

      const knownClients = [
        { id: "c-collin", name: "Collin Shapiro" },
        { id: "c-sarah", name: "Sarah Jenkins" },
      ];

      const sessions = parseSMSWorkoutText(rawText, undefined, knownClients);

      expect(sessions.length).toBe(2);
      expect(sessions[0].clientId).toBe("c-collin");
      expect(sessions[0].clientName).toBe("Collin Shapiro");
      expect(sessions[0].exercises.length).toBe(2);
      expect(sessions[0].exercises[0].name).toContain("Bench Press");

      expect(sessions[1].clientId).toBe("c-sarah");
      expect(sessions[1].clientName).toBe("Sarah Jenkins");
      expect(sessions[1].exercises.length).toBe(2);
      expect(sessions[1].exercises[0].name).toContain("Squat");
    });

    it("should parse Android SMS Backup & Restore XML files spanning years", () => {
      const xmlData = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<smses count="3">
  <sms protocol="0" address="+15551234567" date="1691668800000" type="1" subject="null" body="See you tomorrow at 5pm bro!" contact_name="Collin Shapiro" />
  <sms protocol="0" address="+15551234567" date="1691755200000" type="1" subject="null" body="Assisted Pull Ups 3 x 8-10&#10;Wide Grip 60lbs x 12, 50 x 10&#10;Leg Press 3 x 15 @ 360lbs" contact_name="Collin Shapiro" />
  <sms protocol="0" address="+15559876543" date="1691841600000" type="1" subject="null" body="Barbell Squats 4x8 @ 225lbs&#10;Romanian Deadlifts 3x10 @ 185" contact_name="Sarah Jenkins" />
</smses>`;

      const knownClients = [
        { id: "c-collin", name: "Collin Shapiro" },
        { id: "c-sarah", name: "Sarah Jenkins" },
      ];

      const { sessions, totalMessagesScanned } = parseSMSBackupXML(xmlData, knownClients);

      expect(totalMessagesScanned).toBe(3);
      expect(sessions.length).toBe(2);
      expect(sessions[0].clientName).toBe("Collin Shapiro");
      expect(sessions[0].clientId).toBe("c-collin");
      expect(sessions[0].exercises.length).toBeGreaterThanOrEqual(2);

      expect(sessions[1].clientName).toBe("Sarah Jenkins");
      expect(sessions[1].clientId).toBe("c-sarah");
    });

    it("should parse WhatsApp / Samsung multi-year chat exports", () => {
      const chatText = `[08/10/23, 4:15:10 PM] Jose Dildine: Hey Collin! Ready for today?
[08/10/23, 6:00:22 PM] Jose Dildine: Bench Press 4x8 @ 225, 225, 235, 245
[08/10/23, 6:01:05 PM] Jose Dildine: Incline DB Press 3x10 @ 75s
[08/12/23, 5:30:00 PM] Sarah: Squat 4x5 @ 315lbs
[08/12/23, 5:32:00 PM] Sarah: Leg Press 3x12 @ 400`;

      const knownClients = [
        { id: "c-collin", name: "Collin Shapiro" },
        { id: "c-sarah", name: "Sarah" },
      ];

      const { sessions, totalMessagesScanned } = parseChatExport(chatText, knownClients);

      expect(totalMessagesScanned).toBe(5);
      expect(sessions.length).toBe(2);
    });
  });

  describe("POST /api/ai/import-text-history", () => {
    it("should reject unauthenticated import requests", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/ai/import-text-history", {
        method: "POST",
        body: JSON.stringify({ rawText: "Bench 3x10 @ 135" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("should successfully backfill multi-client workouts for a trainer", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", name: "Coach Mike", email: "mike@fit.com", role: "TRAINER" },
      });

      (prisma.client.findMany as any).mockResolvedValue([
        { id: "c-collin", userId: "trainer-1", name: "Collin Shapiro" },
        { id: "c-sarah", userId: "trainer-1", name: "Sarah Jenkins" },
      ]);

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "c-collin",
        userId: "trainer-1",
        name: "Collin Shapiro",
      });

      (prisma.workoutSession.create as any).mockImplementation((args: any) => ({
        id: "ws-" + Math.random(),
        ...args.data,
        exercises: args.data.exercises.create.map((ex: any) => ({
          name: ex.name,
          sets: ex.sets.create,
        })),
      }));

      const req = new NextRequest("http://localhost:3000/api/ai/import-text-history", {
        method: "POST",
        body: JSON.stringify({
          clientId: "c-collin",
          mode: "commit",
          sessions: [
            {
              date: "2026-08-10",
              title: "Upper Power",
              clientId: "c-collin",
              exercises: [
                {
                  name: "Bench Press",
                  sets: [{ weight: 225, reps: 8 }],
                },
              ],
            },
            {
              date: "2026-08-12",
              title: "Lower Strength",
              clientId: "c-sarah",
              exercises: [
                {
                  name: "Barbell Squat",
                  sets: [{ weight: 315, reps: 5 }],
                },
              ],
            },
          ],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.importedCount).toBe(2);
      expect(prisma.workoutSession.create).toHaveBeenCalledTimes(2);
    });
  });
});
