import { DashboardAnalytics, ExerciseAnalytics } from "./analytics";

export interface AIProgressiveHighlight {
  title: string;
  description: string;
  gain: string;
}

export interface AISymmetryAnalysis {
  pushPullRatio: string;
  upperLowerRatio: string;
  status: "OPTIMAL" | "SLIGHT_IMBALANCE" | "SIGNIFICANT_IMBALANCE";
  assessment: string;
  recommendation: string;
}

export interface AIAnalyticsInsightsResult {
  executiveSummary: string;
  trainingScore: number; // 0 - 100
  frequencyRating: string;
  progressiveOverloadHighlights: AIProgressiveHighlight[];
  symmetryAnalysis: AISymmetryAnalysis;
  periodizationRecommendations: string[];
  recoveryAndNutritionAdvice: string;
}

/**
 * Intelligent AI performance analytics engine.
 * Computes progressive overload velocity, volume distributions, kinetic symmetry,
 * and next-block periodization guidance based on historical workout logs.
 */
export function generateAnalyticsInsights(analytics: DashboardAnalytics | null | undefined): AIAnalyticsInsightsResult {
  if (!analytics || !analytics.exercises || analytics.exercises.length === 0) {
    return {
      executiveSummary: "No historical workout logs detected. Begin logging your training sessions to unlock deep AI kinetic intelligence, 1RM trajectory modeling, and muscular symmetry analytics.",
      trainingScore: 50,
      frequencyRating: "Foundational",
      progressiveOverloadHighlights: [
        {
          title: "Initial Calibration Required",
          description: "Complete and log at least 3 structured workouts to calibrate your baseline 1RM estimations and volume curves.",
          gain: "0%",
        },
      ],
      symmetryAnalysis: {
        pushPullRatio: "1.00",
        upperLowerRatio: "1.00",
        status: "OPTIMAL",
        assessment: "Baseline ratio awaiting first logged training block.",
        recommendation: "Program balanced push, pull, and leg sessions throughout the upcoming week.",
      },
      periodizationRecommendations: [
        "Focus on establishing baseline working weights on compound movements (Squat, Bench, Row, Deadlift).",
        "Maintain 3-4 sets per exercise with 8-12 repetitions to optimize neuromuscular adaptation.",
      ],
      recoveryAndNutritionAdvice: "Target 0.8-1.0g protein per pound of bodyweight and aim for 7-8 hours of quality sleep.",
    };
  }

  const { overall, exercises, muscleGroups } = analytics;

  // 1. Calculate Progressive Overload Highlights
  const improvingExercises = [...exercises]
    .filter((e) => e.trend && e.trend.length >= 2)
    .sort((a, b) => b.weightChangePercent - a.weightChangePercent);

  const topGains: AIProgressiveHighlight[] = [];

  if (improvingExercises.length > 0) {
    improvingExercises.slice(0, 3).forEach((ex) => {
      if (ex.weightChangePercent > 0) {
        topGains.push({
          title: `${ex.name} Progressive Gain`,
          description: `Increased working top set from ${ex.trend[0].topWeight} lbs to ${ex.maxWeight} lbs (Est. 1RM: ${ex.maxEstimated1RM} lbs).`,
          gain: `+${ex.weightChangePercent}%`,
        });
      }
    });
  }

  if (topGains.length === 0) {
    // Pick the highest volume exercises if no multi-session gains yet
    const topVolume = [...exercises].sort((a, b) => b.totalVolume - a.totalVolume)[0];
    if (topVolume) {
      topGains.push({
        title: `${topVolume.name} Primary Driver`,
        description: `Logged highest total volume of ${topVolume.totalVolume.toLocaleString()} lbs across ${topVolume.totalSets} sets.`,
        gain: `${topVolume.maxWeight} lbs Top Set`,
      });
    }
  }

  // 2. Muscular Symmetry & Push/Pull Ratio
  const pushMuscles = ["Chest", "Shoulders"];
  const pullMuscles = ["Back", "Arms"];
  const lowerMuscles = ["Legs"];

  let pushVol = 0;
  let pullVol = 0;
  let upperVol = 0;
  let lowerVol = 0;

  exercises.forEach((ex) => {
    if (pushMuscles.includes(ex.muscleGroup)) pushVol += ex.totalVolume;
    if (pullMuscles.includes(ex.muscleGroup)) pullVol += ex.totalVolume;
    if (lowerMuscles.includes(ex.muscleGroup)) lowerVol += ex.totalVolume;
    else upperVol += ex.totalVolume;
  });

  const pushPullRatioVal = pullVol > 0 ? pushVol / pullVol : 1.0;
  const pushPullRatioStr = pushPullRatioVal.toFixed(2);
  const upperLowerRatioVal = lowerVol > 0 ? upperVol / lowerVol : 1.0;
  const upperLowerRatioStr = upperLowerRatioVal.toFixed(2);

  let symmetryStatus: "OPTIMAL" | "SLIGHT_IMBALANCE" | "SIGNIFICANT_IMBALANCE" = "OPTIMAL";
  let symmetryAssessment = "";
  let symmetryRec = "";

  if (pushPullRatioVal > 1.35) {
    symmetryStatus = "SLIGHT_IMBALANCE";
    symmetryAssessment = `Push volume (${pushVol.toLocaleString()} lbs) significantly exceeds pull volume (${pullVol.toLocaleString()} lbs), skewing anterior deltoid and pectoral load.`;
    symmetryRec = "Incorporate 2-3 additional horizontal and vertical pulling movements (Barbell Rows, Face Pulls, Lat Pulldowns) to protect shoulder joint integrity.";
  } else if (pushPullRatioVal < 0.7) {
    symmetryStatus = "SLIGHT_IMBALANCE";
    symmetryAssessment = `Pulling volume (${pullVol.toLocaleString()} lbs) dominates push volume (${pushVol.toLocaleString()} lbs).`;
    symmetryRec = "Add supplementary pressing volume (Incline Dumbbell Press, Overhead Press, Dips) to balance upper torso development.";
  } else {
    symmetryStatus = "OPTIMAL";
    symmetryAssessment = `Optimal push/pull equilibrium at ${pushPullRatioStr}:1.0. Upper body structural balance is well maintained.`;
    symmetryRec = "Maintain current agonist/antagonist volume ratio throughout the next mesocycle.";
  }

  // 3. Training Consistency & Score
  let score = 70;
  if (overall.totalWorkouts >= 10) score += 15;
  else if (overall.totalWorkouts >= 5) score += 10;
  else if (overall.totalWorkouts >= 2) score += 5;

  if (symmetryStatus === "OPTIMAL") score += 10;
  else if (symmetryStatus === "SLIGHT_IMBALANCE") score += 5;

  if (improvingExercises.some((e) => e.weightChangePercent > 5)) score += 5;

  score = Math.min(98, Math.max(50, score));

  const frequencyRating = overall.totalWorkouts >= 12
    ? "Elite Progressive Consistency"
    : overall.totalWorkouts >= 6
    ? "Solid Training Velocity"
    : "Building Consistency";

  // 4. Executive Summary
  const topMuscle = [...muscleGroups].sort((a, b) => b.totalVolume - a.totalVolume)[0]?.name || "Full Body";
  const execSummary = `Logged ${overall.totalWorkouts} sessions (${overall.totalSets} total sets, ${overall.totalVolume.toLocaleString()} lbs lifted) across ${exercises.length} unique exercises. Primary volume driver is ${topMuscle}. Overall progressive overload trajectory is ${improvingExercises.length > 0 ? "positive with active strength gains" : "steady"}.`;

  // 5. Periodization Recommendations
  const periodization: string[] = [];

  if (overall.totalWorkouts > 8) {
    periodization.push("Consider a planned 1-week deload (reduce working volume by 40% while maintaining load) to dissipate accumulated systemic fatigue.");
  } else {
    periodization.push("Continue progressive overload: Aim for a 2.5-5 lb increase on primary compound lifts once all target rep ranges are completed with 1-2 reps in reserve (RIR).");
  }

  if (lowerVol < upperVol * 0.4 && exercises.length >= 4) {
    periodization.push("Lower body volume represents a minor portion of total tonnage. Introduce dedicated quad/hamstring compound days (Squats, Romanian Deadlifts).");
  } else {
    periodization.push("Maintain current split distribution; focus on 2-3 second eccentric control on compound lifts to maximize mechanical tension.");
  }

  periodization.push("Track RPE (Rate of Perceived Exertion) on top sets to automatically adjust load on days with varying neurological readiness.");

  // 6. Recovery & Nutrition
  const weeklyVolEstimate = Math.round(overall.totalVolume / Math.max(1, overall.totalWorkouts / 3.5));
  const recoveryAdvice = `Estimated weekly volume load: ~${weeklyVolEstimate.toLocaleString()} lbs. Consume 1.0-1.2g protein per pound of lean bodyweight, hydrate with at least 90-120 oz electrolyte-balanced water on heavy lift days, and prioritize 7.5-9.0 hours of sleep.`;

  return {
    executiveSummary: execSummary,
    trainingScore: score,
    frequencyRating,
    progressiveOverloadHighlights: topGains,
    symmetryAnalysis: {
      pushPullRatio: pushPullRatioStr,
      upperLowerRatio: upperLowerRatioStr,
      status: symmetryStatus,
      assessment: symmetryAssessment,
      recommendation: symmetryRec,
    },
    periodizationRecommendations: periodization,
    recoveryAndNutritionAdvice: recoveryAdvice,
  };
}
