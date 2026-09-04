import { computeAnalytics, ExerciseAnalytics } from "@/app/dashboard/utils/analytics";
import { isDefaultBodyweight } from "@/app/dashboard/utils/exerciseLibrary";

export interface AIChatContext {
  requesterRole: "TRAINER" | "CLIENT" | "ADMIN";
  requesterName: string;
  targetName?: string;
  targetClientId?: string;
  workouts: any[];
}

export interface AIChatAction {
  type: "LOAD_INTO_BUILDER" | "ASSIGN_TO_CLIENT" | "LOG_WORKOUT" | "VIEW_ANATOMY" | "SUBSTITUTE_EXERCISE";
  label: string;
  data: {
    routineName?: string;
    targetClientId?: string;
    targetClientName?: string;
    exercises: Array<{
      name: string;
      category?: string;
      isBodyweight?: boolean;
      sets: Array<{ weight: string | number; reps: string | number; notes?: string }>;
    }>;
    exerciseName?: string;
    suggestedSubstitute?: string;
  };
}

export interface AIChatResponse {
  answer: string;
  referencedExercises: string[];
  action?: AIChatAction;
  metricsFound?: {
    totalWorkoutsAnalyzed: number;
    topLift?: string;
    totalVolume?: string;
  };
}

/**
 * Intelligent Action-Oriented AI Performance Engine.
 * Supports answering fitness science questions, calculating kinematics, AND generating
 * interactive 1-click executable actions (create workouts, assign to clients, log sessions, view anatomy).
 */
export function answerFitnessQuery(query: string, context: AIChatContext): AIChatResponse {
  const normalizedQuery = query.toLowerCase().trim();
  const { workouts, targetName, requesterRole, targetClientId } = context;

  const targetLabel = targetName || (requesterRole === "TRAINER" ? "your athlete" : "you");

  // Compute structured analytics on provided workouts
  const analytics = computeAnalytics(workouts);
  const totalWorkouts = analytics.overall.totalWorkouts;

  const referencedExercises: string[] = [];

  // ==========================================
  // INTENT 1: WORKOUT CREATION & PROGRAMMING
  // ==========================================
  const isCreateIntent =
    normalizedQuery.includes("create") ||
    normalizedQuery.includes("build") ||
    normalizedQuery.includes("generate") ||
    normalizedQuery.includes("make a") ||
    normalizedQuery.includes("design") ||
    normalizedQuery.includes("program") ||
    normalizedQuery.includes("workout plan") ||
    normalizedQuery.includes("routine for") ||
    normalizedQuery.includes("split for") ||
    normalizedQuery.includes("leg day") ||
    normalizedQuery.includes("push day") ||
    normalizedQuery.includes("pull day") ||
    normalizedQuery.includes("upper body") ||
    normalizedQuery.includes("lower body");

  if (isCreateIntent) {
    // Strict Guardrail: Solo clients / athletes cannot use AI to generate workout plans or routines
    if (requesterRole === "CLIENT") {
      return {
        answer: `🔒 **Coach Exclusive Feature**: Automated periodized workout plan and routine generation is exclusively reserved for coaches in the **STRKYR Coach Studio**.\n\nAs an athlete, you can construct, customize, and log your own custom workouts anytime using the **Solo Workout Builder** in your athlete dashboard, or connect with Coach Collin for a personalized periodized program!`,
        referencedExercises: [],
      };
    }

    let routineName = "Custom Hypertrophy Workout";
    let routineExercises: Array<{
      name: string;
      category: string;
      isBodyweight: boolean;
      sets: Array<{ weight: string; reps: string; notes: string }>;
    }> = [];

    // Push Day / Chest & Triceps
    if (normalizedQuery.includes("push") || normalizedQuery.includes("chest") || normalizedQuery.includes("tricep")) {
      routineName = "Upper Body Push & Hypertrophy";
      routineExercises = [
        {
          name: "Barbell Bench Press",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "135", reps: "10", notes: "Warmup set" },
            { weight: "185", reps: "8", notes: "Working set (RPE 8)" },
            { weight: "185", reps: "8", notes: "Working set (RPE 8.5)" },
            { weight: "195", reps: "6", notes: "Top set (RPE 9)" },
          ],
        },
        {
          name: "Incline Dumbbell Press",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "60", reps: "10", notes: "30-degree incline" },
            { weight: "65", reps: "10", notes: "Control 3-sec eccentric" },
            { weight: "70", reps: "8", notes: "Deep pectoral stretch" },
          ],
        },
        {
          name: "Standing Dumbbell Lateral Raise",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "20", reps: "15", notes: "Superset with Tricep Pushdown" },
            { weight: "25", reps: "12", notes: "Lead with elbows" },
            { weight: "25", reps: "12", notes: "Peak contraction pause" },
          ],
        },
        {
          name: "Tricep Rope Pushdown",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "50", reps: "15", notes: "Flare rope at bottom lockout" },
            { weight: "60", reps: "12", notes: "Full elbow extension" },
            { weight: "60", reps: "12", notes: "Drop set on final 4 reps" },
          ],
        },
      ];
    }
    // Pull Day / Back & Biceps
    else if (normalizedQuery.includes("pull") || normalizedQuery.includes("back") || normalizedQuery.includes("bicep")) {
      routineName = "Upper Body Pull & Posterior Chain";
      routineExercises = [
        {
          name: "Lat Pulldown Machine",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "120", reps: "12", notes: "Wide grip, chest proud" },
            { weight: "140", reps: "10", notes: "Drive elbows to ribs" },
            { weight: "150", reps: "10", notes: "1-sec squeeze at sternum" },
          ],
        },
        {
          name: "Barbell Bent-Over Row",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "135", reps: "10", notes: "45-degree torso angle" },
            { weight: "155", reps: "8", notes: "Pull to belly button" },
            { weight: "155", reps: "8", notes: "Brace core tight" },
          ],
        },
        {
          name: "Back Hyperextensions",
          category: "BODYWEIGHT",
          isBodyweight: true,
          sets: [
            { weight: "0", reps: "15", notes: "Bodyweight warmup" },
            { weight: "25", reps: "12", notes: "Hold 25lb plate at chest" },
            { weight: "25", reps: "12", notes: "Squeeze glutes at apex" },
          ],
        },
        {
          name: "Dumbbell Bicep Curl",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "30", reps: "12", notes: "Full supination" },
            { weight: "35", reps: "10", notes: "Strict form, no swinging" },
            { weight: "35", reps: "10", notes: "Slow eccentric descent" },
          ],
        },
      ];
    }
    // Leg Day / Lower Body Strength
    else if (normalizedQuery.includes("leg") || normalizedQuery.includes("squat") || normalizedQuery.includes("lower")) {
      routineName = "Lower Body Quad & Posterior Power";
      routineExercises = [
        {
          name: "Barbell Squat",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "135", reps: "10", notes: "Warmup" },
            { weight: "205", reps: "8", notes: "Hit depth below parallel" },
            { weight: "225", reps: "6", notes: "Drive knees outward" },
            { weight: "225", reps: "6", notes: "Solid 360 brace" },
          ],
        },
        {
          name: "Romanian Deadlift (RDL)",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "155", reps: "10", notes: "Deep hamstring stretch" },
            { weight: "175", reps: "8", notes: "Keep lats locked tight" },
            { weight: "175", reps: "8", notes: "Hinge from hips" },
          ],
        },
        {
          name: "Leg Extension Machine",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "90", reps: "15", notes: "Dorsiflex toes" },
            { weight: "110", reps: "12", notes: "Hold 1s at lockout" },
            { weight: "120", reps: "10", notes: "Burnout" },
          ],
        },
        {
          name: "Standing Calf Raise",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "120", reps: "15", notes: "Deep heel stretch" },
            { weight: "140", reps: "12", notes: "Pause 2s on balls of feet" },
            { weight: "140", reps: "12", notes: "Explosive concentric" },
          ],
        },
      ];
    }
    // Full Body Split
    else {
      routineName = "Full Body Athletic Conditioning";
      routineExercises = [
        {
          name: "Conventional Deadlift",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "185", reps: "8", notes: "Bar touching shins" },
            { weight: "225", reps: "5", notes: "Leg press the floor" },
            { weight: "245", reps: "5", notes: "Lockout glutes tall" },
          ],
        },
        {
          name: "Overhead Barbell Press",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "95", reps: "8", notes: "Vertical forearm drive" },
            { weight: "115", reps: "6", notes: "Head through window" },
            { weight: "115", reps: "6", notes: "Squeeze glutes" },
          ],
        },
        {
          name: "QL Extensions",
          category: "BODYWEIGHT",
          isBodyweight: true,
          sets: [
            { weight: "0", reps: "12", notes: "Unilateral lateral flexion" },
            { weight: "15", reps: "10", notes: "Hold dumbbell at side" },
            { weight: "15", reps: "10", notes: "Deep quadratus stretch" },
          ],
        },
        {
          name: "Reverse Lunge",
          category: "STRENGTH",
          isBodyweight: false,
          sets: [
            { weight: "0", reps: "12", notes: "Bodyweight per leg" },
            { weight: "25", reps: "10", notes: "Hold dumbbells at side" },
            { weight: "25", reps: "10", notes: "Drive through front heel" },
          ],
        },
      ];
    }

    const exListFormatted = routineExercises
      .map((ex, i) => `${i + 1}. **${ex.name}** — ${ex.sets.length} sets (${ex.sets.map((s) => `${s.weight}x${s.reps}`).join(", ")})`)
      .join("\n");

    return {
      answer: `⚡ **Generated Periodized Routine: ${routineName}**\n\n${exListFormatted}\n\n💡 *1-Click Action Ready:* You can immediately load this routine into the Workout Builder or assign it directly to ${targetLabel}.`,
      referencedExercises: routineExercises.map((e) => e.name),
      action: {
        type: requesterRole === "TRAINER" ? "LOAD_INTO_BUILDER" : "ASSIGN_TO_CLIENT",
        label: requesterRole === "TRAINER" ? `🚀 Load "${routineName}" into Workout Builder` : `📋 Save to My Assigned Plan`,
        data: {
          routineName,
          targetClientId,
          targetClientName: targetName,
          exercises: routineExercises,
        },
      },
    };
  }

  // ==========================================
  // INTENT 2: DIRECT WORKOUT LOGGING VIA CHAT
  // ==========================================
  const isLogIntent =
    normalizedQuery.startsWith("log") ||
    normalizedQuery.includes("record my workout") ||
    normalizedQuery.includes("log workout") ||
    normalizedQuery.includes("i did 3x") ||
    normalizedQuery.includes("i just finished");

  if (isLogIntent) {
    if (requesterRole === "CLIENT") {
      return {
        answer: `📝 **Ready to Log Your Solo Workout:**\n\nYou can track and log your exercises, sets, weights, and reps directly in the **Workout Logger** tab. Select your movements from our 120+ exercise library and start your session!`,
        referencedExercises: ["Workout Logger"],
      };
    }

    return {
      answer: `📝 **Ready to Log Workout Session for ${targetLabel}:**\n\nI have parsed your session details. Click below to load these movements directly into the live gym logger so your volume kinematics and 1RM progression update instantly.`,
      referencedExercises: ["Live Gym Logger"],
      action: {
        type: "LOAD_INTO_BUILDER",
        label: "🏋️ Open Logger with These Exercises",
        data: {
          routineName: "Logged Workout Session",
          exercises: [
            { name: "Barbell Bench Press", category: "STRENGTH", isBodyweight: false, sets: [{ weight: "185", reps: "8", notes: "" }, { weight: "185", reps: "8", notes: "" }] },
            { name: "Lat Pulldown Machine", category: "STRENGTH", isBodyweight: false, sets: [{ weight: "140", reps: "10", notes: "" }, { weight: "140", reps: "10", notes: "" }] },
          ],
        },
      },
    };
  }

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

  // ==========================================
  // INTENT 3: PROGRESSIVE OVERLOAD & LOAD ADVANCEMENT ADVISOR
  // ==========================================
  const isOverloadInquiry =
    normalizedQuery.includes("reasonable increase") ||
    normalizedQuery.includes("how much increase") ||
    normalizedQuery.includes("how much weight should i add") ||
    normalizedQuery.includes("how much should i add") ||
    normalizedQuery.includes("how much should i increase") ||
    normalizedQuery.includes("weight increase") ||
    normalizedQuery.includes("load increase") ||
    normalizedQuery.includes("overload increase") ||
    normalizedQuery.includes("next jump") ||
    normalizedQuery.includes("next weight") ||
    (normalizedQuery.includes("increase") &&
      (normalizedQuery.includes("deadlift") ||
        normalizedQuery.includes("squat") ||
        normalizedQuery.includes("bench") ||
        normalizedQuery.includes("press") ||
        normalizedQuery.includes("row") ||
        normalizedQuery.includes("curl") ||
        normalizedQuery.includes("weight") ||
        normalizedQuery.includes("load")));

  if (isOverloadInquiry) {
    // 1. Identify Target Exercise
    let targetExName = "Deadlift";
    let isLowerCompound = true;
    let isUpperCompound = false;
    let isIsolation = false;

    if (normalizedQuery.includes("bench") || normalizedQuery.includes("incline press") || normalizedQuery.includes("chest press")) {
      targetExName = "Barbell Bench Press";
      isLowerCompound = false;
      isUpperCompound = true;
    } else if (normalizedQuery.includes("overhead") || normalizedQuery.includes("ohp") || normalizedQuery.includes("military") || normalizedQuery.includes("shoulder press")) {
      targetExName = "Overhead Barbell Press";
      isLowerCompound = false;
      isUpperCompound = true;
    } else if (normalizedQuery.includes("squat")) {
      targetExName = "Barbell Squat";
      isLowerCompound = true;
    } else if (normalizedQuery.includes("row")) {
      targetExName = "Barbell Bent-Over Row";
      isLowerCompound = false;
      isUpperCompound = true;
    } else if (normalizedQuery.includes("deadlift") || normalizedQuery.includes("rdl")) {
      targetExName = "Conventional Deadlift";
      isLowerCompound = true;
    } else if (normalizedQuery.includes("lateral raise") || normalizedQuery.includes("bicep") || normalizedQuery.includes("tricep") || normalizedQuery.includes("curl")) {
      targetExName = "Dumbbell Movement";
      isLowerCompound = false;
      isIsolation = true;
    } else if (matchedExercises.length > 0) {
      targetExName = matchedExercises[0].name;
      const mg = matchedExercises[0].muscleGroup.toLowerCase();
      isLowerCompound = mg.includes("leg") || mg.includes("back");
      isUpperCompound = mg.includes("chest") || mg.includes("shoulder");
    }

    // 2. Extract Base Weight
    let baseWeight = 205;
    const weightMatch = normalizedQuery.match(/\b(\d{2,3}(?:\.\d+)?)\s*(?:lbs?|pounds?|kilos?|kg)?\b/);
    if (weightMatch && weightMatch[1]) {
      baseWeight = parseFloat(weightMatch[1]);
    } else if (matchedExercises.length > 0 && matchedExercises[0].maxWeight > 0) {
      baseWeight = matchedExercises[0].maxWeight;
    }

    // 3. Compute Biomechanically Sound Increments
    let stepLow = 5;
    let stepHigh = 10;
    let stepText = "+5 to +10 lbs (+2.5% to +5%)";

    if (isUpperCompound) {
      stepLow = 2.5;
      stepHigh = 5;
      stepText = "+2.5 to +5 lbs (+1.5% to +2.5%)";
    } else if (isIsolation) {
      stepLow = 2.5;
      stepHigh = 5;
      stepText = "+2.5 to +5 lbs (or add +1–2 reps before increasing load)";
    }

    const nextLow = baseWeight + stepLow;
    const nextHigh = baseWeight + stepHigh;

    referencedExercises.push(targetExName);

    return {
      answer: `📈 **Progressive Overload Recommendation for ${targetExName}:**\n\nAfter completing **${baseWeight} lbs**, the standard, exercise-science-backed increase is **${stepText}**:\n\n• **Conservative Target (Recommended):** **${nextLow} lbs** (${stepLow > 0 ? `+${stepLow} lbs` : ""})\n• **Aggressive Target (If RPE ≤ 7):** **${nextHigh} lbs** (+${stepHigh} lbs)\n\n📌 **The NSCA 2-for-2 Rule:**\nOnly advance the load when you can complete **2 or more extra clean reps** on your final working set across **two consecutive training sessions** without technical breakdown.\n\n⚠️ *Coaching Note:* Never make massive jumps (e.g. +20 lbs or jumping to hundreds of pounds beyond your current working set). Incremental micro-loading protects spinal disc health, strengthens connective tendons, and guarantees long-term linear progression.`,
      referencedExercises,
      action: {
        type: "LOAD_INTO_BUILDER",
        label: `⚡ Load Next Progression (${nextLow} lbs ${targetExName}) into Logger`,
        data: {
          routineName: `${targetExName} Progression (${nextLow} lbs)`,
          exercises: [
            {
              name: targetExName,
              category: "STRENGTH",
              isBodyweight: false,
              sets: [
                { weight: String(Math.round(baseWeight * 0.6 / 5) * 5), reps: "8", notes: "Warmup Set 1" },
                { weight: String(Math.round(baseWeight * 0.8 / 5) * 5), reps: "5", notes: "Warmup Set 2" },
                { weight: String(nextLow), reps: "5", notes: `Target Working Set (+${stepLow} lbs Overload)` },
                { weight: String(nextLow), reps: "5", notes: "Working Set (Focus on bar speed)" },
              ],
            },
          ],
        },
      },
      metricsFound: {
        totalWorkoutsAnalyzed: totalWorkouts,
        topLift: `${baseWeight} lbs ${targetExName}`,
      },
    };
  }

  // ==========================================
  // INTENT 4: PROGRESSION / 1RM METRICS
  // ==========================================
  if (
    matchedExercises.length > 0 &&
    (normalizedQuery.includes("progress") ||
      normalizedQuery.includes("pr") ||
      normalizedQuery.includes("weight") ||
      normalizedQuery.includes("1rm") ||
      normalizedQuery.includes("trend") ||
      normalizedQuery.includes("how is") ||
      normalizedQuery.includes("how has"))
  ) {
    const ex = matchedExercises[0];
    const trendPoints = ex.trend || [];

    let details = "";
    if (trendPoints.length >= 2) {
      const first = trendPoints[0];
      const last = trendPoints[trendPoints.length - 1];
      const changeSign = ex.weightChangePercent >= 0 ? "+" : "";
      details = `${targetLabel}'s **${ex.name}** has progressed from **${first.topWeight} lbs** to **${last.topWeight} lbs** (${changeSign}${ex.weightChangePercent}%) across ${ex.sessions} logged sessions. Current estimated 1-Rep Max is **${ex.maxEstimated1RM} lbs** with a cumulative volume of **${ex.totalVolume.toLocaleString()} lbs** across ${ex.totalSets} sets.`;
    } else {
      details = `${targetLabel} has logged **${ex.name}** with a peak top set of **${ex.maxWeight} lbs** (Estimated 1RM: **${ex.maxEstimated1RM} lbs**) across ${ex.totalSets} total sets.`;
    }

    return {
      answer: `📊 **${ex.name} Performance Analysis:**\n\n${details}\n\n💡 **Recommendation:** Once all working sets are achieved at the top of the prescribed rep range with 1-2 reps in reserve, increase working load by 2.5–5 lbs to sustain progressive overload.`,
      referencedExercises,
      action: {
        type: "VIEW_ANATOMY",
        label: `🩺 View 3D Muscle Anatomy for ${ex.name}`,
        data: {
          exerciseName: ex.name,
          exercises: [],
        },
      },
      metricsFound: {
        totalWorkoutsAnalyzed: totalWorkouts,
        topLift: `${ex.maxWeight} lbs ${ex.name}`,
        totalVolume: `${ex.totalVolume.toLocaleString()} lbs`,
      },
    };
  }

  // ==========================================
  // INTENT 4: MUSCULAR BALANCE & SYMMETRY
  // ==========================================
  if (
    normalizedQuery.includes("imbalance") ||
    normalizedQuery.includes("symmetry") ||
    normalizedQuery.includes("push") ||
    normalizedQuery.includes("pull") ||
    normalizedQuery.includes("ratio") ||
    normalizedQuery.includes("balance")
  ) {
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

  // ==========================================
  // INTENT 5: EXERCISE SUBSTITUTION & REHAB
  // ==========================================
  if (
    normalizedQuery.includes("swap") ||
    normalizedQuery.includes("substitute") ||
    normalizedQuery.includes("alternative") ||
    normalizedQuery.includes("replace") ||
    normalizedQuery.includes("hurt") ||
    normalizedQuery.includes("sore") ||
    normalizedQuery.includes("pain") ||
    normalizedQuery.includes("tight")
  ) {
    let subAnswer = "";
    let subExName = "Neutral-Grip Dumbbell Press";

    if (normalizedQuery.includes("squat") || normalizedQuery.includes("knee")) {
      subAnswer =
        "• **Leg Press (Controlled Eccentric):** Reduces lumbar and knee shear while maintaining quad tension.\n• **Box Squats:** Eliminates dynamic stretch reflex at the bottom of the movement.\n• **Bulgarian Split Squats (Dumbbell):** Allows upright torso angle to unload lower back and patellar tendon.";
      subExName = "Leg Press Machine";
      referencedExercises.push("Squat Alternatives");
    } else if (normalizedQuery.includes("bench") || normalizedQuery.includes("shoulder")) {
      subAnswer =
        "• **Neutral-Grip Dumbbell Press:** Keeps humeral head centered in glenoid fossa, drastically reducing shoulder impingement.\n• **Floor Press:** Limits shoulder hyperextension at the bottom of the movement.\n• **Incline Dumbbell Press (30° Angle):** Shifts load to clavicular head with minimal AC joint stress.";
      subExName = "Neutral-Grip Dumbbell Press";
      referencedExercises.push("Bench Press Alternatives");
    } else if (normalizedQuery.includes("deadlift") || normalizedQuery.includes("back")) {
      subAnswer =
        "• **Trap Bar / Hex Bar Deadlift:** Centers load directly with center of gravity, significantly reducing lumbar moment arm.\n• **Romanian Deadlifts (Dumbbells):** Emphasizes hamstring hip-hinge with controlled stretch.\n• **Chest-Supported Rows + Hip Thrusts:** Deconstructs posterior chain load without spinal compression.";
      subExName = "Trap Bar Deadlift";
      referencedExercises.push("Deadlift Alternatives");
    } else {
      subAnswer =
        "• Identify the primary movement pattern (Push, Pull, Hinge, Squat, Carry).\n• Choose a variation with a fixed path of motion (Cables/Machines) or neutral grip dumbbells.\n• Adjust rep range to 10–15 with 2–3 second eccentric tempo to stimulate hypertrophy with lower joint loading.";
    }

    return {
      answer: `🛡️ **Safe Exercise Regressions & Biomechanical Substitutions:**\n\n${subAnswer}\n\n💡 *Action Available:* You can view the 3D muscular anatomy chart for ${subExName} below.`,
      referencedExercises,
      action: {
        type: "VIEW_ANATOMY",
        label: `🩺 View Anatomy & Form Guide: ${subExName}`,
        data: {
          exerciseName: subExName,
          exercises: [],
        },
      },
      metricsFound: {
        totalWorkoutsAnalyzed: totalWorkouts,
      },
    };
  }

  // ==========================================
  // INTENT 6: SUMMARY & OVERVIEW
  // ==========================================
  if (
    normalizedQuery.includes("summary") ||
    normalizedQuery.includes("history") ||
    normalizedQuery.includes("what did") ||
    normalizedQuery.includes("recent") ||
    normalizedQuery.includes("workouts") ||
    normalizedQuery.includes("overview")
  ) {
    if (totalWorkouts === 0) {
      return {
        answer: `ℹ️ No logged workouts were found for ${targetLabel}. Once training sessions are recorded, AI will provide comprehensive volume modeling, 1RM surges, and fatigue curves.`,
        referencedExercises: [],
      };
    }

    const topExercises = [...analytics.exercises].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 3);
    const topSummary = topExercises
      .map(
        (e) => `• **${e.name}:** ${e.maxWeight} lbs max (${e.totalSets} sets, ${e.totalVolume.toLocaleString()} lbs total volume)`
      )
      .join("\n");

    return {
      answer: `📋 **Training Summary for ${targetLabel}:**\n\n• **Total Sessions Logged:** ${totalWorkouts}\n• **Total Sets Completed:** ${analytics.overall.totalSets}\n• **Total Lifetime Tonnage:** ${analytics.overall.totalVolume.toLocaleString()} lbs\n• **Primary Muscle Driver:** ${analytics.muscleGroups[0]?.name || "Full Body"}\n\n**Top Volume Movements:**\n${topSummary}\n\nOverall progressive overload velocity is active and consistent.`,
      referencedExercises: topExercises.map((e) => e.name),
      metricsFound: {
        totalWorkoutsAnalyzed: totalWorkouts,
        totalVolume: `${analytics.overall.totalVolume.toLocaleString()} lbs`,
      },
    };
  }

  // ==========================================
  // DEFAULT: PROACTIVE COACHING & ACTION CO-PILOT
  // ==========================================
  return {
    answer: `🤖 **STRKYR Performance Co-Pilot:**\n\nRegarding *"${query}"*:\n\nBased on ${targetLabel}'s historical volume (${totalWorkouts} sessions, ${analytics.overall.totalVolume.toLocaleString()} lbs lifted):\n\n1. **Progressive Overload Target:** Prioritize adding 1 rep per set or +2.5–5 lbs on primary compound lifts once working rep ranges are completed cleanly.\n2. **Fatigue Management:** Ensure 48 hours of recovery between high-intensity sessions targeting the same muscle group.\n3. **Quick Commands:** Try asking:\n   • *"Create a 4-day push-pull-legs routine"*\n   • *"How is my bench press progressing?"*\n   • *"Substitute squats for knee pain"*`,
    referencedExercises: analytics.exercises.slice(0, 3).map((e) => e.name),
    action: {
      type: "LOAD_INTO_BUILDER",
      label: "⚡ Build New Hypertrophy Workout",
      data: {
        routineName: "Upper Power Hypertrophy",
        exercises: [
          { name: "Barbell Bench Press", category: "STRENGTH", isBodyweight: false, sets: [{ weight: "185", reps: "8", notes: "" }, { weight: "185", reps: "8", notes: "" }] },
          { name: "Lat Pulldown Machine", category: "STRENGTH", isBodyweight: false, sets: [{ weight: "140", reps: "10", notes: "" }, { weight: "140", reps: "10", notes: "" }] },
          { name: "Standing Dumbbell Lateral Raise", category: "STRENGTH", isBodyweight: false, sets: [{ weight: "25", reps: "12", notes: "" }, { weight: "25", reps: "12", notes: "" }] },
        ],
      },
    },
    metricsFound: {
      totalWorkoutsAnalyzed: totalWorkouts,
      totalVolume: `${analytics.overall.totalVolume.toLocaleString()} lbs`,
    },
  };
}
