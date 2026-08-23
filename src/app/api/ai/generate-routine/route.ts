export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface GeneratedExercise {
  name: string;
  category: "STRENGTH" | "BODYWEIGHT" | "CARDIO";
  isBodyweight: boolean;
  targetSets: number;
  targetReps: string;
  suggestedWeight: number;
  restSeconds: number;
  coachingCue: string;
}

export interface GeneratedRoutine {
  routineName: string;
  goal: string;
  level: string;
  focus: string;
  estimatedDurationMinutes: number;
  warmupInstructions: string[];
  exercises: GeneratedExercise[];
  recoveryTips: string[];
}

const TEMPLATES: Record<string, Record<string, GeneratedExercise[]>> = {
  STRENGTH: {
    "Upper Body Push": [
      { name: "Barbell Bench Press", category: "STRENGTH", isBodyweight: false, targetSets: 4, targetReps: "5", suggestedWeight: 185, restSeconds: 180, coachingCue: "Keep shoulders packed, drive heels into the floor" },
      { name: "Overhead Barbell Press", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "6", suggestedWeight: 115, restSeconds: 120, coachingCue: "Squeeze glutes to lock spine, push head forward at lockout" },
      { name: "Incline Dumbbell Press", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "8", suggestedWeight: 65, restSeconds: 90, coachingCue: "Control eccentric lowering for 3 seconds" },
      { name: "Dips", category: "BODYWEIGHT", isBodyweight: true, targetSets: 3, targetReps: "10-12", suggestedWeight: 0, restSeconds: 90, coachingCue: "Slight forward torso lean to emphasize lower chest" },
      { name: "Triceps Pushdown", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "12", suggestedWeight: 50, restSeconds: 60, coachingCue: "Keep elbows pinned to ribs" }
    ],
    "Lower Body Heavy": [
      { name: "Barbell Back Squat", category: "STRENGTH", isBodyweight: false, targetSets: 4, targetReps: "5", suggestedWeight: 225, restSeconds: 180, coachingCue: "Brace core 360 degrees, spread the floor with feet" },
      { name: "Romanian Deadlift", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "8", suggestedWeight: 185, restSeconds: 120, coachingCue: "Hinge hips back till hamstring stretch is felt" },
      { name: "Leg Press", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "10", suggestedWeight: 360, restSeconds: 90, coachingCue: "Do not lock knees aggressively at top" },
      { name: "Leg Extension", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "12-15", suggestedWeight: 130, restSeconds: 60, coachingCue: "Pause at peak contraction for 1 count" },
      { name: "Calf Raise", category: "STRENGTH", isBodyweight: false, targetSets: 4, targetReps: "15", suggestedWeight: 140, restSeconds: 45, coachingCue: "Full stretch at bottom, high rise on toes" }
    ]
  },
  HYPERTROPHY: {
    "Push / Chest & Shoulders": [
      { name: "Dumbbell Bench Press", category: "STRENGTH", isBodyweight: false, targetSets: 4, targetReps: "8-10", suggestedWeight: 75, restSeconds: 90, coachingCue: "Deep stretch at bottom, contract pecs hard at top" },
      { name: "Incline Barbell Bench", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "8-10", suggestedWeight: 155, restSeconds: 90, coachingCue: "Touch upper clavicle region smoothly" },
      { name: "Dumbbell Lateral Raise", category: "STRENGTH", isBodyweight: false, targetSets: 4, targetReps: "12-15", suggestedWeight: 25, restSeconds: 60, coachingCue: "Lead with elbows, slight forward chest lean" },
      { name: "Cable Chest Fly", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "12-15", suggestedWeight: 35, restSeconds: 60, coachingCue: "Hug the tree, maintain soft bend in elbows" },
      { name: "Overhead Rope Extension", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "12-15", suggestedWeight: 45, restSeconds: 60, coachingCue: "Full stretch on long head of triceps" }
    ],
    "Pull / Back & Biceps": [
      { name: "Lat Pulldown (Close Grip)", category: "STRENGTH", isBodyweight: false, targetSets: 4, targetReps: "8-10", suggestedWeight: 135, restSeconds: 90, coachingCue: "Pull elbows straight down into back pockets" },
      { name: "Chest Supported Dumbbell Row", category: "STRENGTH", isBodyweight: false, targetSets: 4, targetReps: "10-12", suggestedWeight: 60, restSeconds: 90, coachingCue: "Squeeze shoulder blades together at apex" },
      { name: "Hyperextensions (Back Extension)", category: "BODYWEIGHT", isBodyweight: true, targetSets: 3, targetReps: "15", suggestedWeight: 0, restSeconds: 60, coachingCue: "Engage glutes and posterior chain at top" },
      { name: "Incline Dumbbell Curl", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "10-12", suggestedWeight: 30, restSeconds: 60, coachingCue: "Keep upper arms perpendicular to floor" },
      { name: "Hammer Curls", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "12-15", suggestedWeight: 35, restSeconds: 60, coachingCue: "Palms facing each other to target brachialis" }
    ]
  },
  BODYWEIGHT: {
    "Calisthenics & Core": [
      { name: "Push-ups", category: "BODYWEIGHT", isBodyweight: true, targetSets: 4, targetReps: "15-20", suggestedWeight: 0, restSeconds: 60, coachingCue: "Straight plank line, chest touches ground" },
      { name: "Pull-ups", category: "BODYWEIGHT", isBodyweight: true, targetSets: 4, targetReps: "8-10", suggestedWeight: 0, restSeconds: 90, coachingCue: "Full dead hang to chin clearly over the bar" },
      { name: "Bodyweight Squats", category: "BODYWEIGHT", isBodyweight: true, targetSets: 4, targetReps: "20-25", suggestedWeight: 0, restSeconds: 60, coachingCue: "Break parallel on every single rep" },
      { name: "Hanging Leg Raises", category: "BODYWEIGHT", isBodyweight: true, targetSets: 3, targetReps: "12-15", suggestedWeight: 0, restSeconds: 60, coachingCue: "Avoid swinging, curl pelvis upwards" },
      { name: "Plank Hold", category: "BODYWEIGHT", isBodyweight: true, targetSets: 3, targetReps: "60 sec", suggestedWeight: 0, restSeconds: 45, coachingCue: "Tuck pelvis and contract abdominals continuously" }
    ]
  }
};

import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.AI);
    if (rateCheck.limited && rateCheck.response) {
      return rateCheck.response;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.sessionType === "MOBILITY") {
      const {
        muscleGroups = ["Full Body"],
        routineType = "warmup",
        durationMinutes = 10,
        perStretchSeconds = 60,
      } = body;

      const isWarmup = routineType === "warmup";
      const isCooldown = routineType === "cooldown";
      const typeLabel = isWarmup ? "Dynamic Warm-Up" : isCooldown ? "Post-Workout Cool-Down" : "Recovery Protocol";

      // Comprehensive pool of targeted mobility and stretching movements
      const movementPool: Record<string, Array<{ name: string; cue: string; sides?: "left_right" | "none" }>> = {
        Chest: [
          { name: "Doorway Pec Stretch", cue: "Forearms on door frame, step forward until deep stretch is felt in mid & upper chest", sides: "left_right" },
          { name: "Chest Opener with Hand Clasp", cue: "Interlace fingers behind lower back, peel shoulder blades back and downwards", sides: "none" },
          { name: "Floor Pec Stretch (Scorpion)", cue: "Lie prone, extend arm at 90 degrees, roll body gently away from arm", sides: "left_right" },
          { name: "High-Angle Corner Chest Stretch", cue: "Place hands high on wall or corner, lean chest in to target lower pec fibers", sides: "none" },
          { name: "Foam Roller Thoracic Pec Angels", cue: "Lie spine on foam roller, open arms wide in snow-angel motion", sides: "none" },
          { name: "Cross-Body Hug & Chest Expansion", cue: "Dynamic rhythmic opening and hugging across chest with controlled breathing", sides: "none" },
          { name: "Pec Minor Wall Slide Stretch", cue: "Elbow at 135 degrees against wall, rotate torso away gently", sides: "left_right" },
          { name: "Prone Y-Reach Chest Elevation", cue: "Prone on floor, reach arms in Y-shape, lift chest and stretch anterior chain", sides: "none" },
        ],
        Back: [
          { name: "Cat-Cow Dynamic Spine Flow", cue: "Inhale to arch spine and drop belly, exhale to round upper back toward ceiling", sides: "none" },
          { name: "Child's Pose with Lat Reach", cue: "Sink hips back onto heels, walk hands diagonally to stretch lats deeply", sides: "left_right" },
          { name: "Thoracic Spine Rotations", cue: "On all fours, hand behind head, rotate elbow up toward ceiling", sides: "left_right" },
          { name: "Thread the Needle Stretch", cue: "Slide arm underneath torso to open upper back and posterior shoulder", sides: "left_right" },
          { name: "Standing Lat & Side Body Reach", cue: "Cross feet, grasp wrist overhead, lean to the side to lengthen latissimus", sides: "left_right" },
          { name: "Puppy Dog T-Spine Opener", cue: "Hips over knees, walk hands forward, melt chest to floor", sides: "none" },
          { name: "Seated Spinal Twist", cue: "Sit upright, cross leg over, gently twist torso looking over back shoulder", sides: "left_right" },
          { name: "Prone Cobra Lumbar Extension", cue: "Lie face down, lift chest, externally rotate arms, pinch lower traps", sides: "none" },
        ],
        Shoulders: [
          { name: "Cross-Body Posterior Deltoid Stretch", cue: "Gently pull arm across chest with opposite forearm, keep shoulder depressed", sides: "left_right" },
          { name: "Overhead Triceps & Shoulder Stretch", cue: "Reach hand down spine, gently guide elbow back and inward", sides: "left_right" },
          { name: "Arm Circles & Dynamic Hugs", cue: "Start small, expand to large circles, reverse direction halfway", sides: "none" },
          { name: "Wall Angels Mobility Slide", cue: "Back flat against wall, glide arms up and down keeping elbows touching", sides: "none" },
          { name: "Sleeper Stretch (Internal Rotation)", cue: "Lie on side, gently press wrist toward floor with elbow at 90 degrees", sides: "left_right" },
          { name: "Eagle Arms Scapular Spread", cue: "Wrap arms at elbows and wrists, lift elbows to shoulder height", sides: "left_right" },
          { name: "Prone Swimmer Hover Holds", cue: "Move hands behind head, extend and rotate to lower back without touching floor", sides: "none" },
          { name: "Band Dislocates / Broomstick Reach", cue: "Wide grip on band or stick, rotate overhead behind back smoothly", sides: "none" },
        ],
        Arms: [
          { name: "Biceps Wall Extension Stretch", cue: "Place palm flat on wall at shoulder height, rotate torso away", sides: "left_right" },
          { name: "Wrist Flexor & Extensor Stretch", cue: "Extend arm with palm facing up then down, gently apply tension", sides: "left_right" },
          { name: "Overhead Triceps Stretch", cue: "Pull elbow back behind head, breathe deeply into lat and triceps", sides: "left_right" },
          { name: "Forearm Pronator / Supinator Flow", cue: "Rotate palms smoothly from ceiling to floor with arms extended", sides: "none" },
          { name: "Reverse Tabletop Biceps Opener", cue: "Hands behind hips on floor, press chest up to stretch biceps and front delts", sides: "none" },
          { name: "Cross-Chest Triceps Lock", cue: "Hook forearm around opposite arm, squeeze tricep gently", sides: "left_right" },
        ],
        Legs: [
          { name: "Standing Quad & Hip Flexor Stretch", cue: "Grab ankle, pull heel toward glute, tuck pelvis forward", sides: "left_right" },
          { name: "Hamstring Sweep & Fold", cue: "Hinge at hips with flat back until stretch is felt in posterior thigh", sides: "none" },
          { name: "Low Lunge with Overhead Reach", cue: "Step into deep lunge, drop back knee, reach opposite arm overhead", sides: "left_right" },
          { name: "Standing Calf & Achilles Stretch", cue: "Press back heel into floor with straight back leg, lean into wall", sides: "left_right" },
          { name: "Half-Kneeling Hamstring Stretch", cue: "Front leg straight, flex foot, hinge forward from hips with flat spine", sides: "left_right" },
          { name: "Adductor Frog Stretch", cue: "Knees wide on floor, feet turned out, rock hips gently backwards", sides: "none" },
          { name: "Cossack Squat Dynamic Flow", cue: "Shift weight laterally from side to side, keeping heel grounded", sides: "left_right" },
          { name: "Seated Butterfly Adductor Stretch", cue: "Soles of feet together, knees dropped wide, gently press knees down", sides: "none" },
        ],
        Glutes: [
          { name: "Pigeon Pose Glute Stretch", cue: "Front shin angled, square hips to floor, breathe into outer hip", sides: "left_right" },
          { name: "Figure-4 Supine Glute Stretch", cue: "Ankle over opposite knee, pull thigh toward chest", sides: "left_right" },
          { name: "90/90 Hip Switches", cue: "Sit with legs in 90-degree angles, rotate knees smoothly from side to side", sides: "left_right" },
          { name: "Seated Piriformis Cross-Leg Stretch", cue: "Cross leg, hug knee toward opposite shoulder, sit tall", sides: "left_right" },
          { name: "Pretzel Stretch (Hip + Quad)", cue: "Lie on side, hold bottom foot and top knee, rotate shoulders flat", sides: "left_right" },
          { name: "Lying Knee-to-Chest Glute Hug", cue: "Lie on back, hug knee to chest and pull slightly across midline", sides: "left_right" },
        ],
        Core: [
          { name: "Cobra / Sphinx Abdominal Stretch", cue: "Press palms into floor, gently extend spine keeping hips grounded", sides: "none" },
          { name: "Supine Spinal Twist", cue: "Lie on back, drop bent knee across body while keeping opposite shoulder down", sides: "left_right" },
          { name: "Bird-Dog Core Stability Holds", cue: "Extend opposite arm and leg, hold for 2 seconds, brace core", sides: "left_right" },
          { name: "Side Plank Reach & Thread", cue: "Hold side plank, reach top arm under torso and open to ceiling", sides: "left_right" },
          { name: "Deadbug Breathing Extension", cue: "Lower opposite arm and leg slowly, keep lower back pressed to floor", sides: "left_right" },
          { name: "Kneeling Side-Bend QL Stretch", cue: "One knee down, reach opposite arm overhead and bend sideways", sides: "left_right" },
        ],
        "Full Body": [
          { name: "World's Greatest Stretch", cue: "Lunge forward, place inside elbow to instep, then rotate arm to ceiling", sides: "left_right" },
          { name: "Deep Squat with T-Spine Rotation", cue: "Hold bottom of squat, grasp opposite ankle and rotate chest open", sides: "left_right" },
          { name: "Inchworm to Cobra Walkout", cue: "Walk hands out into push-up position, drop hips into cobra, walk feet in", sides: "none" },
          { name: "Downward Dog to Upward Dog Flow", cue: "Flow between pedal calf stretch and upward facing dog", sides: "none" },
          { name: "Standing Forward Fold with Shoulder Rinse", cue: "Fold over legs, interlace fingers overhead, breathe deeply", sides: "none" },
          { name: "Scorpion Stretch (Chest & Hip)", cue: "Lie prone, kick foot across body to opposite hand", sides: "left_right" },
          { name: "Spiderman Lunge with Hip Circles", cue: "Deep runner's lunge, draw gentle circles with hips to mobilize hip joints", sides: "left_right" },
          { name: "Cat-Cow to Child's Pose Flow", cue: "Flow dynamically through spine flexion, extension, and hip relaxation", sides: "none" },
        ],
      };

      // Calculate exact number of stretches needed for target duration
      const totalSecondsRequested = durationMinutes * 60;
      const targetCount = Math.max(2, Math.min(25, Math.round(totalSecondsRequested / perStretchSeconds)));

      const targets = muscleGroups.includes("Full Body")
        ? ["Full Body", "Chest", "Back", "Legs", "Glutes", "Shoulders", "Core"]
        : muscleGroups;

      const selectedList: Array<{ name: string; duration: number; cue: string; sides?: "left_right" | "none" }> = [];

      // Pass 1: Primary target muscle group pools
      targets.forEach((mg: string) => {
        const pool = movementPool[mg] || movementPool["Full Body"];
        pool.forEach((m) => {
          if (!selectedList.find((x) => x.name === m.name)) {
            selectedList.push({ ...m, duration: perStretchSeconds });
          }
        });
      });

      // Pass 2: If we still need more stretches to fill the duration, draw from Full Body and synergistic pools
      const fallbackOrder = ["Full Body", "Back", "Legs", "Chest", "Shoulders", "Glutes", "Core", "Arms"];
      for (const fb of fallbackOrder) {
        if (selectedList.length >= targetCount) break;
        const pool = movementPool[fb];
        if (pool) {
          pool.forEach((m) => {
            if (selectedList.length < targetCount && !selectedList.find((x) => x.name === m.name)) {
              selectedList.push({ ...m, duration: perStretchSeconds });
            }
          });
        }
      }

      // Pick exact number of stretches to fulfill the chosen duration
      const chosenMovements = selectedList.slice(0, targetCount);

      const routine = {
        name: `AI ${typeLabel} (${targets.slice(0, 3).join(", ")})`,
        durationBadge: `~${durationMinutes} min (${chosenMovements.length} × ${perStretchSeconds >= 60 ? `${perStretchSeconds / 60}m` : `${perStretchSeconds}s`})`,
        description: `Complete ${durationMinutes}-minute ${typeLabel.toLowerCase()} with ${chosenMovements.length} targeted stretches (${perStretchSeconds}s each) for ${targets.join(", ")}.`,
        muscleGroups: targets,
        movements: chosenMovements,
      };

      return NextResponse.json({ success: true, routine });
    }

    const {
      prompt = "",
      goal = "HYPERTROPHY", // HYPERTROPHY, STRENGTH, BODYWEIGHT, ATHLETIC
      split = "Upper Body Push",
      experienceLevel = "Intermediate",
      availableTimeMinutes = 60,
      equipment = "Full Gym"
    } = body;

    const rawPrompt = (prompt || "").trim();
    const normPrompt = rawPrompt.toLowerCase();

    // If free-text prompt is provided, dynamically construct the routine on the fly!
    if (rawPrompt) {
      // 1. Detect duration from prompt if mentioned (e.g. "45 min", "30 mins", "1 hour", "75m")
      let detectedMinutes = availableTimeMinutes;
      const minMatch = normPrompt.match(/(\d+)\s*(?:min|minute|m\b)/i);
      const hrMatch = normPrompt.match(/(\d+)\s*(?:hr|hour|h\b)/i);
      if (minMatch && minMatch[1]) {
        detectedMinutes = Math.min(120, Math.max(15, parseInt(minMatch[1], 10)));
      } else if (hrMatch && hrMatch[1]) {
        detectedMinutes = Math.min(120, Math.max(15, parseInt(hrMatch[1], 10) * 60));
      }

      // 2. Detect equipment constraints from prompt
      const isDumbbellOnly = normPrompt.includes("dumbbell") && !normPrompt.includes("barbell") && !normPrompt.includes("cable");
      const isBodyweightOnly = normPrompt.includes("calisthenic") || normPrompt.includes("bodyweight") || normPrompt.includes("hotel") || normPrompt.includes("no equipment");
      const isBarbellHeavy = normPrompt.includes("barbell") || normPrompt.includes("heavy") || normPrompt.includes("powerlifting");

      // 3. Detect goal / intensity from prompt
      const isStrength = normPrompt.includes("strength") || normPrompt.includes("heavy") || normPrompt.includes("1rm") || normPrompt.includes("power");
      const isBurnout = normPrompt.includes("burnout") || normPrompt.includes("hiit") || normPrompt.includes("pump") || normPrompt.includes("endurance");
      const isAthletic = normPrompt.includes("athletic") || normPrompt.includes("explosive") || normPrompt.includes("plyo") || normPrompt.includes("jump");

      const resolvedGoal = isStrength ? "STRENGTH" : isBodyweightOnly ? "BODYWEIGHT" : isAthletic ? "ATHLETIC" : "HYPERTROPHY";

      // 4. Determine target volume based on duration
      const targetExerciseCount = detectedMinutes <= 30 ? 4 : detectedMinutes <= 45 ? 5 : detectedMinutes <= 60 ? 6 : 7;
      const defaultSets = isStrength ? 4 : isBurnout ? 3 : 3;
      const defaultReps = isStrength ? "5-6" : isBurnout ? "15-20" : "8-12";
      const defaultRest = isStrength ? 120 : isBurnout ? 45 : 75;

      // 5. Select exercises matching requested muscle groups & movements
      const dynamicExercises: GeneratedExercise[] = [];
      const addedNames = new Set<string>();

      const addExercise = (
        name: string,
        category: "STRENGTH" | "BODYWEIGHT" | "CARDIO",
        isBw: boolean,
        sets: number,
        reps: string,
        weight: number,
        rest: number,
        cue: string
      ) => {
        if (!addedNames.has(name.toLowerCase()) && dynamicExercises.length < targetExerciseCount) {
          addedNames.add(name.toLowerCase());
          dynamicExercises.push({
            name,
            category,
            isBodyweight: isBw,
            targetSets: sets,
            targetReps: reps,
            suggestedWeight: experienceLevel === "Beginner" ? Math.round(weight * 0.65) : experienceLevel === "Advanced" ? Math.round(weight * 1.25) : weight,
            restSeconds: rest,
            coachingCue: cue,
          });
        }
      };

      // Chest & Triceps
      if (normPrompt.includes("chest") || normPrompt.includes("pec") || normPrompt.includes("push") || normPrompt.includes("bench")) {
        if (isBodyweightOnly) {
          addExercise("Push-Up", "BODYWEIGHT", true, defaultSets, "15-20", 0, defaultRest, "Rigid plank line, full chest-to-floor depth");
          addExercise("Chest Dip", "BODYWEIGHT", true, defaultSets, "10-12", 0, defaultRest, "Slight forward torso pitch to load pectorals");
          addExercise("Decline Push-Up", "BODYWEIGHT", true, 3, "12-15", 0, 60, "Elevate feet on bench to target upper clavicular chest");
        } else if (isDumbbellOnly) {
          addExercise("Flat Dumbbell Press", "STRENGTH", false, defaultSets, defaultReps, 65, defaultRest, "Deep stretch at bottom, explosive press to center");
          addExercise("Incline Dumbbell Press", "STRENGTH", false, defaultSets, defaultReps, 55, defaultRest, "Set bench to 30 degrees, touch dumbbells above upper chest");
          addExercise("Dumbbell Chest Fly", "STRENGTH", false, 3, "12-15", 30, 60, "Maintain soft elbow bend, hug a wide barrel");
        } else {
          addExercise("Barbell Bench Press", "STRENGTH", false, defaultSets, isStrength ? "5" : "8-10", 185, isStrength ? 180 : 90, "Retract scapulae, touch lower sternum under control");
          addExercise("Incline Dumbbell Press", "STRENGTH", false, defaultSets, "8-10", 65, 90, "Drive through elbows, full contraction at top");
          addExercise("Cable Crossover Fly", "STRENGTH", false, 3, "12-15", 35, 60, "Squeeze pecs at peak contraction for 1 count");
        }
      }

      // Triceps
      if (normPrompt.includes("tricep") || normPrompt.includes("arm") || normPrompt.includes("push")) {
        if (isBodyweightOnly) {
          addExercise("Tricep Bench Dip", "BODYWEIGHT", true, 3, "12-15", 0, 60, "Keep back close to bench, isolate elbow extension");
          addExercise("Diamond Push-Up", "BODYWEIGHT", true, 3, "10-12", 0, 60, "Hands touching in diamond under center chest");
        } else if (isDumbbellOnly) {
          addExercise("Overhead Dumbbell Tricep Extension", "STRENGTH", false, 3, "10-12", 45, 60, "Keep upper arms vertical, deep stretch on long head");
          addExercise("Dumbbell Kickback", "STRENGTH", false, 3, "12-15", 25, 45, "Pin elbows high, squeeze triceps at lockout");
        } else {
          addExercise("Tricep Rope Pushdown", "STRENGTH", false, 3, "12-15", 50, 60, "Spread rope ends outward at bottom lockout");
          addExercise("Skull Crusher (Lying Triceps Extension)", "STRENGTH", false, 3, "10-12", 70, 75, "Lower EZ bar to forehead smoothly, elbows tucked");
        }
      }

      // Back & Biceps / Pull
      if (normPrompt.includes("back") || normPrompt.includes("lat") || normPrompt.includes("pull") || normPrompt.includes("row")) {
        if (isBodyweightOnly) {
          addExercise("Pull-Up", "BODYWEIGHT", true, defaultSets, "8-10", 0, defaultRest, "Dead hang to chin clearly over bar");
          addExercise("Chin-Up", "BODYWEIGHT", true, 3, "8-10", 0, defaultRest, "Underhand supinated grip targeting lower lats & biceps");
          addExercise("Inverted Bodyweight Row", "BODYWEIGHT", true, 3, "12-15", 0, 60, "Pull chest up to bar with straight rigid core");
        } else if (isDumbbellOnly) {
          addExercise("Single-Arm Dumbbell Row", "STRENGTH", false, defaultSets, defaultReps, 65, defaultRest, "Drive elbow back toward hip crease, flat spine");
          addExercise("Chest-Supported Dumbbell Row", "STRENGTH", false, 3, "10-12", 50, 60, "Pinch shoulder blades together at apex");
          addExercise("Dumbbell Shrug", "STRENGTH", false, 3, "15", 70, 45, "Elevate shoulders straight up toward ears");
        } else {
          addExercise("Barbell Bent-Over Row", "STRENGTH", false, defaultSets, isStrength ? "5" : "8-10", 165, isStrength ? 120 : 90, "45-degree torso pitch, pull bar into belly button");
          addExercise("Lat Pulldown (Close Grip)", "STRENGTH", false, defaultSets, "8-10", 140, 75, "Drive elbows down and back into flanks");
          addExercise("Seated Cable Row", "STRENGTH", false, 3, "10-12", 130, 60, "Full lat stretch forward, explosive pull to navel");
        }
      }

      // Biceps
      if (normPrompt.includes("bicep") || normPrompt.includes("arm") || normPrompt.includes("curl") || normPrompt.includes("pull")) {
        if (isDumbbellOnly || isBodyweightOnly) {
          addExercise("Dumbbell Hammer Curl", "STRENGTH", false, 3, "10-12", 35, 60, "Neutral grip isolating brachialis and forearms");
          addExercise("Incline Dumbbell Curl", "STRENGTH", false, 3, "10-12", 30, 60, "Full long head stretch with upper arms pinned back");
        } else {
          addExercise("Barbell Bicep Curl", "STRENGTH", false, 3, "8-10", 75, 60, "Strict elbow flexion without hip swinging");
          addExercise("Dumbbell Hammer Curl", "STRENGTH", false, 3, "12-15", 35, 60, "Neutral grip targeting outer arm thickness");
        }
      }

      // Legs / Squats / Quads / Hamstrings / Glutes
      if (normPrompt.includes("leg") || normPrompt.includes("squat") || normPrompt.includes("quad") || normPrompt.includes("hamstring") || normPrompt.includes("glute") || normPrompt.includes("lower")) {
        if (isBodyweightOnly) {
          addExercise("Bodyweight Air Squats", "BODYWEIGHT", true, defaultSets, "20-25", 0, 45, "Break parallel on every rep with upright chest");
          addExercise("Bulgarian Split Squat", "BODYWEIGHT", true, 3, "12-15", 0, 60, "Rear foot elevated on bench, sink hips deep");
          addExercise("Walking Bodyweight Lunges", "BODYWEIGHT", true, 3, "20 paces", 0, 60, "90-degree front knee angle, back knee taps ground");
          addExercise("Glute Bridge", "BODYWEIGHT", true, 3, "20", 0, 45, "Drive through heels, squeeze glutes at top lockout");
        } else if (isDumbbellOnly) {
          addExercise("Goblet Squat", "STRENGTH", false, defaultSets, defaultReps, 65, defaultRest, "Hold dumbbell at chest, elbows inside knees");
          addExercise("Dumbbell Romanian Deadlift", "STRENGTH", false, defaultSets, defaultReps, 60, defaultRest, "Hinge hips backward, flat back hamstring stretch");
          addExercise("Bulgarian Split Squat", "STRENGTH", false, 3, "10-12", 35, 60, "Drive through front heel to load quads and glutes");
          addExercise("Dumbbell Hip Thrust", "STRENGTH", false, 3, "12-15", 55, 60, "Shoulders on bench, full hip lockout at parallel");
        } else {
          addExercise("Barbell Back Squat", "STRENGTH", false, defaultSets, isStrength ? "5" : "8", 225, isStrength ? 180 : 90, "360 core brace, knees tracking over toes");
          addExercise("Romanian Deadlift (RDL)", "STRENGTH", false, defaultSets, isStrength ? "6" : "8-10", 185, 90, "Hinge at hips with vertical shins to stretch hamstrings");
          addExercise("Barbell Hip Thrust", "STRENGTH", false, 3, "10-12", 225, 90, "Tuck chin, squeeze glutes maximally at top horizontal table");
          addExercise("Leg Press", "STRENGTH", false, 3, "10-12", 360, 75, "Feet shoulder-width, deep knee flexion");
        }
      }

      // Shoulders / Delts
      if (normPrompt.includes("shoulder") || normPrompt.includes("delt") || normPrompt.includes("ohp") || normPrompt.includes("overhead")) {
        if (isBodyweightOnly) {
          addExercise("Pike Push-Up", "BODYWEIGHT", true, defaultSets, "10-12", 0, 60, "Pike hips high, lower head diagonally toward hands");
          addExercise("Handstand Wall Hold", "BODYWEIGHT", true, 3, "30-45s", 0, 60, "Full vertical body lockout against wall");
        } else if (isDumbbellOnly) {
          addExercise("Seated Dumbbell Shoulder Press", "STRENGTH", false, defaultSets, defaultReps, 55, defaultRest, "Press dumbbells upward in slight arc over crown");
          addExercise("Standing Dumbbell Lateral Raise", "STRENGTH", false, 4, "12-15", 25, 45, "Lead with elbows, slight forward torso pitch");
          addExercise("Rear Delt Dumbbell Fly", "STRENGTH", false, 3, "15", 20, 45, "Hinged forward 45 degrees, sweep arms wide");
        } else {
          addExercise("Overhead Barbell Press (OHP)", "STRENGTH", false, defaultSets, isStrength ? "5" : "8", 115, isStrength ? 120 : 90, "Squeeze glutes & core, press vertically past nose");
          addExercise("Standing Dumbbell Lateral Raise", "STRENGTH", false, 4, "12-15", 25, 45, "Scapular plane elevation for side delts");
          addExercise("Cable Face Pull", "STRENGTH", false, 3, "15", 40, 45, "Pull rope to bridge of nose with external rotation");
        }
      }

      // Core & Abs
      if (normPrompt.includes("core") || normPrompt.includes("ab") || normPrompt.includes("plank") || normPrompt.includes("six pack") || normPrompt.includes("finish")) {
        addExercise("Plank", "BODYWEIGHT", true, 3, "60 sec", 0, 45, "Active abdominal brace, posterior pelvic tilt");
        addExercise("Hanging Leg Raise", "BODYWEIGHT", true, 3, "12-15", 0, 45, "Curl pelvis upward without swinging legs");
        addExercise("Cable Woodchopper", "STRENGTH", false, 3, "12-15", 30, 45, "Rotate from thoracic core, keep arms long");
      }

      // Explosive / Functional / Full Body
      if (normPrompt.includes("clean") || normPrompt.includes("snatch") || normPrompt.includes("swing") || normPrompt.includes("athletic") || normPrompt.includes("explosive") || normPrompt.includes("full body")) {
        addExercise("Power Clean", "STRENGTH", false, 4, "3-5", 155, 120, "Triple extension through ankles, knees, and hips");
        addExercise("Kettlebell Swing", "STRENGTH", false, 4, "15", 53, 60, "Hinge violently from hips, snap glutes at apex");
        addExercise("Box Jump", "BODYWEIGHT", true, 3, "6-8", 0, 60, "Land softly in quarter squat, stand up completely");
      }

      // Fallback filler if prompt was very brief or specific
      if (dynamicExercises.length < targetExerciseCount) {
        const fallbacks: GeneratedExercise[] = [
          { name: "Barbell Back Squat", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "8", suggestedWeight: 185, restSeconds: 90, coachingCue: "Brace 360 degrees into belt, knees track over toes" },
          { name: "Barbell Bench Press", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "8", suggestedWeight: 155, restSeconds: 90, coachingCue: "Keep scapulae pinned down into bench" },
          { name: "Pull-Up", category: "BODYWEIGHT", isBodyweight: true, targetSets: 3, targetReps: "8-10", suggestedWeight: 0, restSeconds: 75, coachingCue: "Full dead hang to chin over bar" },
          { name: "Standing Dumbbell Lateral Raise", category: "STRENGTH", isBodyweight: false, targetSets: 3, targetReps: "12-15", suggestedWeight: 25, restSeconds: 45, coachingCue: "Lead with elbows for maximum lateral delt load" },
          { name: "Plank", category: "BODYWEIGHT", isBodyweight: true, targetSets: 3, targetReps: "60s", suggestedWeight: 0, restSeconds: 45, coachingCue: "Squeeze glutes and abdominals continuously" },
        ];
        for (const fb of fallbacks) {
          if (dynamicExercises.length >= targetExerciseCount) break;
          addExercise(fb.name, fb.category, fb.isBodyweight, fb.targetSets, fb.targetReps, fb.suggestedWeight, fb.restSeconds, fb.coachingCue);
        }
      }

      // Generate context-aware name and warmup/recovery
      const titleCaseWords = rawPrompt
        .split(" ")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      const routine: GeneratedRoutine = {
        routineName: `AI Custom: ${titleCaseWords.length > 50 ? titleCaseWords.slice(0, 47) + "..." : titleCaseWords}`,
        goal: resolvedGoal,
        level: experienceLevel,
        focus: rawPrompt,
        estimatedDurationMinutes: detectedMinutes,
        warmupInstructions: [
          `5 minutes dynamic cardiovascular activation (${detectedMinutes > 45 ? "Rower or Treadmill" : "Jump Rope or High Knees"})`,
          "Dynamic joint mobilization targeting primary movement planes",
          "2 specific progressive warmup sets with 40-60% working weight"
        ],
        exercises: dynamicExercises,
        recoveryTips: [
          "Target 25-35g high-quality protein within 1-2 hours post-workout",
          "Rehydrate with 24-32 oz water containing balanced electrolytes",
          "Perform 5 minutes static stretching or foam rolling on loaded muscle groups"
        ]
      };

      return NextResponse.json({ success: true, routine });
    }

    // Default template-based generation if no prompt provided
    const goalCategory = goal.toUpperCase().includes("STRENGTH")
      ? "STRENGTH"
      : goal.toUpperCase().includes("BODY")
      ? "BODYWEIGHT"
      : "HYPERTROPHY";

    const availableSplits = Object.keys(TEMPLATES[goalCategory] || TEMPLATES.HYPERTROPHY);
    const chosenSplit = availableSplits.find(s => s.toLowerCase().includes(split.toLowerCase())) || availableSplits[0];
    const exercises = (TEMPLATES[goalCategory] && TEMPLATES[goalCategory][chosenSplit]) || TEMPLATES.HYPERTROPHY["Push / Chest & Shoulders"];

    const routine: GeneratedRoutine = {
      routineName: `AI Optimized ${goalCategory} — ${chosenSplit}`,
      goal: goalCategory,
      level: experienceLevel,
      focus: chosenSplit,
      estimatedDurationMinutes: availableTimeMinutes,
      warmupInstructions: [
        "5 minutes light cardiovascular warmup (treadmill or rower)",
        "Dynamic shoulder dislocations & arm circles",
        "2 warmup sets of first movement with empty bar / 50% working weight"
      ],
      exercises,
      recoveryTips: [
        "Consume 25-35g protein within 90 minutes post-workout",
        "Target 7-9 hours of restorative sleep for nervous system recovery",
        "Hydrate with electrolyte balance (at least 32 oz water post-session)"
      ]
    };

    return NextResponse.json({ success: true, routine });
  } catch (error: any) {
    console.error("AI Routine Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate routine" }, { status: 500 });
  }
}
