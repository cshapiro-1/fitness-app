export interface PlateBreakdown {
  targetWeight: number;
  barWeight: number;
  weightPerSide: number;
  platesPerSide: { weight: number; count: number }[];
  totalAchieved: number;
  remainder: number;
}

export const STANDARD_PLATES = [45, 35, 25, 10, 5, 2.5];

export function calculatePlates(
  targetWeight: number,
  barWeight: number = 45,
  availablePlates: number[] = STANDARD_PLATES
): PlateBreakdown {
  if (targetWeight <= barWeight) {
    return {
      targetWeight,
      barWeight,
      weightPerSide: 0,
      platesPerSide: [],
      totalAchieved: barWeight,
      remainder: 0,
    };
  }

  let neededPerSide = (targetWeight - barWeight) / 2;
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);
  const platesPerSide: { weight: number; count: number }[] = [];

  let currentSideWeight = 0;

  for (const plate of sortedPlates) {
    const count = Math.floor(neededPerSide / plate);
    if (count > 0) {
      platesPerSide.push({ weight: plate, count });
      neededPerSide -= count * plate;
      currentSideWeight += count * plate;
    }
  }

  const totalAchieved = barWeight + currentSideWeight * 2;
  const remainder = Math.round((targetWeight - totalAchieved) * 10) / 10;

  return {
    targetWeight,
    barWeight,
    weightPerSide: currentSideWeight,
    platesPerSide,
    totalAchieved,
    remainder,
  };
}

export const PLATE_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  45: { bg: "#2563eb", border: "#1d4ed8", text: "#ffffff" },
  35: { bg: "#eab308", border: "#ca8a04", text: "#ffffff" },
  25: { bg: "#16a34a", border: "#15803d", text: "#ffffff" },
  10: { bg: "#0f172a", border: "#020617", text: "#ffffff" },
  5: { bg: "#9333ea", border: "#7e22ce", text: "#ffffff" },
  2.5: { bg: "#64748b", border: "#475569", text: "#ffffff" },
};
