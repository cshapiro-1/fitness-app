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

export async function POST(req: NextRequest) {
  try {
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
      } = body;

      const isWarmup = routineType === "warmup";
      const isCooldown = routineType === "cooldown";
      const typeLabel = isWarmup ? "Dynamic Warm-Up" : isCooldown ? "Post-Workout Cool-Down" : "Mobility & Recovery";

      // Pool of targeted mobility movements
      const movementPool: Record<string, Array<{ name: string; duration: number; cue: string; sides?: "left_right" | "none" }>> = {
        Chest: [
          { name: "Doorway Chest Stretch", duration: 40, cue: "Place forearms on door frame and step forward until deep stretch is felt in pecs", sides: "left_right" },
          { name: "Chest Opener with Clasp", duration: 45, cue: "Interlace fingers behind back and pull shoulder blades together and down", sides: "none" },
          { name: "Floor Pec Stretch (Scorpion)", duration: 40, cue: "Lie prone, extend arm at 90 degrees, roll body gently away from arm", sides: "left_right" },
        ],
        Back: [
          { name: "Cat-Cow Stretch", duration: 45, cue: "Inhale to arch spine and drop belly, exhale to round upper back toward ceiling", sides: "none" },
          { name: "Child's Pose with Lat Reach", duration: 45, cue: "Sink hips back onto heels, walk hands diagonally to stretch lats", sides: "left_right" },
          { name: "Thoracic Spine Rotations", duration: 40, cue: "On all fours, hand behind head, rotate elbow up toward ceiling", sides: "left_right" },
          { name: "Thread the Needle", duration: 40, cue: "Slide arm underneath torso to open upper back and posterior shoulder", sides: "left_right" },
        ],
        Shoulders: [
          { name: "Cross-Body Shoulder Stretch", duration: 30, cue: "Gently pull arm across chest with opposite forearm, keeping shoulders down", sides: "left_right" },
          { name: "Overhead Triceps & Shoulder Stretch", duration: 30, cue: "Reach hand down spine, gently pull elbow from above", sides: "left_right" },
          { name: "Arm Circles & Hugs", duration: 30, cue: "Start small, expand to large circles, then hug chest dynamically", sides: "none" },
          { name: "Wall Angels", duration: 45, cue: "Back flat against wall, glide arms up and down keeping elbows and wrists touching", sides: "none" },
        ],
        Arms: [
          { name: "Biceps Wall Stretch", duration: 30, cue: "Place palm flat on wall behind you at shoulder height and rotate chest away", sides: "left_right" },
          { name: "Wrist Flexor & Extensor Stretch", duration: 30, cue: "Extend arm with palm facing forward, pull fingers back gently", sides: "left_right" },
          { name: "Overhead Triceps Stretch", duration: 30, cue: "Pull elbow back and breathe into the stretch", sides: "left_right" },
        ],
        Legs: [
          { name: "Standing Quad Stretch", duration: 30, cue: "Grab ankle, pull heel toward glute, tuck pelvis forward", sides: "left_right" },
          { name: "Hamstring Sweep & Fold", duration: 45, cue: "Hinge at hips with flat back until stretch is felt in posterior thigh", sides: "none" },
          { name: "Walking Lunge with Overhead Reach", duration: 45, cue: "Step forward, drop back knee, reach opposite arm overhead to stretch hip flexor", sides: "left_right" },
          { name: "Standing Calf Stretch", duration: 30, cue: "Press back heel into floor with straight back leg", sides: "left_right" },
        ],
        Glutes: [
          { name: "Pigeon Pose", duration: 45, cue: "Front shin angled, square hips to floor, breathe into outer hip", sides: "left_right" },
          { name: "Figure-4 Glute Stretch", duration: 40, cue: "Ankle over opposite knee, pull thigh toward chest", sides: "left_right" },
          { name: "90/90 Hip Switches", duration: 45, cue: "Sit with legs in 90-degree angles, rotate knees smoothly from side to side", sides: "left_right" },
        ],
        Core: [
          { name: "Cobra / Sphinx Stretch", duration: 40, cue: "Press palms into floor, gently extend spine keeping hips grounded", sides: "none" },
          { name: "Supine Spinal Twist", duration: 40, cue: "Lie on back, drop bent knee across body while keeping opposite shoulder down", sides: "left_right" },
          { name: "Bird-Dog Holds", duration: 40, cue: "Extend opposite arm and leg, hold for 2 seconds, brace core", sides: "left_right" },
        ],
        "Full Body": [
          { name: "World's Greatest Stretch", duration: 45, cue: "Lunge forward, place inside elbow to instep, then rotate arm to ceiling", sides: "left_right" },
          { name: "Deep Squat with T-Spine Rotation", duration: 45, cue: "Hold bottom of squat, grasp opposite ankle and rotate chest open", sides: "left_right" },
          { name: "Inchworm to Cobra", duration: 45, cue: "Walk hands out into push-up position, drop hips into cobra, walk feet in", sides: "none" },
          { name: "Downward Dog to Upward Dog", duration: 45, cue: "Flow between pedal calf stretch and upward facing dog", sides: "none" },
        ],
      };

      const selectedList: Array<{ name: string; duration: number; cue: string; sides?: "left_right" | "none" }> = [];
      const targets = muscleGroups.includes("Full Body") ? ["Full Body", "Chest", "Back", "Legs", "Glutes"] : muscleGroups;

      targets.forEach((mg: string) => {
        const pool = movementPool[mg] || movementPool["Full Body"];
        pool.forEach((m) => {
          if (!selectedList.find((x) => x.name === m.name)) {
            selectedList.push(m);
          }
        });
      });

      // Target movement count based on duration (approx 60s per movement with switch)
      const targetCount = Math.max(4, Math.min(10, Math.round((durationMinutes * 60) / 75)));
      const chosenMovements = selectedList.slice(0, targetCount);

      const routine = {
        name: `AI ${typeLabel} (${targets.slice(0, 3).join(", ")})`,
        durationBadge: `~${durationMinutes} min`,
        description: `Customized ${typeLabel.toLowerCase()} targeting ${targets.join(", ")} to optimize blood flow, joint mobility, and muscular recovery.`,
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
