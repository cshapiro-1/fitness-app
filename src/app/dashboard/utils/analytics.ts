import { WorkoutSession } from "../types";

export type ExerciseTrendPoint = {
  completedAt: string;
  workoutId: string;
  topWeight: number;
  topReps: number;
  estimatedOneRepMax: number;
  totalVolume: number;
  setCount: number;
};

export type ExerciseAnalytics = {
  name: string;
  muscleGroup: string;
  maxWeight: number;
  maxReps: number;
  avgTopWeight: number;
  maxEstimated1RM: number;
  totalVolume: number;
  sessions: number;
  totalSets: number;
  trend: ExerciseTrendPoint[];
  weightChangePercent: number;
};

export type MuscleGroupSummary = {
  name: string;
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
  exercises: ExerciseAnalytics[];
};

export type WorkoutAnalytics = {
  id: string;
  completedAt: string;
  exerciseCount: number;
  setCount: number;
  peakWeight: number;
  peakReps: number;
  totalVolume: number;
};

export type ACWRData = {
  acuteLoad: number; // 7-day total volume
  chronicLoad: number; // 28-day volume normalized to weekly average (sum/4)
  ratio: number; // acute / chronic
  zone: "optimal" | "overreaching" | "danger" | "deload";
  recommendation: string;
};

export type SymmetryData = {
  pushVolume: number;
  pullVolume: number;
  pushToPullRatio: number;
  quadVolume: number;
  hamstringVolume: number;
  quadToHamRatio: number;
  anteriorVolume: number;
  posteriorVolume: number;
  coreVolume: number;
  armsVolume: number;
  radarPoints: Array<{ label: string; value: number; normalizedPercent: number }>;
};

export type IntensityDistribution = {
  zone1Count: number; // < 70% 1RM
  zone1Volume: number;
  zone1Percent: number;
  zone2Count: number; // 70% - 84% 1RM
  zone2Volume: number;
  zone2Percent: number;
  zone3Count: number; // >= 85% 1RM
  zone3Volume: number;
  zone3Percent: number;
  totalTrackedSets: number;
};

export type MultiLiftTrendPoint = {
  date: string;
  [key: string]: string | number;
};

export type MultiLiftComparison = {
  availableLifts: string[];
  timeline: MultiLiftTrendPoint[];
};

export type ExerciseMilestoneBadge = {
  type: "weight_pr" | "1rm_pr" | "first_record" | "high_rep_pr";
  badgeText: string;
  celebrationText: string;
  diffWeight?: number;
  percentGain?: number;
  previousWeight?: number;
  currentWeight: number;
};

export type PlateauInsight = {
  exercise: string;
  sessionsStagnant: number;
  currentMaxWeight: number;
  estimated1RM: number;
  insightType: "plateau" | "breakthrough" | "deload_needed" | "progression_opportunity";
  message: string;
  actionableCue: string;
};

export type DashboardAnalytics = {
  workouts: WorkoutAnalytics[];
  exercises: ExerciseAnalytics[];
  muscleGroups: MuscleGroupSummary[];
  acwr: ACWRData;
  symmetry: SymmetryData;
  intensity: IntensityDistribution;
  multiLift: MultiLiftComparison;
  plateaus: PlateauInsight[];
  overall: {
    totalWorkouts: number;
    totalExercises: number;
    totalSets: number;
    totalVolume: number;
    weeklyAvgWorkouts: number;
    heaviestSet: { exercise: string; weight: number; reps: number; completedAt: string } | null;
    highestRepSet: { exercise: string; weight: number; reps: number; completedAt: string } | null;
    best1RM: { exercise: string; estimated1RM: number; weight: number; reps: number; completedAt: string } | null;
    mostTrainedExercise: { exercise: string; sessions: number } | null;
  };
};

export function getMuscleGroup(exerciseName: string): string {
  const name = exerciseName.toLowerCase().replace(/-/g, " ");
  if (name.includes("bench") || name.includes("push up") || name.includes("chest") || name.includes("fly") || name.includes("landmine press") || name.includes("dip")) return "Chest";
  if (name.includes("overhead press") || name.includes("dumbbell press") || name.includes("arnold press") || name.includes("lateral raise") || name.includes("front raise") || name.includes("delt") || name.includes("face pull") || name.includes("upright row") || name.includes("shoulder")) return "Shoulders";
  if (name.includes("pull up") || name.includes("chin up") || name.includes("pulldown") || name.includes("row") || name.includes("shrug") || name.includes("lat ") || name.includes("hyperextension") || name.includes("back extension")) return "Back";
  if (name.includes("squat") || name.includes("deadlift") || name.includes("lunge") || name.includes("leg ") || name.includes("nordic") || name.includes("hip ") || name.includes("glute") || name.includes("calf") || name.includes("good morning") || name.includes("rack pull") || name.includes("step up") || name.includes("sled")) return "Legs";
  if (name.includes("curl") || name.includes("triceps") || name.includes("skull crusher") || name.includes("biceps")) return "Arms";
  if (name.includes("plank") || name.includes("leg raise") || name.includes("crunch") || name.includes("twist") || name.includes("ab wheel") || name.includes("farmer carry") || name.includes("sit up")) return "Core";
  return "Other";
}

function calculate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function computeAnalytics(workouts: WorkoutSession[]): DashboardAnalytics {
  const exerciseBuckets = new Map<
    string,
    {
      sets: Array<{ weight: number; reps: number; workoutId: string; completedAt: string }>;
      sessions: Set<string>;
    }
  >();

  let totalOverallVolume = 0;

  const workoutsSummary = workouts.map((workout) => {
    const completedAt = workout.completedAt ?? workout.startedAt ?? workout.createdAt;
    let workoutVolume = 0;
    let workoutSetsCount = 0;

    const summary = {
      id: workout.id,
      completedAt,
      exerciseCount: workout.exercises.length,
      setCount: 0,
      peakWeight: 0,
      peakReps: 0,
      totalVolume: 0,
    };

    workout.exercises.forEach((exercise) => {
      const topWeight = exercise.sets.reduce((max, setEntry) => Math.max(max, setEntry.weight), 0);
      const topReps = exercise.sets.reduce((max, setEntry) => Math.max(max, setEntry.reps), 0);
      summary.peakWeight = Math.max(summary.peakWeight, topWeight);
      summary.peakReps = Math.max(summary.peakReps, topReps);

      if (!exerciseBuckets.has(exercise.name)) {
        exerciseBuckets.set(exercise.name, { sets: [], sessions: new Set<string>() });
      }

      const bucket = exerciseBuckets.get(exercise.name)!;
      bucket.sessions.add(workout.id);

      exercise.sets.forEach((setEntry) => {
        workoutSetsCount += 1;
        const setVolume = setEntry.weight * setEntry.reps;
        workoutVolume += setVolume;
        totalOverallVolume += setVolume;

        bucket.sets.push({
          weight: setEntry.weight,
          reps: setEntry.reps,
          workoutId: workout.id,
          completedAt,
        });
      });
    });

    summary.setCount = workoutSetsCount;
    summary.totalVolume = workoutVolume;
    return summary;
  });

  const exercises = Array.from(exerciseBuckets.entries())
    .map(([name, data]) => {
      const muscleGroup = getMuscleGroup(name);
      const sortedSets = [...data.sets].sort(
        (left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime()
      );

      const workoutGrouped = new Map<string, { completedAt: string; sets: Array<{ weight: number; reps: number }> }>();
      sortedSets.forEach((setEntry) => {
        if (!workoutGrouped.has(setEntry.workoutId)) {
          workoutGrouped.set(setEntry.workoutId, { completedAt: setEntry.completedAt, sets: [] });
        }
        workoutGrouped.get(setEntry.workoutId)!.sets.push({ weight: setEntry.weight, reps: setEntry.reps });
      });

      let exerciseTotalVolume = 0;
      let maxEstimated1RM = 0;

      const trend: ExerciseTrendPoint[] = Array.from(workoutGrouped.entries())
        .map(([workoutId, sessionData]) => {
          let topWeight = 0;
          let topReps = 0;
          let sessionVolume = 0;
          let sessionMax1RM = 0;

          sessionData.sets.forEach((s) => {
            const vol = s.weight * s.reps;
            sessionVolume += vol;
            exerciseTotalVolume += vol;

            const e1RM = calculate1RM(s.weight, s.reps);
            if (e1RM > sessionMax1RM) sessionMax1RM = e1RM;

            if (s.weight > topWeight || (s.weight === topWeight && s.reps > topReps)) {
              topWeight = s.weight;
              topReps = s.reps;
            }
          });

          if (sessionMax1RM > maxEstimated1RM) maxEstimated1RM = sessionMax1RM;

          return {
            completedAt: sessionData.completedAt,
            workoutId,
            topWeight,
            topReps,
            estimatedOneRepMax: sessionMax1RM,
            totalVolume: sessionVolume,
            setCount: sessionData.sets.length,
          };
        })
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

      const maxWeight = sortedSets.reduce((best, setEntry) => Math.max(best, setEntry.weight), 0);
      const maxReps = sortedSets.reduce((best, setEntry) => Math.max(best, setEntry.reps), 0);
      const avgTopWeight = trend.length
        ? Math.round((trend.reduce((sum, point) => sum + point.topWeight, 0) / trend.length) * 10) / 10
        : 0;

      let weightChangePercent = 0;
      if (trend.length >= 2) {
        const firstWeight = trend[0].topWeight;
        const lastWeight = trend[trend.length - 1].topWeight;
        if (firstWeight > 0) {
          weightChangePercent = Math.round(((lastWeight - firstWeight) / firstWeight) * 100);
        }
      }

      return {
        name,
        muscleGroup,
        maxWeight,
        maxReps,
        avgTopWeight,
        maxEstimated1RM,
        totalVolume: exerciseTotalVolume,
        sessions: data.sessions.size,
        totalSets: sortedSets.length,
        trend,
        weightChangePercent,
      };
    })
    .sort((a, b) => b.maxWeight - a.maxWeight || b.sessions - a.sessions || a.name.localeCompare(b.name));

  // Group exercises by Muscle Group
  const muscleGroupMap = new Map<string, ExerciseAnalytics[]>();
  exercises.forEach((ex) => {
    if (!muscleGroupMap.has(ex.muscleGroup)) {
      muscleGroupMap.set(ex.muscleGroup, []);
    }
    muscleGroupMap.get(ex.muscleGroup)!.push(ex);
  });

  const muscleGroups: MuscleGroupSummary[] = Array.from(muscleGroupMap.entries()).map(([name, exList]) => ({
    name,
    totalVolume: exList.reduce((sum, e) => sum + e.totalVolume, 0),
    totalSets: exList.reduce((sum, e) => sum + e.totalSets, 0),
    exerciseCount: exList.length,
    exercises: exList,
  }));

  let heaviestSet: DashboardAnalytics["overall"]["heaviestSet"] = null;
  let highestRepSet: DashboardAnalytics["overall"]["highestRepSet"] = null;
  let best1RM: DashboardAnalytics["overall"]["best1RM"] = null;

  exercises.forEach((ex) => {
    ex.trend.forEach((pt) => {
      if (
        !heaviestSet ||
        pt.topWeight > heaviestSet.weight ||
        (pt.topWeight === heaviestSet.weight && pt.topReps > heaviestSet.reps)
      ) {
        heaviestSet = { exercise: ex.name, weight: pt.topWeight, reps: pt.topReps, completedAt: pt.completedAt };
      }

      if (
        !highestRepSet ||
        pt.topReps > highestRepSet.reps ||
        (pt.topReps === highestRepSet.reps && pt.topWeight > highestRepSet.weight)
      ) {
        highestRepSet = { exercise: ex.name, weight: pt.topWeight, reps: pt.topReps, completedAt: pt.completedAt };
      }

      if (!best1RM || pt.estimatedOneRepMax > best1RM.estimated1RM) {
        best1RM = {
          exercise: ex.name,
          estimated1RM: pt.estimatedOneRepMax,
          weight: pt.topWeight,
          reps: pt.topReps,
          completedAt: pt.completedAt,
        };
      }
    });
  });

  let weeklyAvgWorkouts = 0;
  if (workoutsSummary.length > 0) {
    const dates = workoutsSummary.map((w) => new Date(w.completedAt).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const diffWeeks = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24 * 7)));
    weeklyAvgWorkouts = Math.round((workoutsSummary.length / diffWeeks) * 10) / 10;
  }

  // ==========================================
  // 1. ACWR (Acute:Chronic Workload Ratio)
  // ==========================================
  const nowAnchor = workoutsSummary.length > 0
    ? Math.max(...workoutsSummary.map((w) => new Date(w.completedAt).getTime()))
    : Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const twentyEightDaysMs = 28 * 24 * 60 * 60 * 1000;

  let acuteLoad = 0;
  let chronicRawLoad = 0;

  workoutsSummary.forEach((w) => {
    const wTime = new Date(w.completedAt).getTime();
    if (nowAnchor - wTime <= sevenDaysMs) {
      acuteLoad += w.totalVolume;
    }
    if (nowAnchor - wTime <= twentyEightDaysMs) {
      chronicRawLoad += w.totalVolume;
    }
  });

  const chronicLoad = Math.round((chronicRawLoad / 4) || (acuteLoad > 0 ? acuteLoad : 1));
  const rawRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 1.0;
  const ratio = Math.round(rawRatio * 100) / 100;

  let acwrZone: ACWRData["zone"] = "optimal";
  let acwrRecommendation = "Sweet Spot: Progressive overload is optimal with low injury risk.";

  if (ratio < 0.8) {
    acwrZone = "deload";
    acwrRecommendation = "Active Recovery / Deload: High readiness for targeted progressive overload accumulation.";
  } else if (ratio > 1.5) {
    acwrZone = "danger";
    acwrRecommendation = "Workload Spike Detected (>1.5): Fatigue exceeds recovery capacity. Recommended: 1-week volume deload (-40%).";
  } else if (ratio > 1.3) {
    acwrZone = "overreaching";
    acwrRecommendation = "Functional Overreaching (1.3–1.5): Monitor recovery, sleep, and joint soreness closely.";
  }

  const acwr: ACWRData = {
    acuteLoad,
    chronicLoad,
    ratio,
    zone: acwrZone,
    recommendation: acwrRecommendation,
  };

  // ==========================================
  // 2. Kinesiological Muscle Symmetry
  // ==========================================
  let pushVolume = 0;
  let pullVolume = 0;
  let quadVolume = 0;
  let hamstringVolume = 0;
  let coreVolume = 0;
  let armsVolume = 0;

  exercises.forEach((ex) => {
    const n = ex.name.toLowerCase();
    if (n.includes("bench") || n.includes("push up") || n.includes("chest") || n.includes("fly") || n.includes("dip") || n.includes("overhead press") || n.includes("shoulder") || n.includes("lateral raise")) {
      pushVolume += ex.totalVolume;
    }
    if (n.includes("row") || n.includes("pulldown") || n.includes("pull up") || n.includes("chin up") || n.includes("face pull") || n.includes("shrug") || n.includes("lat ")) {
      pullVolume += ex.totalVolume;
    }
    if (n.includes("squat") || n.includes("leg press") || n.includes("hack") || n.includes("lunge") || n.includes("leg extension") || n.includes("bulgarian") || n.includes("step up")) {
      quadVolume += ex.totalVolume;
    }
    if (n.includes("deadlift") || n.includes("rdl") || n.includes("romanian") || n.includes("leg curl") || n.includes("hip thrust") || n.includes("glute") || n.includes("good morning")) {
      hamstringVolume += ex.totalVolume;
    }
    if (n.includes("plank") || n.includes("crunch") || n.includes("leg raise") || n.includes("ab") || n.includes("core") || n.includes("ql")) {
      coreVolume += ex.totalVolume;
    }
    if (n.includes("curl") || n.includes("tricep") || n.includes("skull crusher")) {
      armsVolume += ex.totalVolume;
    }
  });

  const pushToPullRatio = pullVolume > 0 ? Math.round((pushVolume / pullVolume) * 100) / 100 : 1.0;
  const quadToHamRatio = hamstringVolume > 0 ? Math.round((quadVolume / hamstringVolume) * 100) / 100 : 1.0;
  const anteriorVolume = pushVolume + quadVolume;
  const posteriorVolume = pullVolume + hamstringVolume;

  const maxCategoryVol = Math.max(pushVolume, pullVolume, quadVolume, hamstringVolume, coreVolume, 1);
  const radarPoints = [
    { label: "Push (Chest/Delts)", value: pushVolume, normalizedPercent: Math.round((pushVolume / maxCategoryVol) * 100) },
    { label: "Pull (Lats/Upper Back)", value: pullVolume, normalizedPercent: Math.round((pullVolume / maxCategoryVol) * 100) },
    { label: "Knee Extensors (Quads)", value: quadVolume, normalizedPercent: Math.round((quadVolume / maxCategoryVol) * 100) },
    { label: "Posterior Chain (Glute/Ham)", value: hamstringVolume, normalizedPercent: Math.round((hamstringVolume / maxCategoryVol) * 100) },
    { label: "Core & Stability", value: coreVolume, normalizedPercent: Math.round((coreVolume / maxCategoryVol) * 100) },
  ];

  const symmetry: SymmetryData = {
    pushVolume,
    pullVolume,
    pushToPullRatio,
    quadVolume,
    hamstringVolume,
    quadToHamRatio,
    anteriorVolume,
    posteriorVolume,
    coreVolume,
    armsVolume,
    radarPoints,
  };

  // ==========================================
  // 3. Intensity Distribution (<70%, 70-84%, 85%+)
  // ==========================================
  let zone1Count = 0;
  let zone1Volume = 0;
  let zone2Count = 0;
  let zone2Volume = 0;
  let zone3Count = 0;
  let zone3Volume = 0;
  let totalTrackedSets = 0;

  exercises.forEach((ex) => {
    const e1RM = ex.maxEstimated1RM || (ex.maxWeight ? ex.maxWeight * 1.15 : 100);
    ex.trend.forEach((pt) => {
      // Estimate intensity from session top weight
      const intensity = e1RM > 0 ? (pt.topWeight / e1RM) * 100 : 75;
      const setVol = pt.topWeight * pt.topReps;
      totalTrackedSets += pt.setCount;

      if (intensity < 70) {
        zone1Count += pt.setCount;
        zone1Volume += setVol;
      } else if (intensity <= 84) {
        zone2Count += pt.setCount;
        zone2Volume += setVol;
      } else {
        zone3Count += pt.setCount;
        zone3Volume += setVol;
      }
    });
  });

  const totalZoneSets = Math.max(zone1Count + zone2Count + zone3Count, 1);
  const intensity: IntensityDistribution = {
    zone1Count,
    zone1Volume,
    zone1Percent: Math.round((zone1Count / totalZoneSets) * 100),
    zone2Count,
    zone2Volume,
    zone2Percent: Math.round((zone2Count / totalZoneSets) * 100),
    zone3Count,
    zone3Volume,
    zone3Percent: Math.round((zone3Count / totalZoneSets) * 100),
    totalTrackedSets,
  };

  // ==========================================
  // 4. Multi-Lift Comparative Progression
  // ==========================================
  const candidateLifts = exercises
    .filter((e) => e.trend.length >= 2)
    .slice(0, 4)
    .map((e) => e.name);

  const dateMap = new Map<string, MultiLiftTrendPoint>();

  candidateLifts.forEach((liftName) => {
    const ex = exercises.find((e) => e.name === liftName);
    if (!ex || ex.trend.length === 0) return;
    const baselineWeight = ex.trend[0].topWeight || 1;

    ex.trend.forEach((pt) => {
      const d = new Date(pt.completedAt).toISOString().split("T")[0];
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d });
      }
      const growthPct = Math.round(((pt.topWeight - baselineWeight) / baselineWeight) * 100);
      dateMap.get(d)![liftName] = growthPct;
    });
  });

  const multiLiftTimeline = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const multiLift: MultiLiftComparison = {
    availableLifts: candidateLifts,
    timeline: multiLiftTimeline,
  };

  // ==========================================
  // 5. AI Periodization & Plateau Breaker Engine
  // ==========================================
  const plateaus: PlateauInsight[] = [];

  exercises.forEach((ex) => {
    if (ex.trend.length >= 3) {
      const last3 = ex.trend.slice(-3);
      const isWeightSame = last3.every((t) => t.topWeight === last3[0].topWeight);
      const isRepsStagnant = last3[2].topReps <= last3[0].topReps;

      if (isWeightSame && isRepsStagnant) {
        plateaus.push({
          exercise: ex.name,
          sessionsStagnant: 3,
          currentMaxWeight: ex.maxWeight,
          estimated1RM: ex.maxEstimated1RM,
          insightType: "plateau",
          message: `${ex.name} has stalled at ${ex.maxWeight} lbs across the last 3 sessions.`,
          actionableCue: `Recommendation: Drop working weight by 10% for 1 session (Dynamic Effort), then progress in 2.5–5 lb micro-increments or wave down to 5x3.`,
        });
      }
    }

    if (ex.weightChangePercent >= 15 && ex.trend.length >= 2) {
      plateaus.push({
        exercise: ex.name,
        sessionsStagnant: 0,
        currentMaxWeight: ex.maxWeight,
        estimated1RM: ex.maxEstimated1RM,
        insightType: "breakthrough",
        message: `${ex.name} shows strong progressive overload (+${ex.weightChangePercent}% strength gain).`,
        actionableCue: `Maintain current linear progression cadence. Re-test 1RM milestone in 2 weeks.`,
      });
    }
  });

  return {
    workouts: workoutsSummary.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    exercises,
    muscleGroups,
    acwr,
    symmetry,
    intensity,
    multiLift,
    plateaus,
    overall: {
      totalWorkouts: workouts.length,
      totalExercises: exercises.length,
      totalSets: workoutsSummary.reduce((sum, workout) => sum + workout.setCount, 0),
      totalVolume: totalOverallVolume,
      weeklyAvgWorkouts,
      heaviestSet,
      highestRepSet,
      best1RM,
      mostTrainedExercise: exercises[0] ? { exercise: exercises[0].name, sessions: exercises[0].sessions } : null,
    },
  };
}

export function getWorkoutExerciseMilestones(
  workouts: WorkoutSession[]
): Map<string, Map<string, ExerciseMilestoneBadge>> {
  const milestoneMap = new Map<string, Map<string, ExerciseMilestoneBadge>>();

  // Sort workouts chronologically from earliest to latest
  const chronological = [...workouts].sort((a, b) => {
    const tA = new Date(a.completedAt || a.startedAt || a.createdAt).getTime();
    const tB = new Date(b.completedAt || b.startedAt || b.createdAt).getTime();
    return tA - tB;
  });

  const allTimeMaxWeight = new Map<string, number>();
  const allTimeMax1RM = new Map<string, number>();

  chronological.forEach((workout) => {
    const exerciseMilestones = new Map<string, ExerciseMilestoneBadge>();

    workout.exercises.forEach((exercise) => {
      if (!exercise.sets || exercise.sets.length === 0) return;

      const normName = exercise.name.trim();
      let topWeight = 0;
      let topReps = 0;
      let top1RM = 0;

      exercise.sets.forEach((setEntry) => {
        if (setEntry.weight > topWeight || (setEntry.weight === topWeight && setEntry.reps > topReps)) {
          topWeight = setEntry.weight;
          topReps = setEntry.reps;
        }
        const e1RM = calculate1RM(setEntry.weight, setEntry.reps);
        if (e1RM > top1RM) top1RM = e1RM;
      });

      const prevMaxWeight = allTimeMaxWeight.get(normName);
      const prevMax1RM = allTimeMax1RM.get(normName);

      if (prevMaxWeight !== undefined && prevMaxWeight > 0) {
        if (topWeight > prevMaxWeight) {
          const diff = topWeight - prevMaxWeight;
          const pct = Math.round((diff / prevMaxWeight) * 100);
          exerciseMilestones.set(normName, {
            type: "weight_pr",
            badgeText: `🏆 NEW PR (+${pct}%)`,
            celebrationText: `You hit a new PR! This is ${pct}% (+${diff} lbs) more weight than your previous best (${prevMaxWeight} lbs).`,
            diffWeight: diff,
            percentGain: pct,
            previousWeight: prevMaxWeight,
            currentWeight: topWeight,
          });
        } else if (prevMax1RM !== undefined && top1RM > prevMax1RM && top1RM - prevMax1RM >= 5) {
          const diff = top1RM - prevMax1RM;
          const pct = Math.round((diff / prevMax1RM) * 100);
          exerciseMilestones.set(normName, {
            type: "1rm_pr",
            badgeText: `⚡ 1RM RECORD (+${pct}%)`,
            celebrationText: `You hit a new 1RM record! Est. 1-Rep Max increased to ${top1RM} lbs (+${pct}% / +${diff} lbs).`,
            diffWeight: diff,
            percentGain: pct,
            previousWeight: prevMax1RM,
            currentWeight: top1RM,
          });
        }
      }

      // Update all-time peaks
      allTimeMaxWeight.set(normName, Math.max(prevMaxWeight || 0, topWeight));
      allTimeMax1RM.set(normName, Math.max(prevMax1RM || 0, top1RM));
    });

    milestoneMap.set(workout.id, exerciseMilestones);
  });

  return milestoneMap;
}