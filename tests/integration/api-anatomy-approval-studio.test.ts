import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as adminAnatomyGET, PATCH as adminAnatomyPATCH } from "@/app/api/admin/anatomy/route";
import { POST as generateAnatomyPOST } from "@/app/api/admin/anatomy/generate/route";
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
    exercise: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
  },
}));

describe("Master Admin Anatomy Studio & 1-by-1 Approval System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/anatomy", () => {
    it("should return unified list of exercises and stretches with approval statistics", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "admin-collin", email: "collin.shapiro1@gmail.com" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin-collin",
        isAdmin: true,
      } as any);

      vi.mocked(prisma.exercise.count).mockResolvedValue(2);
      vi.mocked(prisma.exercise.findMany).mockResolvedValue([
        {
          id: "ex-1",
          name: "Barbell Bench Press",
          normalizedName: "barbell_bench_press",
          type: "EXERCISE",
          muscleGroup: "Chest",
          equipment: "Barbell",
          category: "STRENGTH",
          primaryMuscles: JSON.stringify(["Pectoralis Major"]),
          secondaryMuscles: JSON.stringify(["Triceps Brachii", "Anterior Deltoid"]),
          biomechanicsCue: "Retract scapulae and press.",
          steps: JSON.stringify(["Lie on bench", "Press"]),
          commonMistakes: JSON.stringify(["Flaring elbows"]),
          breathingPattern: "Inhale down, exhale up",
          diagramUrl: "/anatomy/bench.jpg",
          diagramStatus: "APPROVED",
        },
        {
          id: "stretch-1",
          name: "Pigeon Stretch",
          normalizedName: "pigeon_stretch",
          type: "STRETCH",
          muscleGroup: "Stretching",
          equipment: "Bodyweight",
          category: "STATIC_STRETCH",
          primaryMuscles: JSON.stringify(["Piriformis", "Gluteus Medius"]),
          secondaryMuscles: JSON.stringify(["Gluteus Maximus"]),
          biomechanicsCue: "Square hips to floor.",
          steps: JSON.stringify(["Right knee forward", "Hold"]),
          commonMistakes: JSON.stringify(["Rolling onto hip"]),
          breathingPattern: "Deep belly breaths",
          diagramUrl: "/anatomy/pigeon.jpg",
          diagramStatus: "PENDING_APPROVAL",
        },
      ] as any);

      const req = new NextRequest("http://localhost:3000/api/admin/anatomy");
      const res = await adminAnatomyGET(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.summary.totalCount).toBe(2);
      expect(data.summary.approvedCount).toBe(1);
      expect(data.summary.pendingCount).toBe(1);
      expect(data.summary.approvalPercentage).toBe(50);

      expect(data.exercises.length).toBe(2);
      expect(data.exercises[0].name).toBe("Barbell Bench Press");
      expect(data.exercises[1].name).toBe("Pigeon Stretch");
      expect(data.exercises[1].type).toBe("STRETCH");
    });
  });

  describe("PATCH /api/admin/anatomy", () => {
    it("should allow admin to approve an anatomy diagram with timestamp and notes", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "admin-collin", email: "collin.shapiro1@gmail.com" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin-collin",
        isAdmin: true,
      } as any);

      vi.mocked(prisma.exercise.update).mockResolvedValue({
        id: "ex-1",
        name: "Barbell Bench Press",
        diagramStatus: "APPROVED",
        diagramUrl: "/anatomy/bench.jpg",
        approvedByUserId: "admin-collin",
        approvedAt: new Date(),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/anatomy", {
        method: "PATCH",
        body: JSON.stringify({
          id: "ex-1",
          diagramStatus: "APPROVED",
          diagramUrl: "/anatomy/bench.jpg",
          biomechanicsCue: "Strict scapular retraction with 45 degree elbow tuck.",
          primaryMuscles: ["Pectoralis Major (Sternal Head)"],
          secondaryMuscles: ["Triceps Brachii", "Anterior Deltoid"],
        }),
      });

      const res = await adminAnatomyPATCH(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ex-1" },
          data: expect.objectContaining({
            diagramStatus: "APPROVED",
            diagramUrl: "/anatomy/bench.jpg",
          }),
        })
      );
    });

    it("should allow admin to revert an accidentally approved diagram back to PENDING_APPROVAL", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "admin-collin", email: "collin.shapiro1@gmail.com" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin-collin",
        isAdmin: true,
      } as any);

      vi.mocked(prisma.exercise.update).mockResolvedValue({
        id: "ex-chest-dip",
        name: "Chest Dip",
        diagramStatus: "PENDING_APPROVAL",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/anatomy", {
        method: "PATCH",
        body: JSON.stringify({
          id: "ex-chest-dip",
          name: "Chest Dip",
          diagramStatus: "PENDING_APPROVAL",
        }),
      });

      const res = await adminAnatomyPATCH(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.exercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ex-chest-dip" },
          data: expect.objectContaining({
            diagramStatus: "PENDING_APPROVAL",
          }),
        })
      );
    });
  });

  describe("POST /api/admin/anatomy/generate", () => {
    it("should generate anatomy diagram and kinesiology preview for custom exercise", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "trainer-1", role: "TRAINER" },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/anatomy/generate", {
        method: "POST",
        body: JSON.stringify({
          name: "Deficit Bulgarian Split Squat",
          muscleGroup: "Legs",
          equipment: "Dumbbell",
          type: "EXERCISE",
        }),
      });

      const res = await generateAnatomyPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Deficit Bulgarian Split Squat");
      expect(data.data.primaryMuscles.length).toBeGreaterThan(0);
      expect(data.data.diagramUrl).toBeDefined();
      expect(data.data.diagramStatus).toBe("PENDING_APPROVAL");
    });

    it("should generate anatomy diagram and kinesiology preview for custom stretch", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "trainer-1", role: "TRAINER" },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/anatomy/generate", {
        method: "POST",
        body: JSON.stringify({
          name: "Deep Piriformis Stretch",
          muscleGroup: "Stretching",
          equipment: "Bodyweight",
          type: "STRETCH",
        }),
      });

      const res = await generateAnatomyPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.type).toBe("STRETCH");
      expect(data.data.primaryMuscles).toContain("Piriformis");
      expect(data.data.diagramUrl).toBe("/anatomy/pigeon.jpg");
    });
  });
});
