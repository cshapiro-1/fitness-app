export interface ExerciseDefinition {
  name: string;
  muscleGroup: "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Full Body" | "Cardio" | "Stretching" | "Bodyweight" | "Wellness";
  equipment: "Barbell" | "Dumbbell" | "Cable" | "Machine" | "Bodyweight" | "Kettlebell" | "Cardio Machine" | "Other";
  secondaryMuscle?: string;
  isCompound?: boolean;
}

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // CHEST
  { name: "Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", isCompound: true },
  { name: "Incline Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", isCompound: true },
  { name: "Decline Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", isCompound: true },
  { name: "Flat Dumbbell Press", muscleGroup: "Chest", equipment: "Dumbbell", isCompound: true },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest", equipment: "Dumbbell", isCompound: true },
  { name: "Decline Dumbbell Press", muscleGroup: "Chest", equipment: "Dumbbell", isCompound: true },
  { name: "Dumbbell Chest Fly", muscleGroup: "Chest", equipment: "Dumbbell" },
  { name: "Incline Dumbbell Fly", muscleGroup: "Chest", equipment: "Dumbbell" },
  { name: "Cable Crossover Fly", muscleGroup: "Chest", equipment: "Cable" },
  { name: "Low-to-High Cable Fly", muscleGroup: "Chest", equipment: "Cable" },
  { name: "High-to-Low Cable Fly", muscleGroup: "Chest", equipment: "Cable" },
  { name: "Push-Up", muscleGroup: "Bodyweight", equipment: "Bodyweight", isCompound: true },
  { name: "Weighted Push-Up", muscleGroup: "Chest", equipment: "Bodyweight", isCompound: true },
  { name: "Chest Dip", muscleGroup: "Bodyweight", equipment: "Bodyweight", isCompound: true },
  { name: "Chest Press Machine", muscleGroup: "Chest", equipment: "Machine", isCompound: true },
  { name: "Pec Deck Machine Fly", muscleGroup: "Chest", equipment: "Machine" },
  { name: "Landmine Chest Press", muscleGroup: "Chest", equipment: "Barbell", isCompound: true },

  // BACK
  { name: "Barbell Deadlift", muscleGroup: "Legs", equipment: "Barbell", secondaryMuscle: "Back", isCompound: true },
  { name: "Conventional Deadlift", muscleGroup: "Legs", equipment: "Barbell", secondaryMuscle: "Back", isCompound: true },
  { name: "Sumo Deadlift", muscleGroup: "Legs", equipment: "Barbell", isCompound: true },
  { name: "Barbell Bent-Over Row", muscleGroup: "Back", equipment: "Barbell", isCompound: true },
  { name: "Pendlay Row", muscleGroup: "Back", equipment: "Barbell", isCompound: true },
  { name: "Single-Arm Dumbbell Row", muscleGroup: "Back", equipment: "Dumbbell", isCompound: true },
  { name: "Chest-Supported Dumbbell Row", muscleGroup: "Back", equipment: "Dumbbell" },
  { name: "Pull-Up", muscleGroup: "Bodyweight", equipment: "Bodyweight", isCompound: true },
  { name: "Chin-Up", muscleGroup: "Bodyweight", equipment: "Bodyweight", isCompound: true },
  { name: "Lat Pulldown (Wide Grip)", muscleGroup: "Back", equipment: "Cable", isCompound: true },
  { name: "Lat Pulldown (Close Grip)", muscleGroup: "Back", equipment: "Cable", isCompound: true },
  { name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable", isCompound: true },
  { name: "T-Bar Row", muscleGroup: "Back", equipment: "Barbell", isCompound: true },
  { name: "Straight Arm Lat Pulldown", muscleGroup: "Back", equipment: "Cable" },
  { name: "Face Pull", muscleGroup: "Shoulders", equipment: "Cable", secondaryMuscle: "Back" },
  { name: "Barbell Shrug", muscleGroup: "Back", equipment: "Barbell" },
  { name: "Dumbbell Shrug", muscleGroup: "Back", equipment: "Dumbbell" },
  { name: "Hyperextensions (Back Extension)", muscleGroup: "Back", equipment: "Bodyweight" },
  { name: "Assisted Pull-Up", muscleGroup: "Back", equipment: "Machine" },

  // LEGS / LOWER BODY
  { name: "Barbell Back Squat", muscleGroup: "Legs", equipment: "Barbell", isCompound: true },
  { name: "Barbell Front Squat", muscleGroup: "Legs", equipment: "Barbell", isCompound: true },
  { name: "Box Squat", muscleGroup: "Legs", equipment: "Barbell", isCompound: true },
  { name: "Goblet Squat", muscleGroup: "Legs", equipment: "Dumbbell", isCompound: true },
  { name: "Bulgarian Split Squat", muscleGroup: "Legs", equipment: "Dumbbell", isCompound: true },
  { name: "Walking Dumbbell Lunge", muscleGroup: "Legs", equipment: "Dumbbell", isCompound: true },
  { name: "Reverse Lunge", muscleGroup: "Legs", equipment: "Dumbbell", isCompound: true },
  { name: "Leg Press", muscleGroup: "Legs", equipment: "Machine", isCompound: true },
  { name: "Hack Squat", muscleGroup: "Legs", equipment: "Machine", isCompound: true },
  { name: "Romanian Deadlift (RDL)", muscleGroup: "Legs", equipment: "Barbell", isCompound: true },
  { name: "Dumbbell Romanian Deadlift", muscleGroup: "Legs", equipment: "Dumbbell", isCompound: true },
  { name: "Leg Extension", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Seated Leg Curl", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Lying Leg Curl", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Nordic Hamstring Curl", muscleGroup: "Legs", equipment: "Bodyweight" },
  { name: "Barbell Hip Thrust", muscleGroup: "Legs", equipment: "Barbell", isCompound: true },
  { name: "Dumbbell Hip Thrust", muscleGroup: "Legs", equipment: "Dumbbell" },
  { name: "Standing Calf Raise", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Seated Calf Raise", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Good Morning", muscleGroup: "Legs", equipment: "Barbell", isCompound: true },
  { name: "Step-Up", muscleGroup: "Legs", equipment: "Dumbbell" },
  { name: "Sled Push (Prowler)", muscleGroup: "Legs", equipment: "Other", isCompound: true },

  // SHOULDERS
  { name: "Overhead Barbell Press (OHP)", muscleGroup: "Shoulders", equipment: "Barbell", isCompound: true },
  { name: "Seated Dumbbell Shoulder Press", muscleGroup: "Shoulders", equipment: "Dumbbell", isCompound: true },
  { name: "Arnold Press", muscleGroup: "Shoulders", equipment: "Dumbbell", isCompound: true },
  { name: "Standing Dumbbell Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  { name: "Cable Lateral Raise", muscleGroup: "Shoulders", equipment: "Cable" },
  { name: "Dumbbell Front Raise", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  { name: "Barbell Upright Row", muscleGroup: "Shoulders", equipment: "Barbell", isCompound: true },
  { name: "Cable Upright Row", muscleGroup: "Shoulders", equipment: "Cable" },
  { name: "Rear Delt Dumbbell Fly", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  { name: "Reverse Pec Deck (Rear Delt)", muscleGroup: "Shoulders", equipment: "Machine" },
  { name: "Cable Face Pull", muscleGroup: "Shoulders", equipment: "Cable" },
  { name: "Landmine Shoulder Press", muscleGroup: "Shoulders", equipment: "Barbell" },
  { name: "Push Press", muscleGroup: "Shoulders", equipment: "Barbell", isCompound: true },

  // ARMS
  { name: "Barbell Bicep Curl", muscleGroup: "Arms", equipment: "Barbell" },
  { name: "EZ-Bar Preacher Curl", muscleGroup: "Arms", equipment: "Barbell" },
  { name: "Dumbbell Alternating Bicep Curl", muscleGroup: "Arms", equipment: "Dumbbell" },
  { name: "Dumbbell Hammer Curl", muscleGroup: "Arms", equipment: "Dumbbell" },
  { name: "Incline Dumbbell Curl", muscleGroup: "Arms", equipment: "Dumbbell" },
  { name: "Concentration Curl", muscleGroup: "Arms", equipment: "Dumbbell" },
  { name: "Cable Bicep Curl", muscleGroup: "Arms", equipment: "Cable" },
  { name: "Cable Hammer Rope Curl", muscleGroup: "Arms", equipment: "Cable" },
  { name: "Tricep Rope Pushdown", muscleGroup: "Arms", equipment: "Cable" },
  { name: "Tricep Straight Bar Pushdown", muscleGroup: "Arms", equipment: "Cable" },
  { name: "Skull Crusher (Lying Triceps Extension)", muscleGroup: "Arms", equipment: "Barbell" },
  { name: "Overhead Dumbbell Tricep Extension", muscleGroup: "Arms", equipment: "Dumbbell" },
  { name: "Overhead Cable Tricep Extension", muscleGroup: "Arms", equipment: "Cable" },
  { name: "Close-Grip Barbell Bench Press", muscleGroup: "Arms", equipment: "Barbell", isCompound: true },
  { name: "Tricep Bench Dip", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Dumbbell Kickback", muscleGroup: "Arms", equipment: "Dumbbell" },

  // CORE / ABS
  { name: "Plank", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Hanging Leg Raise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Captain's Chair Knee Raise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Ab Wheel Rollout", muscleGroup: "Core", equipment: "Other" },
  { name: "Cable Woodchopper", muscleGroup: "Core", equipment: "Cable" },
  { name: "Cable Crunch", muscleGroup: "Core", equipment: "Cable" },
  { name: "Russian Twist", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Decline Bench Sit-Up", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Farmer's Walk (Carry)", muscleGroup: "Core", equipment: "Dumbbell", isCompound: true },
  { name: "Dead Bug", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Side Plank", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Pallof Press", muscleGroup: "Core", equipment: "Cable" },

  // CARDIO & ENDURANCE
  { name: "Treadmill Running (Miles/Mins)", muscleGroup: "Cardio", equipment: "Cardio Machine" },
  { name: "Outdoor Distance Run", muscleGroup: "Cardio", equipment: "Other" },
  { name: "Stationary Bike / Spin Cycle", muscleGroup: "Cardio", equipment: "Cardio Machine" },
  { name: "Rowing Machine (Ergometer)", muscleGroup: "Cardio", equipment: "Cardio Machine", isCompound: true },
  { name: "Stairmaster / Stair Climber", muscleGroup: "Cardio", equipment: "Cardio Machine" },
  { name: "Incline Treadmill Walk", muscleGroup: "Cardio", equipment: "Cardio Machine" },
  { name: "Jump Rope Intervals", muscleGroup: "Cardio", equipment: "Other" },
  { name: "Assault AirBike Sprints", muscleGroup: "Cardio", equipment: "Cardio Machine" },
  { name: "Swimming Laps", muscleGroup: "Cardio", equipment: "Other" },
  { name: "Elliptical Trainer", muscleGroup: "Cardio", equipment: "Cardio Machine" },

  // STRETCHING & MOBILITY
  { name: "Full Body Mobility & Dynamic Warmup", muscleGroup: "Stretching", equipment: "Bodyweight" },
  { name: "Foam Rolling (Quads, Lats, IT Bands)", muscleGroup: "Stretching", equipment: "Other" },
  { name: "Pigeon Pose (Hip Opener)", muscleGroup: "Stretching", equipment: "Bodyweight" },
  { name: "Hip Flexor Kneeling Stretch", muscleGroup: "Stretching", equipment: "Bodyweight" },
  { name: "Hamstring & Calf Stretch", muscleGroup: "Stretching", equipment: "Bodyweight" },
  { name: "Shoulder Band Dislocates & Mobility", muscleGroup: "Stretching", equipment: "Other" },
  { name: "Couch Stretch (Quad & Hip)", muscleGroup: "Stretching", equipment: "Bodyweight" },
  { name: "Cat-Cow Spine Mobilization", muscleGroup: "Stretching", equipment: "Bodyweight" },
  { name: "Thoracic Spine Foam Roller Extension", muscleGroup: "Stretching", equipment: "Other" },

  // WELLNESS TARGETS & DAILY HABITS
  { name: "Rest & Recovery Day (Active Rest)", muscleGroup: "Wellness", equipment: "Other" },
  { name: "Hit 10,000 Daily Steps", muscleGroup: "Wellness", equipment: "Other" },
  { name: "Hit 12,000 Daily Steps", muscleGroup: "Wellness", equipment: "Other" },
  { name: "Drink 1 Gallon Water (128 oz)", muscleGroup: "Wellness", equipment: "Other" },
  { name: "8+ Hours Deep Restful Sleep", muscleGroup: "Wellness", equipment: "Other" },
  { name: "Post-Workout Protein & Fuel Intake", muscleGroup: "Wellness", equipment: "Other" },
  { name: "10-Minute Breathwork / Meditation", muscleGroup: "Wellness", equipment: "Other" },
  { name: "Cold Plunge / Sauna Recovery Session", muscleGroup: "Wellness", equipment: "Other" },

  // FULL BODY / OLYMPIC & FUNCTIONAL
  { name: "Power Clean", muscleGroup: "Full Body", equipment: "Barbell", isCompound: true },
  { name: "Clean and Jerk", muscleGroup: "Full Body", equipment: "Barbell", isCompound: true },
  { name: "Snatch", muscleGroup: "Full Body", equipment: "Barbell", isCompound: true },
  { name: "Kettlebell Swing", muscleGroup: "Full Body", equipment: "Kettlebell", isCompound: true },
  { name: "Turkish Get-Up", muscleGroup: "Full Body", equipment: "Kettlebell", isCompound: true },
  { name: "Burpee", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Box Jump", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Jumping Jacks", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Mountain Climbers", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Bodyweight Air Squats", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Walking Bodyweight Lunges", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Glute Bridge", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "High Knees", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Wall Sit", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Back Extension / Hyperextension", muscleGroup: "Bodyweight", equipment: "Bodyweight" },
  { name: "Medicine Ball Slam", muscleGroup: "Full Body", equipment: "Other" },
];

/**
 * Fitness Abbreviations, Acronyms & Synonyms
 */
export const FITNESS_SYNONYMS: Record<string, string[]> = {
  db: ["dumbbell"],
  bb: ["barbell"],
  rdl: ["romanian", "deadlift"],
  ohp: ["overhead", "press"],
  bw: ["bodyweight"],
  kb: ["kettlebell"],
  tri: ["tricep", "triceps"],
  tris: ["triceps"],
  bi: ["bicep", "biceps"],
  bis: ["biceps"],
  lat: ["latissimus", "pulldown", "lats"],
  lats: ["latissimus", "pulldown"],
  abs: ["abdominals", "core", "plank", "crunch"],
  pec: ["chest", "pectoral", "pecs"],
  pecs: ["chest", "pectoral"],
  quad: ["quadriceps", "leg extension", "squat"],
  quads: ["quadriceps", "legs"],
  ham: ["hamstring", "curl", "rdl"],
  hams: ["hamstrings"],
  bp: ["bench", "press"],
  sq: ["squat"],
  dl: ["deadlift"],
  bench: ["press", "bench press"],
  press: ["bench", "press"],
  pushup: ["push-up", "push up"],
  pullup: ["pull-up", "pull up"],
  chinup: ["chin-up", "chin up"],
  calf: ["calves", "gastrocnemius", "soleus"],
  calves: ["calf", "gastrocnemius", "soleus"],
  shrug: ["trapezius", "traps", "shrugs"],
  trap: ["trapezius", "shrug"],
  traps: ["trapezius", "shrugs"],
  abduction: ["abductor", "glute medius", "outer hip"],
  abductor: ["abduction", "glute medius"],
  adduction: ["adductor", "inner thigh"],
  adductor: ["adduction", "inner thigh"],
};

/**
 * Damerau-Levenshtein Distance calculation with transposition support for typos
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      // Adjacent Transposition (e.g. "sqaut" <-> "squat")
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

/**
 * Checks if a single query token fuzzy-matches a single target token
 */
export function fuzzyMatchToken(queryToken: string, targetToken: string): { matched: boolean; score: number } {
  const q = queryToken.toLowerCase();
  const t = targetToken.toLowerCase();

  // Exact Match
  if (q === t) return { matched: true, score: 100 };

  // Prefix Match (e.g. "inc" in "incline")
  if (t.startsWith(q)) return { matched: true, score: 90 };

  // Substring Match (e.g. "press" in "bench press")
  if (t.includes(q)) return { matched: true, score: 80 };

  // Subsequence Match (characters appear in order)
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) qIdx++;
  }
  if (qIdx === q.length && q.length >= 3) {
    return { matched: true, score: 70 };
  }

  // Levenshtein / Damerau Edit Distance for Typos (e.g. "dumbell" -> "dumbbell", "sqaut" -> "squat")
  const dist = levenshteinDistance(q, t);
  const maxAllowedDistance = q.length <= 3 ? 0 : q.length <= 5 ? 1 : 2;
  if (dist <= maxAllowedDistance) {
    return { matched: true, score: 70 - dist * 10 };
  }

  // Synonym check
  const syns = FITNESS_SYNONYMS[q];
  if (syns) {
    for (const syn of syns) {
      if (t.includes(syn) || syn.includes(t)) {
        return { matched: true, score: 85 };
      }
    }
  }

  return { matched: false, score: 0 };
}

/**
 * Computes a relevance score for an exercise against a query
 */
export function scoreExercise(ex: ExerciseDefinition, query: string): number {
  if (!query.trim()) return 1;

  const rawQuery = query.toLowerCase().trim();
  const exName = ex.name.toLowerCase();
  const muscle = ex.muscleGroup.toLowerCase();
  const equip = ex.equipment.toLowerCase();
  const secondary = (ex.secondaryMuscle || "").toLowerCase();

  // 1. Exact Full Match
  if (exName === rawQuery) return 200;

  // 2. Full Substring Match
  if (exName.includes(rawQuery)) return 150;

  // 3. Tokenize Query and Target
  const queryTokens = rawQuery.split(/[\s\-_/]+/).filter(Boolean);
  const targetText = `${exName} ${muscle} ${equip} ${secondary}`;
  const targetTokens = targetText.split(/[\s\-_/]+/).filter(Boolean);

  let totalScore = 0;
  let allTokensMatched = true;

  for (const qToken of queryTokens) {
    let bestTokenScore = 0;

    // Check against each word in the target
    for (const tToken of targetTokens) {
      const match = fuzzyMatchToken(qToken, tToken);
      if (match.matched && match.score > bestTokenScore) {
        bestTokenScore = match.score;
      }
    }

    // Check if query token is a synonym mapping to any target token
    const syns = FITNESS_SYNONYMS[qToken];
    if (syns) {
      for (const syn of syns) {
        if (targetText.includes(syn)) {
          bestTokenScore = Math.max(bestTokenScore, 85);
        }
      }
    }

    if (bestTokenScore === 0) {
      allTokensMatched = false;
      break;
    } else {
      totalScore += bestTokenScore;
    }
  }

  if (allTokensMatched) {
    // Reward matches in exercise name over metadata
    if (queryTokens.every((t) => exName.includes(t) || (FITNESS_SYNONYMS[t] && FITNESS_SYNONYMS[t].some((s) => exName.includes(s))))) {
      totalScore += 50;
    }
    return totalScore;
  }

  return 0;
}

/**
 * Intelligent Fuzzy Exercise Search
 * Tolerates typos, partial words, fitness acronyms (db, bb, rdl, ohp, bw, kb, etc.), and multi-term queries in any order.
 */
export function searchExercises(
  query: string,
  muscleFilter?: string,
  equipmentFilter?: string,
  customLibrary: ExerciseDefinition[] = EXERCISE_LIBRARY
): ExerciseDefinition[] {
  const q = query.trim();

  const scored = customLibrary
    .map((ex) => {
      const matchesMuscle = !muscleFilter || muscleFilter === "All" || ex.muscleGroup === muscleFilter;
      const matchesEquipment = !equipmentFilter || equipmentFilter === "All" || ex.equipment === equipmentFilter;
      if (!matchesMuscle || !matchesEquipment) return { ex, score: 0 };

      const score = scoreExercise(ex, q);
      return { ex, score };
    })
    .filter((item) => item.score > 0);

  // Sort by highest relevance score descending, then alphabetically by name
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.ex.name.localeCompare(b.ex.name);
  });

  return scored.map((item) => item.ex);
}

/**
 * Automatically identifies if an exercise name represents a bodyweight or body resistance movement
 */
export function isDefaultBodyweight(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  
  // Check library definition first
  const found = EXERCISE_LIBRARY.find((ex) => ex.name.toLowerCase() === lower);
  if (found && (found.equipment === "Bodyweight" || found.muscleGroup === "Bodyweight")) {
    return true;
  }

  // Fallback pattern matching
  return (
    lower.includes("push-up") ||
    lower.includes("pushup") ||
    lower.includes("push up") ||
    lower.includes("pull-up") ||
    lower.includes("pullup") ||
    lower.includes("pull up") ||
    lower.includes("chin-up") ||
    lower.includes("chinup") ||
    lower.includes("chin up") ||
    lower.includes("dip") ||
    lower.includes("back extension") ||
    lower.includes("hyperextension") ||
    lower.includes("jumping jack") ||
    lower.includes("jumping jacks") ||
    lower.includes("burpee") ||
    lower.includes("plank") ||
    lower.includes("crunch") ||
    lower.includes("sit-up") ||
    lower.includes("situp") ||
    lower.includes("mountain climber") ||
    lower.includes("air squat") ||
    lower.includes("bodyweight") ||
    lower.includes("glute bridge") ||
    lower.includes("dead bug") ||
    lower.includes("russian twist") ||
    lower.includes("leg raise") ||
    lower.includes("knee raise") ||
    lower.includes("flutter kick") ||
    lower.includes("hollow body") ||
    lower.includes("box jump") ||
    lower.includes("high knee") ||
    lower.includes("wall sit")
  );
}

