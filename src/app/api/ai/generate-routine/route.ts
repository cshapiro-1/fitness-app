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
      goal = "HYPERTROPHY", // HYPERTROPHY, STRENGTH, BODYWEIGHT, ATHLETIC
      split = "Upper Body Push",
      experienceLevel = "Intermediate",
      availableTimeMinutes = 60,
      equipment = "Full Gym"
    } = body;

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
