import { EXERCISE_LIBRARY } from "@/app/dashboard/utils/exerciseLibrary";

export interface ParsedSet {
  weight: number;
  reps: number;
  notes?: string;
}

export interface ParsedExercise {
  name: string;
  category?: string;
  sets: ParsedSet[];
}

export interface ParsedWorkoutSession {
  date: string; // YYYY-MM-DD or ISO string
  title?: string;
  notes?: string;
  clientId?: string;
  clientName?: string;
  exercises: ParsedExercise[];
}

/**
 * Intelligent SMS / Free-Text Workout Parser.
 * Converts messy text messages, Android SMS logs, WhatsApp chats, or notes into structured workout sessions.
 */
export function parseSMSWorkoutText(
  rawText: string,
  defaultDate?: string,
  knownClients?: { id: string; name: string }[]
): ParsedWorkoutSession[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sessions: ParsedWorkoutSession[] = [];

  let currentClientName: string | undefined;
  let currentClientId: string | undefined;

  let currentSession: ParsedWorkoutSession | null = null;
  let currentExercise: ParsedExercise | null = null;

  const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:,? \d{4})?|\b(?:yesterday|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i;

  const splitDividers = /^[\-=_*]{3,}$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line indicates a client name
    const clientHeaderMatch = line.match(/^(?:client|athlete|name|for|to):\s*([a-z0-9\s\-'.]+)$/i) ||
      line.match(/^\[([a-z0-9\s\-'.]+)\]$/i);

    let matchedKnownClient = knownClients?.find(
      (c) => c.name.trim().toLowerCase() === line.trim().toLowerCase()
    );

    if (clientHeaderMatch || matchedKnownClient) {
      const detectedName = matchedKnownClient ? matchedKnownClient.name : clientHeaderMatch![1].trim();
      const detectedId = matchedKnownClient
        ? matchedKnownClient.id
        : knownClients?.find((c) => c.name.trim().toLowerCase() === detectedName.toLowerCase())?.id;

      currentClientName = detectedName;
      currentClientId = detectedId;

      if (currentSession && currentSession.exercises.length === 0) {
        currentSession.clientName = currentClientName;
        currentSession.clientId = currentClientId;
      }
      continue;
    }

    // Check if line contains a new date indicator or section divider
    const isDivider = splitDividers.test(line);
    const dateMatch = line.match(dateRegex);

    const isNewDateHeader = dateMatch && (
      line.length < 50 ||
      line.toLowerCase().includes("workout") ||
      line.toLowerCase().includes("session") ||
      line.toLowerCase().includes("day") ||
      line.includes(":") ||
      line.includes("-")
    );

    if (isNewDateHeader || isDivider) {
      if (currentSession && currentSession.exercises.length > 0) {
        sessions.push(currentSession);
      }

      let parsedDate = defaultDate || new Date().toISOString().split("T")[0];
      let title = "Workout Session";

      if (dateMatch) {
        parsedDate = normalizeDateString(dateMatch[0]);
        // Everything after the date might be the title
        const afterDate = line.replace(dateMatch[0], "").replace(/^[\s:\-\–—]+/, "").trim();
        if (afterDate.length > 2) {
          title = afterDate;
        }
      }

      currentSession = {
        date: parsedDate,
        title,
        notes: "",
        clientId: currentClientId,
        clientName: currentClientName,
        exercises: [],
      };
      currentExercise = null;
      if (isDivider) continue;
      if (isNewDateHeader && !line.includes("x") && !line.includes("@")) continue;
    }

    if (!currentSession) {
      currentSession = {
        date: defaultDate || new Date().toISOString().split("T")[0],
        title: "Imported Session",
        notes: "",
        clientId: currentClientId,
        clientName: currentClientName,
        exercises: [],
      };
    }

    // Try parsing as an exercise line with sets & reps
    const parsedEx = parseExerciseLine(line);

    if (parsedEx) {
      currentSession.exercises.push(parsedEx);
      currentExercise = parsedEx;
    } else if (line.toLowerCase().startsWith("notes:") || line.toLowerCase().startsWith("note:")) {
      const noteText = line.replace(/^notes?:/i, "").trim();
      currentSession.notes = currentSession.notes ? `${currentSession.notes}; ${noteText}` : noteText;
    } else if (currentExercise && (line.toLowerCase().startsWith("set") || /^\d+[\s\-\–x@]/i.test(line))) {
      // Sub-set line for current exercise (e.g. "Set 2: 225 x 5")
      const additionalSets = parseAdditionalSets(line);
      if (additionalSets.length > 0) {
        currentExercise.sets.push(...additionalSets);
      }
    } else if (line.length > 3 && !line.includes("@") && !line.includes("x")) {
      // Could be a session note or comment (e.g. "Felt great, good pump")
      if (currentSession.exercises.length > 0) {
        currentSession.notes = currentSession.notes ? `${currentSession.notes}. ${line}` : line;
      }
    }
  }

  if (currentSession && currentSession.exercises.length > 0) {
    sessions.push(currentSession);
  }

  return sessions;
}

/**
 * Parse a single line like:
 * "Bench press 4x8 @ 185, 205, 215, 225"
 * "Squats 3x5 315lbs"
 * "Incline DB Press: 3x10 with 65s"
 * "Deadlift 1x5 @ 405 (heavy)"
 */
export function parseExerciseLine(line: string): ParsedExercise | null {
  const clean = line.trim().replace(/^[\*\-\•\d+\.]+\s*/, ""); // remove bullet points or numbers

  // Match pattern: <Exercise Name> <Sets>x<Reps> [@ or with] <Weights>
  // e.g. "Bench Press 4x8 @ 225" or "Barbell Squat: 3 sets of 5 at 315"
  const setRepWeightPattern = /(.*?)(?::|\s+)?(?:\b(\d+)\s*(?:sets?\s*(?:of|x)?|\s*x\s*)\s*(\d+)(?:\s*reps?)?)\s*(?:@|with|at|\s+)?\s*([0-9\s,\.\/\\+lbss]+)?(?:\((.*?)\))?$/i;

  const match = clean.match(setRepWeightPattern);

  if (match) {
    let rawName = match[1].trim();
    const setCount = parseInt(match[2], 10) || 1;
    const repCount = parseInt(match[3], 10) || 8;
    const rawWeights = match[4]?.trim() || "";
    const notes = match[5]?.trim() || "";

    if (!rawName || rawName.toLowerCase() === "set" || rawName.length < 2) {
      return null;
    }

    const matchedName = matchToExerciseLibrary(rawName);
    const sets: ParsedSet[] = [];

    // Check if multiple individual weights were provided (e.g. "185, 205, 215, 225")
    const weightTokens = rawWeights.split(/[,/+\s]+/).map((t) => parseFloat(t.replace(/[^0-9.]/g, ""))).filter((n) => !isNaN(n) && n > 0);

    if (weightTokens.length > 1) {
      for (let s = 0; s < Math.max(setCount, weightTokens.length); s++) {
        const weight = weightTokens[s] !== undefined ? weightTokens[s] : weightTokens[weightTokens.length - 1];
        sets.push({ weight, reps: repCount, notes: s === 0 && notes ? notes : undefined });
      }
    } else {
      const singleWeight = weightTokens.length === 1 ? weightTokens[0] : 0;
      for (let s = 0; s < setCount; s++) {
        sets.push({ weight: singleWeight, reps: repCount, notes: s === 0 && notes ? notes : undefined });
      }
    }

    return {
      name: matchedName,
      sets: sets.length > 0 ? sets : [{ weight: 0, reps: repCount, notes }],
    };
  }

  // Fallback simple pattern: "Barbell Bench Press - 225 lbs x 5 reps"
  const simpleMatch = clean.match(/(.*?)\s*[\-–—:]\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*x\s*(\d+)/i);
  if (simpleMatch) {
    const rawName = simpleMatch[1].trim();
    const weight = parseFloat(simpleMatch[2]) || 0;
    const reps = parseInt(simpleMatch[3], 10) || 5;
    return {
      name: matchToExerciseLibrary(rawName),
      sets: [{ weight, reps }],
    };
  }

  return null;
}

/**
 * Parses sub-set lines like "Set 2: 225 x 5 (felt smooth)"
 */
function parseAdditionalSets(line: string): ParsedSet[] {
  const match = line.match(/(?:set\s*\d+[:\s]*)?(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*x\s*(\d+)(?:\s*\((.*?)\))?/i);
  if (match) {
    return [{
      weight: parseFloat(match[1]) || 0,
      reps: parseInt(match[2], 10) || 8,
      notes: match[3]?.trim(),
    }];
  }
  return [];
}

/**
 * Maps informal user names (e.g. "db bench", "rdl", "lat pull", "ohp", "leg press") to canonical library names.
 */
export function matchToExerciseLibrary(rawName: string): string {
  const clean = rawName.trim();
  const lower = clean.toLowerCase();

  const aliases: Record<string, string> = {
    "bench": "Barbell Bench Press",
    "bench press": "Barbell Bench Press",
    "flat bench": "Barbell Bench Press",
    "db bench": "Dumbbell Bench Press",
    "incline bench": "Incline Barbell Bench Press",
    "incline db": "Incline Dumbbell Press",
    "incline db press": "Incline Dumbbell Press",
    "squat": "Barbell Squat",
    "squats": "Barbell Squat",
    "back squat": "Barbell Squat",
    "front squat": "Front Squat",
    "deadlift": "Barbell Deadlift",
    "deadlifts": "Barbell Deadlift",
    "rdl": "Romanian Deadlift",
    "rdls": "Romanian Deadlift",
    "db rdl": "Dumbbell Romanian Deadlift",
    "ohp": "Overhead Press",
    "shoulder press": "Overhead Press",
    "db shoulder press": "Dumbbell Shoulder Press",
    "lat pull": "Lat Pulldown",
    "lat pulldown": "Lat Pulldown",
    "pullups": "Pull-Up",
    "pull up": "Pull-Up",
    "pull ups": "Pull-Up",
    "chin ups": "Chin-Up",
    "bb row": "Barbell Bent-Over Row",
    "barbell row": "Barbell Bent-Over Row",
    "db row": "Single-Arm Dumbbell Row",
    "cable row": "Seated Cable Row",
    "bicep curl": "Barbell Curl",
    "bicep curls": "Dumbbell Bicep Curl",
    "curls": "Dumbbell Bicep Curl",
    "hammer curl": "Hammer Curl",
    "hammer curls": "Hammer Curl",
    "tricep pushdown": "Tricep Pushdown",
    "triceps": "Tricep Pushdown",
    "dips": "Dips",
    "leg press": "Leg Press",
    "leg ext": "Leg Extension",
    "leg extensions": "Leg Extension",
    "leg curls": "Hamstring Leg Curl",
    "hamstring curls": "Hamstring Leg Curl",
    "hip thrust": "Barbell Hip Thrust",
    "hip thrusts": "Barbell Hip Thrust",
    "calves": "Standing Calf Raise",
    "calf raises": "Standing Calf Raise",
  };

  if (aliases[lower]) return aliases[lower];

  // Search EXERCISE_LIBRARY for close match
  const found = EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === lower || e.name.toLowerCase().includes(lower));
  if (found) return found.name;

  // Return capitalized name
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Normalizes dates like "8/12", "Aug 15", "yesterday", "2026-08-10" to "YYYY-MM-DD"
 */
export function normalizeDateString(dateStr: string): string {
  const clean = dateStr.trim().toLowerCase();
  const today = new Date();

  if (clean === "today") return today.toISOString().split("T")[0];
  if (clean === "yesterday") {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return y.toISOString().split("T")[0];
  }

  // Check MM/DD or MM/DD/YYYY
  const slashMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
  if (slashMatch) {
    const m = parseInt(slashMatch[1], 10);
    const d = parseInt(slashMatch[2], 10);
    let y = slashMatch[3] ? parseInt(slashMatch[3], 10) : today.getFullYear();
    if (y < 100) y += 2000;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    // If year wasn't specified and parsed into 2001 or old year, default to current year
    if (parsed.getFullYear() < 2020) parsed.setFullYear(today.getFullYear());
    return parsed.toISOString().split("T")[0];
  }

  return today.toISOString().split("T")[0];
}
