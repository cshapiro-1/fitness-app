import { computeAnalytics, ExerciseAnalytics } from "@/app/dashboard/utils/analytics";

export interface AIChatContext {
  requesterRole: "TRAINER" | "CLIENT" | "ADMIN";
  requesterName: string;
  targetName?: string;
  workouts: any[];
}

export interface AIChatResponse {
  answer: string;
  referencedExercises: string[];
  metricsFound?: {
    totalWorkoutsAnalyzed: number;
    topLift?: string;
    totalVolume?: string;
  };
}

/**
 * Intelligent AI Chat & Query Engine.
 * Answers natural language inquiries regarding specific athlete logs, exercise progression,
 * 1RM trajectories, muscular balance, substitutions, and general exercise science.
 */
export function answerFitnessQuery(query: string, context: AIChatContext): AIChatResponse {
  const normalizedQuery = query.toLowerCase().trim();
  const { workouts, targetName, requesterRole } = context;

  const targetLabel = targetName || (requesterRole === "TRAINER" ? "your athlete" : "you");

  // Compute structured analytics on provided workouts
  const analytics = computeAnalytics(workouts);
  const totalWorkouts = analytics.overall.totalWorkouts;

  const referencedExercises: string[] = [];

  // Find any specific exercises mentioned in the prompt
  const matchedExercises: ExerciseAnalytics[] = [];
  analytics.exercises.forEach((ex) => {
    const exNameLower = ex.name.toLowerCase();
    const mgLower = ex.muscleGroup.toLowerCase();
    const words = exNameLower.split(" ").filter((w) => w.length >= 4);
    const matchesWord = words.some((w) => normalizedQuery.includes(w));

    if (normalizedQuery.includes(exNameLower) || normalizedQuery.includes(mgLower) || matchesWord) {
      if (!matchedExercises.some((m) => m.name === ex.name)) {
        matchedExercises.push(ex);
        referencedExercises.push(ex.name);
      }
    }
  });

  // 1. Specific Exercise Progress / PR Query
  if (matchedExercises.length > 0 && (normalizedQuery.includes("progress") || normalizedQuery.includes("pr") || normalizedQuery.includes("weight") || normalizedQuery.includes("1rm") || normalizedQuery.includes("trend") || normalizedQuery.includes("how is") || normalizedQuery.includes("how has"))) {
    const ex = matchedExercises[0];
    const trendPoints = ex.trend || [];

    let details = "";
    if (trendPoints.length >= 2) {
      const first = trendPoints[0];
      const last = trendPoints[trendPoints.length - 1];
      const changeSign = ex.weightChangePercent >= 0 ? "+" : "";
      details = `${targetLabel}'s **${ex.name}** has progressed from **${first.topWeight} lbs** to **${last.topWeight} lbs** (${changeSign}${ex.weightChangePercent}%) across ${ex.sessions} logged sessions. Current estimated 1-Rep Max is **${ex.maxEstimated1RM} lbs** with a lifetime logged volume of **${ex.totalVolume.toLocaleString()} lbs** across ${ex.totalSets} sets.`;
    } else {
      details = `${targetLabel} has logged **${ex.name}** with a peak top set of **${ex.maxWeight} lbs** (Estimated 1RM: **${ex.maxEstimated1RM} lbs**) across ${ex.totalSets} total sets.`;
    }

    return {
      answer: `📊 **${ex.name} Performance Analysis:**\n\n${details}\n\n💡 **Recommendation:** Once all working sets are achieved at the top of the prescribed rep range with 1-2 reps in reserve, increase working load by 2.5–5 lbs to sustain progressive overload.`,
      referencedExercises,
      metricsFound: {
        totalWorkoutsAnalyzed: totalWorkouts,
        topLift: `${ex.maxWeight} lbs ${ex.name}`,
        totalVolume: `${ex.totalVolume.toLocaleString()} lbs`,
      },
    };
  }

  // 2. Muscular Symmetry & Imbalance / Push-Pull Query
  if (normalizedQuery.includes("imbalance") || normalizedQuery.includes("symmetry") || normalizedQuery.includes("push") || normalizedQuery.includes("pull") || normalizedQuery.includes("ratio") || normalizedQuery.includes("balance")) {
    const pushMuscles = ["Chest", "Shoulders"];
    const pullMuscles = ["Back", "Arms"];
    const lowerMuscles = ["Legs"];

    let pushVol = 0;
    let pullVol = 0;
    let lowerVol = 0;

    analytics.exercises.forEach((ex) => {
      if (pushMuscles.includes(ex.muscleGroup)) pushVol += ex.totalVolume;
      if (pullMuscles.includes(ex.muscleGroup)) pullVol += ex.totalVolume;
      if (lowerMuscles.includes(ex.muscleGroup)) lowerVol += ex.totalVolume;
    });

    const ratio = pullVol > 0 ? (pushVol / pullVol).toFixed(2) : "1.00";
    let assessment = "";

    if (parseFloat(ratio) > 1.35) {
      assessment = `⚠️ **Anterior Dominance Detected:** Pushing volume (${pushVol.toLocaleString()} lbs) significantly outpaces pulling volume (${pullVol.toLocaleString()} lbs) at a **${ratio}:1.0** ratio. Add 2–3 horizontal/vertical pulling exercises (Barbell Rows, Face Pulls, Lat Pulldowns) to protect shoulder stability.`;
    } else if (parseFloat(ratio) < 0.75) {
      assessment = `⚠️ **Posterior Dominance:** Pulling volume (${pullVol.toLocaleString()} lbs) dominates pushing volume (${pushVol.toLocaleString()} lbs) at a **${ratio}:1.0** ratio. Introduce supplementary pressing volume (Incline Dumbbell Press, Overhead Press) for upper chest and shoulder balance.`;
    } else {
      assessment = `✅ **Structural Equilibrium:** Push/Pull volume is balanced at **${ratio}:1.0** (${pushVol.toLocaleString()} lbs push vs. ${pullVol.toLocaleString()} lbs pull). Upper body kinematic symmetry is well maintained.`;
    }

    return {
      answer: `⚖️ **Muscular Symmetry & Biomechanical Analysis for ${targetLabel}:**\n\n${assessment}\n\n• **Push Volume:** ${pushVol.toLocaleString()} lbs\n• **Pull Volume:** ${pullVol.toLocaleString()} lbs\n• **Lower Body Volume:** ${lowerVol.toLocaleString()} lbs`,
      referencedExercises: ["Push/Pull Balance"],
      metricsFound: {
        totalWorkoutsAnalyzed: totalWorkouts,
        totalVolume: `${analytics.overall.totalVolume.toLocaleString()} lbs`,
      },
    };
  }

  // 3. Exercise Substitution / Regression / Pain / Soreness Query
  if (normalizedQuery.includes("swap") || normalizedQuery.includes("substitute") || normalizedQuery.includes("alternative") || normalizedQuery.includes("replace") || normalizedQuery.includes("hurt") || normalizedQuery.includes("sore") || normalizedQuery.includes("pain") || normalizedQuery.includes("tight")) {
    let subAnswer = "";
    if (normalizedQuery.includes("squat") || normalizedQuery.includes("knee")) {
      subAnswer = "• **Leg Press (Controlled Eccentric):** Reduces lumbar and knee shear while maintaining quad tension.\n• **Box Squats:** Eliminates dynamic stretch reflex at the bottom of the movement.\n• **Goblet Squats or Bulgarian Split Squats (Dumbbell):** Allows upright torso angle to unload lower back and patellar tendon.";
      referencedExercises.push("Squat Alternatives");
    } else if (normalizedQuery.includes("bench") || normalizedQuery.includes("shoulder")) {
      subAnswer = "• **Neutral-Grip Dumbbell Press:** Keeps humeral head centered in glenoid fossa, drastically reducing shoulder impingement.\n• **Floor Press:** Limits shoulder hyperextension at the bottom of the movement.\n• **Incline Dumbbell Press (30° Angle):** Shifts load to clavicular head with minimal AC joint stress.";
      referencedExercises.push("Bench Press Alternatives");
    } else if (normalizedQuery.includes("deadlift") || normalizedQuery.includes("back")) {
      subAnswer = "• **Trap Bar / Hex Bar Deadlift:** Centers load directly with center of gravity, significantly reducing lumbar moment arm.\n• **Romanian Deadlifts (Dumbbells):** Emphasizes hamstring hip-hinge with controlled stretch.\n• **Chest-Supported Rows + Hip Thrusts:** Deconstructs posterior chain load without spinal compression.";
      referencedExercises.push("Deadlift Alternatives");
    } else {
      subAnswer = "• Identify the primary movement pattern (Push, Pull, Hinge, Squat, Carry).\n• Choose a variation with a fixed path of motion (Cables/Machines) or neutral grip dumbbells.\n• Adjust rep range to 10–15 with 2–3 second eccentric tempo to stimulate hypertrophy with lower joint loading.";
    }

    return {
      answer: `🛡️ **Safe Exercise Regressions & Substitutions:**\n\n${subAnswer}\n\n💡 *Note for Coaches:* When an athlete uses a substitution, log the modification on the session to track joint adaptation over time.`,
      referencedExercises,
      metricsFound: {
        totalWorkoutsAnalyzed: totalWorkouts,
      },
    };
  }

  // 4. General Log & History Summary Query
  if (normalizedQuery.includes("summary") || normalizedQuery.includes("history") || normalizedQuery.includes("what did") || normalizedQuery.includes("recent") || normalizedQuery.includes("workouts") || normalizedQuery.includes("overview")) {
    if (totalWorkouts === 0) {
      return {
        answer: `ℹ️ No logged workouts were found for ${targetLabel}. Once training sessions are recorded, AI will provide comprehensive volume modeling, 1RM surges, and fatigue curves.`,
        referencedExercises: [],
      };
    }

    const topExercises = [...analytics.exercises].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 3);
    const topSummary = topExercises.map((e) => `• **${e.name}:** ${e.maxWeight} lbs max (${e.totalSets} sets, ${e.totalVolume.toLocaleString()} lbs total volume)`).join("\n");

    return {
      answer: `📋 **Training Summary for ${targetLabel}:**\n\n• **Total Sessions Logged:** ${totalWorkouts}\n• **Total Sets Completed:** ${analytics.overall.totalSets}\n• **Total Lifetime Tonnage:** ${analytics.overall.totalVolume.toLocaleString()} lbs\n• **Primary Muscle Driver:** ${analytics.muscleGroups[0]?.name || "Full Body"}\n\n**Top Volume Movements:**\n${topSummary}\n\nOverall progressive overload velocity is active and consistent.`,
      referencedExercises: topExercises.map((e) => e.name),
      metricsFound: {
        totalWorkoutsAnalyzed: totalWorkouts,
        totalVolume: `${analytics.overall.totalVolume.toLocaleString()} lbs`,
      },
    };
  }

  // 5. Default General Coaching & Programming Guidance
  return {
    answer: `🤖 **STRKYR Performance Co-Pilot:**\n\nRegarding *"${query}"*:\n\nBased on ${targetLabel}'s historical volume (${totalWorkouts} sessions, ${analytics.overall.totalVolume.toLocaleString()} lbs lifted):\n\n1. **Progressive Overload Target:** Prioritize adding 1 rep per set or +2.5–5 lbs on primary compound lifts once working rep ranges are completed cleanly.\n2. **Fatigue Management:** Ensure 48 hours of recovery between high-intensity sessions targeting the same muscle group.\n3. **Nutrition & Hydration:** Maintain 0.8–1.0g protein per lb of bodyweight and hydrate with electrolyte balance.\n\nAsk me about specific lifts (e.g. *'How is Sarah's squat progressing?'*), muscular balance, or exercise substitutions!`,
    referencedExercises: analytics.exercises.slice(0, 3).map((e) => e.name),
    metricsFound: {
      totalWorkoutsAnalyzed: totalWorkouts,
      totalVolume: `${analytics.overall.totalVolume.toLocaleString()} lbs`,
    },
  };
}
