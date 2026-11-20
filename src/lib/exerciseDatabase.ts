import exercisesRaw from "@/data/exercises.json";

export interface ExerciseItem {
  id: string;
  slug: string;
  name: string;
  muscle: string;
  bodyPart: string;
  equipment: string;
  category: string;
  secondaryMuscles: string[];
  instructions: string[];
  file: string;
  gifUrl: string;
  thumbUrl: string;
}

export function normalizeExerciseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

// Full array of 1,323 indexed exercises
export const ALL_EXERCISES: ExerciseItem[] = exercisesRaw as ExerciseItem[];

// Fast Lookup Maps
const byId = new Map<string, ExerciseItem>();
const bySlug = new Map<string, ExerciseItem>();
const byNormalizedName = new Map<string, ExerciseItem>();
const byLowerName = new Map<string, ExerciseItem>();

for (const ex of ALL_EXERCISES) {
  byId.set(ex.id, ex);
  bySlug.set(ex.slug, ex);
  byNormalizedName.set(normalizeExerciseName(ex.name), ex);
  byLowerName.set(ex.name.toLowerCase().trim(), ex);
}

// Canonical Aliases for Common Gym Exercises
const CANONICAL_ALIASES: Record<string, string> = {
  // Chest / Horizontal Push
  "bench press": "pectorals/barbell-bench-press",
  "barbell bench press": "pectorals/barbell-bench-press",
  "barbell bench": "pectorals/barbell-bench-press",
  "incline bench press": "pectorals/barbell-incline-bench-press",
  "incline barbell bench press": "pectorals/barbell-incline-bench-press",
  "incline bench": "pectorals/barbell-incline-bench-press",
  "decline bench press": "pectorals/barbell-decline-bench-press",
  "dumbbell bench press": "pectorals/dumbbell-bench-press",
  "dumbbell bench": "pectorals/dumbbell-bench-press",
  "db bench press": "pectorals/dumbbell-bench-press",
  "db bench": "pectorals/dumbbell-bench-press",
  "incline dumbbell press": "pectorals/dumbbell-incline-bench-press",
  "incline db press": "pectorals/dumbbell-incline-bench-press",
  "dumbbell incline bench press": "pectorals/dumbbell-incline-bench-press",
  "push up": "pectorals/push-up",
  "push-up": "pectorals/push-up",
  "pushup": "pectorals/push-up",
  "chest fly": "pectorals/dumbbell-fly",
  "dumbbell fly": "pectorals/dumbbell-fly",
  "pec deck": "pectorals/lever-seated-fly",
  "dips": "pectorals/chest-dip",
  "chest dip": "pectorals/chest-dip",

  // Lower Body / Squat & Knee Dominant
  "squat": "glutes/barbell-full-squat",
  "barbell squat": "glutes/barbell-full-squat",
  "back squat": "glutes/barbell-full-squat",
  "barbell back squat": "glutes/barbell-full-squat",
  "front squat": "glutes/barbell-front-squat",
  "barbell front squat": "glutes/barbell-front-squat",
  "goblet squat": "quads/dumbbell-goblet-squat",
  "dumbbell squat": "glutes/dumbbell-squat",
  "leg press": "quads/lever-seated-leg-press",
  "hack squat": "glutes/barbell-hack-squat",
  "leg extension": "quads/lever-leg-extension",
  "quad extension": "quads/lever-leg-extension",
  "bulgarian split squat": "quads/dumbbell-single-leg-split-squat",
  "split squat": "quads/dumbbell-single-leg-split-squat",
  "lunge": "glutes/dumbbell-lunge",
  "walking lunge": "glutes/dumbbell-lunge",

  // Lower Body / Posterior Chain, Deadlift & Hamstrings
  "deadlift": "glutes/barbell-deadlift",
  "barbell deadlift": "glutes/barbell-deadlift",
  "conventional deadlift": "glutes/barbell-deadlift",
  "romanian deadlift": "hamstrings/barbell-romanian-deadlift",
  "barbell romanian deadlift": "hamstrings/barbell-romanian-deadlift",
  "rdl": "hamstrings/barbell-romanian-deadlift",
  "dumbbell rdl": "hamstrings/dumbbell-romanian-deadlift",
  "dumbbell romanian deadlift": "hamstrings/dumbbell-romanian-deadlift",
  "stiff leg deadlift": "hamstrings/barbell-stiff-leg-deadlift",
  "leg curl": "hamstrings/lever-lying-leg-curl",
  "hamstring curl": "hamstrings/lever-lying-leg-curl",
  "lying leg curl": "hamstrings/lever-lying-leg-curl",
  "seated leg curl": "hamstrings/lever-seated-leg-curl",
  "hip thrust": "glutes/resistance-band-hip-thrusts-on-knees-female",
  "barbell hip thrust": "glutes/resistance-band-hip-thrusts-on-knees-female",
  "glute bridge": "glutes/barbell-glute-bridge",
  "calf raise": "calves/standing-calf-raises",
  "standing calf raise": "calves/standing-calf-raises",
  "seated calf raise": "calves/lever-seated-calf-raise",

  // Back / Vertical & Horizontal Pulls
  "pull up": "lats/pull-up",
  "pull-up": "lats/pull-up",
  "pullup": "lats/pull-up",
  "chin up": "lats/chin-up",
  "chin-up": "lats/chin-up",
  "lat pulldown": "lats/cable-pulldown",
  "cable lat pulldown": "lats/cable-pulldown",
  "pulldown": "lats/cable-pulldown",
  "barbell row": "lats/barbell-bent-over-row",
  "bent over row": "lats/barbell-bent-over-row",
  "pendlay row": "lats/barbell-pendlay-row",
  "dumbbell row": "lats/dumbbell-row",
  "db row": "lats/dumbbell-row",
  "single arm dumbbell row": "lats/dumbbell-one-arm-row",
  "cable row": "lats/cable-seated-row",
  "seated cable row": "lats/cable-seated-row",
  "seated row": "lats/cable-seated-row",
  "face pull": "delts/cable-rear-delt-row",
  "shrugs": "traps/barbell-shrug",
  "barbell shrug": "traps/barbell-shrug",
  "dumbbell shrug": "traps/dumbbell-shrug",

  // Shoulders / Deltoids
  "overhead press": "delts/barbell-seated-overhead-press",
  "barbell overhead press": "delts/barbell-seated-overhead-press",
  "ohp": "delts/barbell-seated-overhead-press",
  "military press": "delts/barbell-standing-close-grip-military-press",
  "shoulder press": "delts/dumbbell-seated-shoulder-press",
  "dumbbell shoulder press": "delts/dumbbell-seated-shoulder-press",
  "db shoulder press": "delts/dumbbell-seated-shoulder-press",
  "arnold press": "delts/dumbbell-arnold-press",
  "lateral raise": "delts/dumbbell-lateral-raise",
  "dumbbell lateral raise": "delts/dumbbell-lateral-raise",
  "side lateral raise": "delts/dumbbell-lateral-raise",
  "side raise": "delts/dumbbell-lateral-raise",
  "front raise": "delts/dumbbell-front-raise",
  "rear delt fly": "delts/dumbbell-seated-rear-lateral-raise",
  "reverse fly": "delts/dumbbell-seated-rear-lateral-raise",

  // Arms: Biceps & Triceps
  "bicep curl": "biceps/dumbbell-seated-bicep-curl",
  "biceps curl": "biceps/dumbbell-seated-bicep-curl",
  "dumbbell bicep curl": "biceps/dumbbell-seated-bicep-curl",
  "dumbbell curl": "biceps/dumbbell-seated-bicep-curl",
  "barbell curl": "biceps/barbell-curl",
  "ez bar curl": "biceps/ez-bar-biceps-curl",
  "hammer curl": "biceps/dumbbell-hammer-curl",
  "preacher curl": "biceps/barbell-preacher-curl",
  "concentration curl": "biceps/dumbbell-concentration-curl",
  "tricep pushdown": "triceps/cable-pushdown",
  "cable pushdown": "triceps/cable-pushdown",
  "triceps pushdown": "triceps/cable-pushdown",
  "tricep extension": "triceps/dumbbell-standing-triceps-extension",
  "skull crusher": "triceps/barbell-lying-triceps-extension-skull-crusher",
  "overhead tricep extension": "triceps/dumbbell-standing-triceps-extension",
  "tricep dip": "triceps/triceps-dip",

  // Core & Abs
  "plank": "abs/weighted-front-plank",
  "front plank": "abs/weighted-front-plank",
  "hanging leg raise": "abs/hanging-leg-raise",
  "leg raise": "abs/hanging-leg-raise",
  "ab wheel": "abs/ab-wheel-rollout",
  "rollout": "abs/ab-wheel-rollout",
  "crunch": "abs/cross-body-crunch",
  "crunches": "abs/cross-body-crunch",
  "russian twist": "abs/russian-twist",
};

/**
 * Intelligent exercise matcher: Given any exercise string (from workouts, user input, AI, or dropdown),
 * resolves to the most accurate ExerciseItem with animation URL and metadata.
 */
export function findExerciseMatch(rawName: string): ExerciseItem | null {
  if (!rawName || typeof rawName !== "string") return null;

  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  const normalized = normalizeExerciseName(trimmed);

  // 1. Direct ID match
  if (byId.has(trimmed)) return byId.get(trimmed)!;

  // 2. Direct Slug match
  if (bySlug.has(trimmed)) return bySlug.get(trimmed)!;

  // 3. Exact Canonical Alias match
  if (CANONICAL_ALIASES[lower] && byId.has(CANONICAL_ALIASES[lower])) {
    return byId.get(CANONICAL_ALIASES[lower])!;
  }

  // 4. Exact Lowercase Name match
  if (byLowerName.has(lower)) {
    return byLowerName.get(lower)!;
  }

  // 5. Exact Normalized Name match
  if (byNormalizedName.has(normalized)) {
    return byNormalizedName.get(normalized)!;
  }

  // 6. Strip rep/set/weight suffixes (e.g. "Barbell Bench Press 3x10 @ 225lbs" -> "barbell bench press")
  const stripped = lower
    .replace(/\b\d+\s*x\s*\d+(\s*-\s*\d+)?\b/gi, "")
    .replace(/@\s*\d+(\.\d+)?\s*(lbs|kg)?/gi, "")
    .replace(/\(\d+.*?\)/g, "")
    .trim();

  if (stripped !== lower) {
    if (CANONICAL_ALIASES[stripped] && byId.has(CANONICAL_ALIASES[stripped])) {
      return byId.get(CANONICAL_ALIASES[stripped])!;
    }
    if (byLowerName.has(stripped)) {
      return byLowerName.get(stripped)!;
    }
    const strippedNorm = normalizeExerciseName(stripped);
    if (byNormalizedName.has(strippedNorm)) {
      return byNormalizedName.get(strippedNorm)!;
    }
  }

  // 7. Check if canonical alias is contained inside the string
  for (const [alias, id] of Object.entries(CANONICAL_ALIASES)) {
    if (lower.includes(alias) && byId.has(id)) {
      return byId.get(id)!;
    }
  }

  // 8. Word-based token scoring
  const words = lower.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (words.length > 0) {
    const candidates = ALL_EXERCISES.filter((ex) => {
      const exName = ex.name.toLowerCase();
      return words.every((w) => exName.includes(w));
    });

    if (candidates.length > 0) {
      // Prioritize standard barbell/dumbbell/bodyweight compound equipment over bands
      candidates.sort((a, b) => {
        const priorityEquipment = ["barbell", "dumbbell", "bodyweight", "lever", "cable"];
        const aScore = priorityEquipment.indexOf(a.equipment.toLowerCase());
        const bScore = priorityEquipment.indexOf(b.equipment.toLowerCase());
        const aRank = aScore >= 0 ? aScore : 99;
        const bRank = bScore >= 0 ? bScore : 99;
        if (aRank !== bRank) return aRank - bRank;
        return a.name.length - b.name.length;
      });
      return candidates[0];
    }
  }

  // 9. Root category fallback
  if (lower.includes("bench") || lower.includes("chest press")) return byId.get(CANONICAL_ALIASES["bench press"])!;
  if (lower.includes("squat")) return byId.get(CANONICAL_ALIASES["squat"])!;
  if (lower.includes("deadlift") || lower.includes("hinge")) return byId.get(CANONICAL_ALIASES["deadlift"])!;
  if (lower.includes("pull up") || lower.includes("pullup")) return byId.get(CANONICAL_ALIASES["pull up"])!;
  if (lower.includes("curl")) return byId.get(CANONICAL_ALIASES["bicep curl"])!;
  if (lower.includes("press")) return byId.get(CANONICAL_ALIASES["overhead press"])!;
  if (lower.includes("row")) return byId.get(CANONICAL_ALIASES["barbell row"])!;
  if (lower.includes("lunge")) return byId.get(CANONICAL_ALIASES["lunge"])!;

  // Default fallback to Bench Press if completely unmatchable
  return ALL_EXERCISES[0] || null;
}

export interface SearchExerciseOptions {
  query?: string;
  muscle?: string;
  equipment?: string;
  bodyPart?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fast search and filter over the 1,323 exercise catalog
 */
export function searchExercises(options: SearchExerciseOptions = {}) {
  const {
    query = "",
    muscle = "",
    equipment = "",
    bodyPart = "",
    category = "",
    limit = 50,
    offset = 0,
  } = options;

  const q = query.trim().toLowerCase();
  const m = muscle.trim().toLowerCase();
  const eq = equipment.trim().toLowerCase();
  const bp = bodyPart.trim().toLowerCase();
  const cat = category.trim().toLowerCase();

  const filtered = ALL_EXERCISES.filter((ex) => {
    if (q && !ex.name.toLowerCase().includes(q) && !ex.muscle.toLowerCase().includes(q) && !ex.equipment.toLowerCase().includes(q)) {
      return false;
    }
    if (m && m !== "all" && ex.muscle.toLowerCase() !== m) {
      return false;
    }
    if (eq && eq !== "all" && ex.equipment.toLowerCase() !== eq) {
      return false;
    }
    if (bp && bp !== "all" && ex.bodyPart.toLowerCase() !== bp) {
      return false;
    }
    if (cat && cat !== "all" && ex.category.toLowerCase() !== cat) {
      return false;
    }
    return true;
  });

  return {
    total: filtered.length,
    exercises: filtered.slice(offset, offset + limit),
    limit,
    offset,
  };
}

// Cached Unique Filters
export function getAvailableMuscles(): string[] {
  return Array.from(new Set(ALL_EXERCISES.map((e) => e.muscle))).sort();
}

export function getAvailableEquipment(): string[] {
  return Array.from(new Set(ALL_EXERCISES.map((e) => e.equipment))).sort();
}

export function getAvailableBodyParts(): string[] {
  return Array.from(new Set(ALL_EXERCISES.map((e) => e.bodyPart))).sort();
}
