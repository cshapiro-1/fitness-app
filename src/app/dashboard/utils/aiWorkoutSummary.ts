import { DraftWorkout, DraftExercise, DraftSet } from "../types";
import { getMuscleGroup } from "./analytics";

export interface WorkoutSummaryResult {
  summary: string;
  totalVolumeLbs: number;
  totalSets: number;
  totalReps: number;
  targetedMuscleGroups: string[];
  topLift: {
    exerciseName: string;
    weight: number;
    reps: number;
    est1RM: number;
  } | null;
}

/**
 * Generates an intelligent, structured AI summary of a workout session
 * based on completed exercises, volume, reps, and top sets.
 */
export function generateWorkoutSummary(workout: DraftWorkout | null | undefined): WorkoutSummaryResult {
  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    return {
      summary: "Completed workout session with solid intensity and focus.",
      totalVolumeLbs: 0,
      totalSets: 0,
      totalReps: 0,
      targetedMuscleGroups: [],
      topLift: null,
    };
  }

  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;
  const muscleGroupCounts: Record<string, number> = {};

  let topLift: {
    exerciseName: string;
    weight: number;
    reps: number;
    est1RM: number;
  } | null = null;

  workout.exercises.forEach((ex: DraftExercise) => {
    const mg = getMuscleGroup(ex.name);
    muscleGroupCounts[mg] = (muscleGroupCounts[mg] || 0) + 1;

    ex.sets.forEach((set: DraftSet) => {
      const weight = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps, 10) || 0;

      if (reps > 0) {
        totalSets += 1;
        totalReps += reps;
        totalVolume += weight * reps;

        const est1RM = reps > 1 ? Math.round(weight * (36 / (37 - Math.min(reps, 36)))) : weight;

        if (!topLift || est1RM > topLift.est1RM) {
          topLift = {
            exerciseName: ex.name,
            weight,
            reps,
            est1RM,
          };
        }
      }
    });
  });

  const muscleGroups = Object.keys(muscleGroupCounts).filter((mg) => mg !== "Other");
  const focusLabel = muscleGroups.length > 0 ? muscleGroups.join(" & ") : "Full Body";

  // Build high-impact professional summary paragraph
  let summaryText = "";
  if (totalSets === 0) {
    summaryText = `Session targeted ${focusLabel}. Good execution and mobility focus.`;
  } else if (topLift && topLift.weight > 0) {
    summaryText = `High intensity ${focusLabel} session. Completed ${totalSets} working sets (${totalReps} total reps) with ${totalVolume.toLocaleString()} lbs total volume. Top set: ${topLift.exerciseName} at ${topLift.weight} lbs × ${topLift.reps} reps (Est. 1RM: ${topLift.est1RM} lbs). Maintained solid barbell tempo and progressive overload.`;
  } else {
    summaryText = `High density ${focusLabel} workout. Completed ${totalSets} working sets (${totalReps} total reps) with consistent time under tension and disciplined rest intervals.`;
  }

  return {
    summary: summaryText,
    totalVolumeLbs: totalVolume,
    totalSets,
    totalReps,
    targetedMuscleGroups: muscleGroups,
    topLift,
  };
}
