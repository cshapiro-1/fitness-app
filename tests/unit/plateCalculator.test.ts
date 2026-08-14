import { describe, it, expect } from "vitest";
import { calculatePlates } from "@/app/dashboard/utils/plateCalculator";

describe("Barbell Plate Calculator Algorithm", () => {
  it("should return empty plates when target weight equals bar weight (45 lbs)", () => {
    const res = calculatePlates(45, 45);
    expect(res.weightPerSide).toBe(0);
    expect(res.platesPerSide).toEqual([]);
    expect(res.totalAchieved).toBe(45);
    expect(res.remainder).toBe(0);
  });

  it("should calculate 225 lbs as 2x 45 lb plates per side on a 45 lb bar", () => {
    const res = calculatePlates(225, 45);
    expect(res.weightPerSide).toBe(90);
    expect(res.platesPerSide).toEqual([{ weight: 45, count: 2 }]);
    expect(res.totalAchieved).toBe(225);
    expect(res.remainder).toBe(0);
  });

  it("should calculate 185 lbs as 1x 45 lb and 1x 25 lb plate per side", () => {
    const res = calculatePlates(185, 45);
    expect(res.weightPerSide).toBe(70);
    expect(res.platesPerSide).toEqual([
      { weight: 45, count: 1 },
      { weight: 25, count: 1 },
    ]);
    expect(res.totalAchieved).toBe(185);
  });

  it("should calculate complex weights with micro-plates (e.g. 205 lbs)", () => {
    const res = calculatePlates(205, 45);
    expect(res.weightPerSide).toBe(80);
    expect(res.platesPerSide).toEqual([
      { weight: 45, count: 1 },
      { weight: 35, count: 1 },
    ]);
    expect(res.totalAchieved).toBe(205);
  });

  it("should handle fractional targets with remaining delta (e.g. 137 lbs)", () => {
    const res = calculatePlates(137, 45);
    expect(res.totalAchieved).toBe(135);
    expect(res.remainder).toBe(2);
  });
});
