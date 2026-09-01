/**
 * Periodization & Progressive Overload Engine
 * Handles multi-week training program calculations, progressive overloading curves,
 * deload periodization, superset sequencing, and calendar materialization.
 */

export interface PeriodizedExercise {
  name: string;
  order: number;
  category?: string;
  targetSets: number;
  targetReps: string;
  suggestedWeight: number;
  rpe?: number;
  supersetGroup?: string | null;
  restSeconds?: number;
  coachingCue?: string;
  progressionNotes?: string;
}

export interface PeriodizedWorkout {
  name: string;
  order: number;
  weekNumber: number;
  dayNumber: number;
  scheduledDate: string; // YYYY-MM-DD
  cadence: string;
  isDeloadWeek: boolean;
  notes?: string;
  exercises: PeriodizedExercise[];
}

export interface ProgramProgressionConfig {
  durationWeeks: number;
  startDate: string; // YYYY-MM-DD
  progressionType: "LINEAR_OVERLOAD" | "PERCENTAGE_BASED" | "WAVE_PERIODIZATION" | "STEP_LOADING" | "CUSTOM";
  progressionRate?: number; // e.g. 2.5% per week or lbs
  deloadFrequency?: number; // e.g. every 4th week
}

export interface WorkoutTemplateInput {
  name: string;
  order: number;
  cadence: string;
  dayOfWeek?: number | null; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  exercises: {
    name: string;
    order: number;
    category?: string;
    targetSets: number;
    targetReps: string;
    suggestedWeight?: number;
    rpe?: number;
    supersetGroup?: string | null;
    restSeconds?: number;
    coachingCue?: string;
    progressionNotes?: string;
  }[];
}

/**
 * Calculates calendar date given a start date, week index (0-based), and day index (0-based)
 */
export function calculateWorkoutDate(startDateStr: string, weekIndex: number, dayOfWeek?: number | null, templateIndex: number = 0): string {
  const start = new Date(startDateStr + "T00:00:00");
  if (isNaN(start.getTime())) {
    const today = new Date();
    today.setDate(today.getDate() + weekIndex * 7 + (dayOfWeek ?? templateIndex * 2));
    return today.toISOString().split("T")[0];
  }

  // If specific day of week is provided (1=Mon ... 7=Sun)
  if (dayOfWeek && dayOfWeek >= 1 && dayOfWeek <= 7) {
    const currentDay = start.getDay() === 0 ? 7 : start.getDay(); // 1=Mon..7=Sun
    const dayOffset = dayOfWeek - currentDay;
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + weekIndex * 7 + dayOffset);
    return targetDate.toISOString().split("T")[0];
  }

  // Default cadence: Space days evenly (e.g. Day 0 = +0, Day 1 = +2, Day 2 = +4)
  const defaultSpacing = [0, 2, 4, 1, 3, 5, 6];
  const offsetDays = defaultSpacing[templateIndex % defaultSpacing.length] ?? (templateIndex * 2);
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + weekIndex * 7 + offsetDays);
  return targetDate.toISOString().split("T")[0];
}

/**
 * Calculates progressive weight and volume for a specific week based on periodization model
 */
export function calculateProgressiveWeight(
  baseWeight: number,
  weekNumber: number, // 1-based (Week 1, Week 2, ...)
  config: ProgramProgressionConfig
): { weight: number; isDeload: boolean; multiplier: number } {
  if (baseWeight <= 0) {
    return { weight: 0, isDeload: false, multiplier: 1 };
  }

  const { progressionType, progressionRate = 2.5, deloadFrequency = 4 } = config;
  const isDeload = deloadFrequency > 0 && weekNumber % deloadFrequency === 0;

  if (isDeload) {
    // Deload week: drop intensity to ~65-70% of base load for systemic recovery
    const deloadMultiplier = 0.70;
    const deloadWeight = Math.round((baseWeight * deloadMultiplier) / 2.5) * 2.5; // Round to nearest 2.5 lb/kg plate
    return { weight: Math.max(5, deloadWeight), isDeload: true, multiplier: deloadMultiplier };
  }

  let multiplier = 1;
  const nonDeloadWeeksPrior = Math.max(0, weekNumber - 1 - (deloadFrequency > 0 ? Math.floor((weekNumber - 1) / deloadFrequency) : 0));

  switch (progressionType) {
    case "LINEAR_OVERLOAD":
    case "PERCENTAGE_BASED": {
      // Standard linear progression: +X% per non-deload week
      const rateDecimal = (progressionRate || 2.5) / 100;
      multiplier = 1 + nonDeloadWeeksPrior * rateDecimal;
      break;
    }
    case "WAVE_PERIODIZATION": {
      // Wave loading (3-week wave: W1 = 100%, W2 = 104%, W3 = 108%, W4 Deload 70%, W5 = 105%, W6 = 109%, W7 = 113%)
      const wavePosition = ((weekNumber - 1) % 4) + 1; // 1, 2, 3, or 4
      const waveCycle = Math.floor((weekNumber - 1) / 4);
      const baseWaveBonus = waveCycle * 0.04;
      if (wavePosition === 1) multiplier = 1.00 + baseWaveBonus;
      else if (wavePosition === 2) multiplier = 1.04 + baseWaveBonus;
      else if (wavePosition === 3) multiplier = 1.08 + baseWaveBonus;
      break;
    }
    case "STEP_LOADING": {
      // Step loading: 2 weeks at same weight, then a step jump of 5%
      const stepIndex = Math.floor(nonDeloadWeeksPrior / 2);
      multiplier = 1 + stepIndex * 0.05;
      break;
    }
    case "CUSTOM":
    default:
      multiplier = 1 + nonDeloadWeeksPrior * 0.025;
      break;
  }

  const calculatedWeight = Math.round((baseWeight * multiplier) / 2.5) * 2.5;
  return { weight: Math.max(baseWeight, calculatedWeight), isDeload: false, multiplier };
}

/**
 * Materializes all scheduled workouts across the entire program duration
 */
export function materializeProgramSchedule(
  templates: WorkoutTemplateInput[],
  config: ProgramProgressionConfig
): PeriodizedWorkout[] {
  const schedule: PeriodizedWorkout[] = [];
  const { durationWeeks, startDate } = config;

  for (let week = 1; week <= durationWeeks; week++) {
    const isDeloadWeek = config.deloadFrequency ? (week % config.deloadFrequency === 0) : false;

    templates.forEach((template, templateIdx) => {
      const scheduledDate = calculateWorkoutDate(startDate, week - 1, template.dayOfWeek, templateIdx);

      const periodizedExercises: PeriodizedExercise[] = template.exercises.map((ex) => {
        const { weight, isDeload, multiplier } = calculateProgressiveWeight(
          ex.suggestedWeight || 0,
          week,
          config
        );

        let progressionNote = "";
        if (isDeload) {
          progressionNote = `🧘 Deload Week ${week}: Load reduced to 70% for active recovery. Focus on perfect eccentric control.`;
        } else if (week > 1 && ex.suggestedWeight && ex.suggestedWeight > 0) {
          const increasePct = Math.round((multiplier - 1) * 100);
          progressionNote = `⚡ Progressive Overload Week ${week}: +${increasePct}% load target (${weight} lbs/kg). Target RPE: ${ex.rpe ? ex.rpe : (8 + Math.min(1.5, week * 0.2)).toFixed(1)}.`;
        }

        return {
          name: ex.name,
          order: ex.order,
          category: ex.category || "STRENGTH",
          targetSets: isDeload ? Math.max(2, ex.targetSets - 1) : ex.targetSets,
          targetReps: ex.targetReps,
          suggestedWeight: weight,
          rpe: isDeload ? 6.0 : ex.rpe || (week <= 2 ? 7.5 : week <= 4 ? 8.5 : 9.0),
          supersetGroup: ex.supersetGroup || null,
          restSeconds: ex.restSeconds || (ex.supersetGroup ? 45 : 90),
          coachingCue: ex.coachingCue || "",
          progressionNotes: progressionNote || ex.progressionNotes || "",
        };
      });

      schedule.push({
        name: `Week ${week} — ${template.name}${isDeloadWeek ? " (Deload)" : ""}`,
        order: (week - 1) * templates.length + templateIdx,
        weekNumber: week,
        dayNumber: templateIdx + 1,
        scheduledDate,
        cadence: template.cadence,
        isDeloadWeek,
        notes: isDeloadWeek
          ? `🧘 Program Deload Session (Week ${week} of ${durationWeeks}). Volume and load reduced for nervous system recovery.`
          : `⚡ Program Session (Week ${week} of ${durationWeeks}). Progressive overload applied.`,
        exercises: periodizedExercises,
      });
    });
  }

  return schedule;
}
