import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as anatomyGuidePost } from "@/app/api/ai/anatomy-guide/route";
import { NextRequest } from "next/server";

describe("AI 3D Anatomy Visual Guide API", () => {
  it("should return squat anatomical chart and quadriceps/glutes for Barbell Squat", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Barbell Back Squat" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.chart.title).toBe("Barbell Back Squat");
    expect(data.chart.image).toBe("/anatomy/squat.jpg");
    expect(data.chart.primaryMuscles).toContain("Quadriceps Femoris (Rectus Femoris, Vastus Lateralis/Medialis)");
  });

  it("should return bench press anatomical chart for Incline Dumbbell Press", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Incline Dumbbell Chest Press" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chart.title).toBe("Barbell Bench Press");
    expect(data.chart.image).toBe("/anatomy/bench.jpg");
  });

  it("should return pigeon pose stretch chart for Pigeon Stretch", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Pigeon Pose Glute Stretch" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chart.title).toBe("Pigeon Pose Hip Stretch");
    expect(data.chart.image).toBe("/anatomy/pigeon.jpg");
    expect(data.chart.primaryMuscles).toContain("Deep Piriformis");
  });
});
