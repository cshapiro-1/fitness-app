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
    expect(data.chart.steps.length).toBeGreaterThan(0);
    expect(data.chart.commonMistakes.length).toBeGreaterThan(0);
    expect(data.chart.breathingPattern).toBeDefined();
  });

  it("should return bench press anatomical chart for Incline Dumbbell Press", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Incline Dumbbell Chest Press" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chart.title).toContain("Incline Dumbbell");
    expect(data.chart.image).toBe("/anatomy/bench.jpg");
    expect(data.chart.primaryMuscles).toContain("Pectoralis Major (Sternal & Clavicular Heads)");
  });

  it("should return pigeon pose stretch chart for Pigeon Stretch", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Pigeon Pose Glute Stretch" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chart.title).toContain("Pigeon");
    expect(data.chart.image).toBe("/anatomy/pigeon.jpg");
    expect(data.chart.primaryMuscles).toContain("Deep Piriformis");
  });

  it("should return accurate brachialis & brachioradialis anatomy for Dumbbell Hammer Curl", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Dumbbell Hammer Curl" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chart.primaryMuscles).toContain("Brachialis");
    expect(data.chart.primaryMuscles).toContain("Brachioradialis");
    expect(data.chart.biomechanicsCue).toContain("neutral grip");
  });

  it("should return latissimus dorsi anatomy for Lat Pulldown", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Lat Pulldown (Close Grip)" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chart.primaryMuscles).toContain("Latissimus Dorsi");
  });

  it("should return triceps brachii anatomy for Tricep Rope Pushdown", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Tricep Rope Pushdown" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chart.primaryMuscles).toContain("Triceps Brachii (Lateral Head, Long Head, Medial Head)");
  });

  it("should return hamstring & glute anatomy for Romanian Deadlift", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Romanian Deadlift (RDL)" }),
    });

    const res = await anatomyGuidePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chart.primaryMuscles).toContain("Hamstrings (Biceps Femoris, Semitendinosus, Semimembranosus)");
    expect(data.chart.primaryMuscles).toContain("Gluteus Maximus");
  });
});
