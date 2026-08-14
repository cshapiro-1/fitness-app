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
