import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getPlan, PUT as updatePlan } from "@/app/api/nutrition/plan/route";
import { GET as getLogs, POST as addLog, DELETE as deleteLog } from "@/app/api/nutrition/logs/route";
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
    nutritionPlan: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    nutritionLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Nutrition Planner & Food Log APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("/api/nutrition/plan", () => {
    it("should return 401 if unauthenticated", async () => {
      (getServerSession as any).mockResolvedValue(null);
      const req = new Request("http://localhost/api/nutrition/plan?clientId=c1");
      const res = await getPlan(req);
      expect(res.status).toBe(401);
    });

    it("should return nutrition plan for authorized trainer", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "coach@pro.com" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({ id: "trainer-1", email: "coach@pro.com" });
      (prisma.client.findFirst as any).mockResolvedValue({ id: "c1", userId: "trainer-1", name: "Alex" });
      (prisma.nutritionPlan.findUnique as any).mockResolvedValue({
        id: "plan-1",
        clientId: "c1",
        goalType: "CUT",
        dailyCalories: 2100,
        proteinGrams: 180,
        carbsGrams: 190,
        fatsGrams: 60,
      });

      const req = new Request("http://localhost/api/nutrition/plan?clientId=c1");
      const res = await getPlan(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.plan.goalType).toBe("CUT");
      expect(data.plan.dailyCalories).toBe(2100);
      expect(data.plan.proteinGrams).toBe(180);
    });

    it("should update macro goals via PUT", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "coach@pro.com" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({ id: "trainer-1", email: "coach@pro.com" });
      (prisma.client.findFirst as any).mockResolvedValue({ id: "c1", userId: "trainer-1" });
      (prisma.nutritionPlan.upsert as any).mockResolvedValue({
        id: "plan-1",
        clientId: "c1",
        goalType: "BULK",
        dailyCalories: 2800,
        proteinGrams: 200,
        carbsGrams: 350,
        fatsGrams: 70,
      });

      const req = new Request("http://localhost/api/nutrition/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: "c1",
          goalType: "BULK",
          dailyCalories: 2800,
          proteinGrams: 200,
          carbsGrams: 350,
          fatsGrams: 70,
        }),
      });

      const res = await updatePlan(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.plan.goalType).toBe("BULK");
      expect(data.plan.dailyCalories).toBe(2800);
    });
  });

  describe("/api/nutrition/logs", () => {
    it("should log a food item via POST", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "trainer-1", email: "coach@pro.com" },
      });

      (prisma.user.findUnique as any).mockResolvedValue({ id: "trainer-1", email: "coach@pro.com" });
      (prisma.client.findFirst as any).mockResolvedValue({ id: "c1", userId: "trainer-1" });
      (prisma.nutritionLog.create as any).mockResolvedValue({
        id: "log-1",
        clientId: "c1",
        date: "2026-08-13",
        mealName: "Breakfast",
        foodName: "Eggs & Oatmeal",
        calories: 520,
        protein: 35,
        carbs: 55,
        fats: 15,
      });

      const req = new Request("http://localhost/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: "c1",
          date: "2026-08-13",
          mealName: "Breakfast",
          foodName: "Eggs & Oatmeal",
          calories: 520,
          protein: 35,
          carbs: 55,
          fats: 15,
        }),
      });

      const res = await addLog(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.log.foodName).toBe("Eggs & Oatmeal");
      expect(data.log.calories).toBe(520);
    });
  });
});
