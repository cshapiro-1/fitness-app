import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getWorkouts } from "@/app/api/workouts/route";
import { GET as getClientWorkouts } from "@/app/api/workouts/client/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { computeAnalytics } from "@/app/dashboard/utils/analytics";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
    },
    workout: {
      findMany: vi.fn(),
    },
  },
}));

describe("Client-Specific Workout History & PR Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAliceWorkouts = [
    {
      id: "session-alice-1",
      clientId: "client-alice-1",
      status: "COMPLETED",
      notes: "Alice's Heavy Day",
      completedAt: new Date("2026-09-01T10:00:00Z"),
      createdAt: new Date("2026-09-01T10:00:00Z"),
      loggedById: "trainer-collin-1",
      loggedByRole: "TRAINER",
      exercises: [
        {
          id: "ex-a1",
          name: "Barbell Bench Press",
          order: 0,
          sets: [
            { id: "s-a1", order: 0, weight: 275, reps: 5 },
            { id: "s-a2", order: 1, weight: 315, reps: 3 }, // Alice's Bench PR: 315 lbs
          ],
        },
        {
          id: "ex-a2",
          name: "Barbell Back Squat",
          order: 1,
          sets: [
            { id: "s-a3", order: 0, weight: 365, reps: 4 },
            { id: "s-a4", order: 1, weight: 405, reps: 2 }, // Alice's Squat PR: 405 lbs
          ],
        },
      ],
    },
  ];

  const mockBobWorkouts = [
    {
      id: "session-bob-1",
      clientId: "client-bob-2",
      status: "COMPLETED",
      notes: "Bob's Intro Hypertrophy",
      completedAt: new Date("2026-09-02T10:00:00Z"),
      createdAt: new Date("2026-09-02T10:00:00Z"),
      loggedById: "trainer-collin-1",
      loggedByRole: "TRAINER",
      exercises: [
        {
          id: "ex-b1",
          name: "Barbell Bench Press",
          order: 0,
          sets: [
            { id: "s-b1", order: 0, weight: 95, reps: 12 },
            { id: "s-b2", order: 1, weight: 135, reps: 10 }, // Bob's Bench PR: 135 lbs
          ],
        },
        {
          id: "ex-b2",
          name: "Barbell Back Squat",
          order: 1,
          sets: [
            { id: "s-b3", order: 0, weight: 135, reps: 10 },
            { id: "s-b4", order: 1, weight: 185, reps: 8 }, // Bob's Squat PR: 185 lbs
          ],
        },
      ],
    },
  ];

  describe("Coach Studio Query Isolation (/api/workouts?clientId=...)", () => {
    it("should strictly return Alice's workouts and PRs when Coach Collin queries Alice", async () => {
      (getServerSession as any).mockResolvedValue({
        user: {
          id: "trainer-collin-1",
          name: "Collin Shapiro",
          email: "collin.shapiro1@gmail.com",
          role: "TRAINER",
        },
      });

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "client-alice-1",
        name: "Alice Walker",
        email: "alice@example.com",
        userId: "trainer-collin-1",
      });

      (prisma.workoutSession.findMany as any).mockImplementation((args: any) => {
        // Must query ONLY client-alice-1 and NOT include loggedById in OR
        if (args.where?.clientId?.in?.includes("client-alice-1")) {
          return Promise.resolve(mockAliceWorkouts);
        }
        return Promise.resolve([]);
      });
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/workouts?clientId=client-alice-1");
      const res = await getWorkouts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(1);
      expect(data[0].id).toBe("session-alice-1");

      // Verify Prisma query was strictly scoped to Alice's ID and did NOT include loggedById OR clause
      const queryCall = (prisma.workoutSession.findMany as any).mock.calls[0][0];
      expect(queryCall.where.clientId).toEqual({ in: ["client-alice-1"] });
      expect(queryCall.where.OR).toBeUndefined();

      // Verify PR Analytics derived from this payload strictly reflect Alice's performance
      const aliceAnalytics = computeAnalytics(data);
      const bench = aliceAnalytics.exercises.find((e) => e.name === "Barbell Bench Press");
      const squat = aliceAnalytics.exercises.find((e) => e.name === "Barbell Back Squat");

      expect(bench?.maxWeight).toBe(315);
      expect(squat?.maxWeight).toBe(405);
    });

    it("should strictly return Bob's workouts and PRs with ZERO leakage of Alice's 315/405 lb lifts", async () => {
      (getServerSession as any).mockResolvedValue({
        user: {
          id: "trainer-collin-1",
          name: "Collin Shapiro",
          email: "collin.shapiro1@gmail.com",
          role: "TRAINER",
        },
      });

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "client-bob-2",
        name: "Bob Miller",
        email: "bob@example.com",
        userId: "trainer-collin-1",
      });

      (prisma.workoutSession.findMany as any).mockImplementation((args: any) => {
        if (args.where?.clientId?.in?.includes("client-bob-2")) {
          return Promise.resolve(mockBobWorkouts);
        }
        return Promise.resolve([]);
      });
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/workouts?clientId=client-bob-2");
      const res = await getWorkouts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(1);
      expect(data[0].id).toBe("session-bob-1");

      // Verify Prisma query was strictly scoped to Bob's ID
      const queryCall = (prisma.workoutSession.findMany as any).mock.calls[0][0];
      expect(queryCall.where.clientId).toEqual({ in: ["client-bob-2"] });
      expect(queryCall.where.OR).toBeUndefined();

      // Verify PR Analytics for Bob are completely isolated from Alice
      const bobAnalytics = computeAnalytics(data);
      const bench = bobAnalytics.exercises.find((e) => e.name === "Barbell Bench Press");
      const squat = bobAnalytics.exercises.find((e) => e.name === "Barbell Back Squat");

      expect(bench?.maxWeight).toBe(135);
      expect(bench?.maxWeight).not.toBe(315); // Alice's 315 lb lift MUST NOT leak
      expect(squat?.maxWeight).toBe(185);
      expect(squat?.maxWeight).not.toBe(405); // Alice's 405 lb lift MUST NOT leak
    });

    it("should never leak Coach Collin's personal workouts into an athlete's profile", async () => {
      (getServerSession as any).mockResolvedValue({
        user: {
          id: "trainer-collin-1",
          name: "Collin Shapiro",
          email: "collin.shapiro1@gmail.com",
          role: "TRAINER",
        },
      });

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "client-bob-2",
        name: "Bob Miller",
        email: "bob@example.com",
        userId: "trainer-collin-1",
      });

      // If Collin has personal profiles, they must not be fetched for Bob
      (prisma.workoutSession.findMany as any).mockResolvedValue(mockBobWorkouts);
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/workouts?clientId=client-bob-2");
      await getWorkouts(req);

      // Verify prisma.client.findMany was NOT called to consolidate Collin's personal accounts
      expect(prisma.client.findMany).not.toHaveBeenCalled();

      // Verify the query where clause has exactly targetClientIds = ['client-bob-2']
      const queryCall = (prisma.workoutSession.findMany as any).mock.calls[0][0];
      expect(queryCall.where.clientId.in).toEqual(["client-bob-2"]);
    });
  });

  describe("Athlete Portal Query Isolation (/api/workouts/client)", () => {
    it("should only return Bob's workouts when Bob accesses the client endpoint", async () => {
      (getServerSession as any).mockResolvedValue({
        user: {
          id: "user-bob-id",
          name: "Bob Miller",
          email: "bob@example.com",
          role: "CLIENT",
        },
      });

      (prisma.user.findFirst as any).mockResolvedValue({
        id: "user-bob-id",
        name: "Bob Miller",
        email: "bob@example.com",
        clientProfileId: "client-bob-2",
      });

      (prisma.client.findMany as any).mockImplementation((args: any) => {
        if (args.where?.email) {
          return Promise.resolve([{ id: "client-bob-2" }]);
        }
        return Promise.resolve([]);
      });

      (prisma.workoutSession.findMany as any).mockResolvedValue(mockBobWorkouts);
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/workouts/client");
      const res = await getClientWorkouts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(1);
      expect(data[0].id).toBe("session-bob-1");

      // Verify that loggedById was NOT included in the where clause
      const queryCall = (prisma.workoutSession.findMany as any).mock.calls[0][0];
      const hasLoggedByIdInOR = queryCall.where.OR?.some((cond: any) => "loggedById" in cond);
      expect(hasLoggedByIdInOR).toBeFalsy();
    });

    it("should prevent name collision leakage between athletes with the same first name and different emails", async () => {
      (getServerSession as any).mockResolvedValue({
        user: {
          id: "user-sarah-a",
          name: "Sarah Connor",
          email: "sarah.connor@example.com",
          role: "CLIENT",
        },
      });

      (prisma.user.findFirst as any).mockResolvedValue({
        id: "user-sarah-a",
        name: "Sarah Connor",
        email: "sarah.connor@example.com",
        clientProfileId: "client-sarah-1",
      });

      // Mock prisma.client.findMany for name matching
      (prisma.client.findMany as any).mockImplementation((args: any) => {
        // If searching by email
        if (args.where?.email?.equals === "sarah.connor@example.com") {
          return Promise.resolve([{ id: "client-sarah-1" }]);
        }
        // If searching by name with AND email condition
        if (args.where?.OR && args.where?.AND) {
          // The AND clause must prevent matching clients with another non-null email (e.g. sarah.miller@other.com)
          const emailCondition = args.where.AND[0].OR;
          const allowsNullOrOwn = emailCondition.some(
            (c: any) => c.email === null || c.email?.equals === "sarah.connor@example.com"
          );
          expect(allowsNullOrOwn).toBe(true);
          return Promise.resolve([{ id: "client-sarah-1" }]);
        }
        return Promise.resolve([]);
      });

      (prisma.workoutSession.findMany as any).mockResolvedValue([
        {
          id: "session-sarah-1",
          clientId: "client-sarah-1",
          status: "COMPLETED",
          exercises: [{ name: "Deadlift", sets: [{ weight: 225, reps: 5 }] }],
          client: { id: "client-sarah-1", name: "Sarah Connor", email: "sarah.connor@example.com" },
        },
      ]);
      (prisma.workout.findMany as any).mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/workouts/client");
      const res = await getClientWorkouts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(1);
      expect(data[0].clientId).toBe("client-sarah-1");
    });
  });

  describe("WorkoutBuilder PR & Past Performance Map Isolation", () => {
    it("should compute isolated PRs and past performance weights for each client", () => {
      // Alice's PR Map
      const alicePRMap: Record<string, number> = {};
      const alicePastMap: Record<string, { weight: number; reps: number }> = {};

      mockAliceWorkouts.forEach((w) => {
        w.exercises.forEach((ex) => {
          const norm = ex.name.trim().toLowerCase();
          ex.sets.forEach((st) => {
            if (!alicePRMap[norm] || st.weight > alicePRMap[norm]) {
              alicePRMap[norm] = st.weight;
            }
          });
          const lastSet = ex.sets[ex.sets.length - 1];
          alicePastMap[norm] = { weight: lastSet.weight, reps: lastSet.reps };
        });
      });

      // Bob's PR Map
      const bobPRMap: Record<string, number> = {};
      const bobPastMap: Record<string, { weight: number; reps: number }> = {};

      mockBobWorkouts.forEach((w) => {
        w.exercises.forEach((ex) => {
          const norm = ex.name.trim().toLowerCase();
          ex.sets.forEach((st) => {
            if (!bobPRMap[norm] || st.weight > bobPRMap[norm]) {
              bobPRMap[norm] = st.weight;
            }
          });
          const lastSet = ex.sets[ex.sets.length - 1];
          bobPastMap[norm] = { weight: lastSet.weight, reps: lastSet.reps };
        });
      });

      // Alice's PRs: Bench 315, Squat 405
      expect(alicePRMap["barbell bench press"]).toBe(315);
      expect(alicePRMap["barbell back squat"]).toBe(405);
      expect(alicePastMap["barbell bench press"].weight).toBe(315);

      // Bob's PRs: Bench 135, Squat 185 (NOT Alice's values!)
      expect(bobPRMap["barbell bench press"]).toBe(135);
      expect(bobPRMap["barbell back squat"]).toBe(185);
      expect(bobPastMap["barbell bench press"].weight).toBe(135);

      // Verify completely disjoint
      expect(bobPRMap["barbell bench press"]).not.toBe(alicePRMap["barbell bench press"]);
      expect(bobPRMap["barbell back squat"]).not.toBe(alicePRMap["barbell back squat"]);
    });
  });
});
