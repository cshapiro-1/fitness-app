import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/ai/anatomy-guide/route";
import { NextRequest } from "next/server";

describe("Anatomy & Kinesiology Visual Guide API", () => {
  it("should accurately match Hip Abduction Machine to hip_abduction chart (and not plank/core)", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Abduction Machine 3 x 12-15" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chart.image).toBe("/anatomy/hip_abduction.jpg");
    expect(json.chart.primaryMuscles.some((m: string) => m.includes("Gluteus Medius"))).toBe(true);
  });

  it("should accurately match Leg Extension to leg_extension quad chart (and not tricep extension)", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Seated Cable Leg Extension" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chart.image).toBe("/anatomy/leg_extension.jpg");
    expect(json.chart.primaryMuscles.some((m: string) => m.includes("Quadriceps"))).toBe(true);
  });

  it("should accurately match Leg Curl to leg_curl hamstring chart (and not bicep curl)", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Lying Hamstring Leg Curl" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chart.image).toBe("/anatomy/leg_curl.jpg");
    expect(json.chart.primaryMuscles.some((m: string) => m.includes("Hamstrings"))).toBe(true);
  });

  it("should accurately match Calf Raise to calf_raise gastrocnemius chart", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Standing Smith Machine Calf Raises" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chart.image).toBe("/anatomy/calf_raise.jpg");
    expect(json.chart.primaryMuscles.some((m: string) => m.includes("Gastrocnemius"))).toBe(true);
  });

  it("should dynamically resolve custom trainer exercises with smart kinesiology synthesis", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Deficit Reverse Bulgarian Split Squat" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chart.image).toBe("/anatomy/bulgarian_split_squat.jpg");
    expect(json.chart.title).toContain("Bulgarian Split Squat");
  });

  it("should accurately match Back Hyperextensions to erector spinae chart", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Back Hyperextensions 3x12" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chart.title).toContain("Back Hyperextensions");
    expect(json.chart.primaryMuscles.some((m: string) => m.includes("Erector Spinae"))).toBe(true);
  });

  it("should accurately match QL Extensions to Quadratus Lumborum chart (and not tricep extension)", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "QL Extensions 3 x 10" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chart.image).toBe("/anatomy/ql_extension.svg");
    expect(json.chart.primaryMuscles.some((m: string) => m.includes("Quadratus Lumborum"))).toBe(true);
  });

  it("should accurately match Face Pulls to posterior deltoids and rotator cuff chart", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/anatomy-guide", {
      method: "POST",
      body: JSON.stringify({ exerciseName: "Cable Face Pulls 3x15" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chart.title).toContain("Face Pull");
    expect(json.chart.primaryMuscles.some((m: string) => m.includes("Posterior Deltoids"))).toBe(true);
  });
});
