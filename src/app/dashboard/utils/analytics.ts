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

export type DashboardAnalytics = {
  workouts: WorkoutAnalytics[];
  exercises: ExerciseAnalytics[];
  muscleGroups: MuscleGroupSummary[];
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
  const name = exerciseName.toLowerCase();
  if (name.includes("bench") || name.includes("push up") || name.includes("chest") || name.includes("fly") || name.includes("landmine press")) return "Chest";
  if (name.includes("overhead press") || name.includes("dumbbell press") || name.includes("arnold press") || name.includes("lateral raise") || name.includes("front raise") || name.includes("delt") || name.includes("face pull") || name.includes("upright row") || name.includes("shoulder")) return "Shoulders";
  if (name.includes("pull up") || name.includes("chin up") || name.includes("pulldown") || name.includes("row") || name.includes("shrug") || name.includes("lat ")) return "Back";
  if (name.includes("squat") || name.includes("deadlift") || name.includes("lunge") || name.includes("leg ") || name.includes("nordic") || name.includes("hip ") || name.includes("glute") || name.includes("calf") || name.includes("good morning") || name.includes("rack pull") || name.includes("step up") || name.includes("sled")) return "Legs";
  if (name.includes("curl") || name.includes("triceps") || name.includes("skull crusher")) return "Arms";
  if (name.includes("plank") || name.includes("leg raise") || name.includes("crunch") || name.includes("twist") || name.includes("ab wheel") || name.includes("farmer carry")) return "Core";
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

  return {
    workouts: workoutsSummary.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    exercises,
    muscleGroups,
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