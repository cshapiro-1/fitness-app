export interface MobilityMovement {
  name: string;
  durationSeconds: number;
  sides?: "both" | "left_right";
  coachingCue: string;
  category: "dynamic_warmup" | "static_stretch" | "foam_roll" | "cardio_cooldown" | "wellness" | "breathing";
}

export interface MobilityRoutine {
  id: string;
  name: string;
  type: "warmup" | "cooldown" | "stretch" | "cardio" | "wellness" | "full_mobility";
  icon: string;
  durationMinutes: number;
  targetMuscleGroups: string[];
  description: string;
  movements: MobilityMovement[];
}

export const MOBILITY_ROUTINES: MobilityRoutine[] = [
  {
    id: "dyn-warmup-1",
    name: "Dynamic Warm-Up",
    type: "warmup",
    icon: "🔥",
    durationMinutes: 8,
    targetMuscleGroups: ["Full Body"],
    description: "A quick full-body warm-up to increase heart rate and lubricate joints before any workout.",
    movements: [
      {
        name: "Arm circles",
        durationSeconds: 30,
        sides: "both",
        coachingCue: "Start with small circles and gradually make them larger.",
        category: "dynamic_warmup"
      },
      {
        name: "Leg swings",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Swing forward and back, keeping your torso upright and core tight.",
        category: "dynamic_warmup"
      },
      {
        name: "Hip circles",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Imagine drawing a large circle with your knee.",
        category: "dynamic_warmup"
      },
      {
        name: "High knees",
        durationSeconds: 30,
        sides: "both",
        coachingCue: "Drive your knees up to your chest, pump your arms.",
        category: "dynamic_warmup"
      },
      {
        name: "Butt kicks",
        durationSeconds: 30,
        sides: "both",
        coachingCue: "Snap your heels to your glutes quickly.",
        category: "dynamic_warmup"
      },
      {
        name: "Inchworms",
        durationSeconds: 45,
        sides: "both",
        coachingCue: "Keep legs as straight as possible, walk hands out to a plank.",
        category: "dynamic_warmup"
      },
      {
        name: "Lateral lunges",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Push hips back and keep the trailing leg straight.",
        category: "dynamic_warmup"
      },
      {
        name: "Jumping jacks",
        durationSeconds: 30,
        sides: "both",
        coachingCue: "Stay light on your toes and move at a brisk pace.",
        category: "dynamic_warmup"
      }
    ]
  },
  {
    id: "upper-stretch-1",
    name: "Upper Body Stretch",
    type: "stretch",
    icon: "🧘",
    durationMinutes: 10,
    targetMuscleGroups: ["Chest", "Shoulders", "Arms", "Back"],
    description: "Static stretches focused on relaxing the upper body after a push or pull workout.",
    movements: [
      {
        name: "Chest doorway stretch",
        durationSeconds: 45,
        sides: "left_right",
        coachingCue: "Gently lean forward until you feel a stretch across your chest.",
        category: "static_stretch"
      },
      {
        name: "Cross-body shoulder stretch",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Pull arm across your chest without hiking your shoulder up.",
        category: "static_stretch"
      },
      {
        name: "Overhead tricep stretch",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Gently pull your elbow behind your head.",
        category: "static_stretch"
      },
      {
        name: "Neck rolls",
        durationSeconds: 30,
        sides: "both",
        coachingCue: "Roll slowly and gently in half circles.",
        category: "static_stretch"
      },
      {
        name: "Wrist circles & flexor stretch",
        durationSeconds: 30,
        sides: "both",
        coachingCue: "Gently pull fingers back to stretch the forearm.",
        category: "static_stretch"
      },
      {
        name: "Lat stretch",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Grab a post or band and lean back, feeling the stretch down your side.",
        category: "static_stretch"
      },
      {
        name: "Thoracic spine rotation",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Rotate from the mid-back, follow your hand with your eyes.",
        category: "static_stretch"
      },
      {
        name: "Child's pose with reach",
        durationSeconds: 45,
        sides: "both",
        coachingCue: "Sit hips back to heels and walk hands forward.",
        category: "static_stretch"
      }
    ]
  },
  {
    id: "lower-stretch-1",
    name: "Lower Body Stretch",
    type: "stretch",
    icon: "🦵",
    durationMinutes: 10,
    targetMuscleGroups: ["Legs", "Glutes", "Hips"],
    description: "Static stretches to alleviate tightness in the legs and hips after squatting or running.",
    movements: [
      {
        name: "Standing quad stretch",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Keep knees together and push your hips slightly forward.",
        category: "static_stretch"
      },
      {
        name: "Standing hamstring fold",
        durationSeconds: 45,
        sides: "both",
        coachingCue: "Hinge at the hips and let your upper body hang heavy.",
        category: "static_stretch"
      },
      {
        name: "Pigeon pose",
        durationSeconds: 45,
        sides: "left_right",
        coachingCue: "Keep hips square to the ground, breathe into the stretch.",
        category: "static_stretch"
      },
      {
        name: "Calf stretch",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Keep the back heel down and leg straight as you lean forward.",
        category: "static_stretch"
      },
      {
        name: "Hip flexor lunge stretch",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Tuck your pelvis and gently shift weight forward.",
        category: "static_stretch"
      },
      {
        name: "90/90 hip switch",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Keep your torso tall as you rotate your hips internally and externally.",
        category: "static_stretch"
      },
      {
        name: "Ankle circles",
        durationSeconds: 20,
        sides: "left_right",
        coachingCue: "Draw large circles with your big toe.",
        category: "static_stretch"
      },
      {
        name: "Seated butterfly stretch",
        durationSeconds: 45,
        sides: "both",
        coachingCue: "Sit tall and gently press your knees toward the floor.",
        category: "static_stretch"
      }
    ]
  },
  {
    id: "cooldown-cardio-1",
    name: "Cool-Down Cardio",
    type: "cardio",
    icon: "🏃",
    durationMinutes: 10,
    targetMuscleGroups: ["Full Body", "Cardiovascular"],
    description: "A gradual cool-down to lower your heart rate and clear lactic acid.",
    movements: [
      {
        name: "Light jog / brisk walk",
        durationSeconds: 180,
        sides: "both",
        coachingCue: "Focus on nasal breathing and relaxing the shoulders.",
        category: "cardio_cooldown"
      },
      {
        name: "Easy rowing machine pace",
        durationSeconds: 120,
        sides: "both",
        coachingCue: "Keep a smooth, rhythmic stroke rate. Don't pull hard.",
        category: "cardio_cooldown"
      },
      {
        name: "Stationary bike spin-down",
        durationSeconds: 120,
        sides: "both",
        coachingCue: "Low resistance, just keep the legs moving.",
        category: "cardio_cooldown"
      },
      {
        name: "Deep breathing walk",
        durationSeconds: 60,
        sides: "both",
        coachingCue: "4 seconds inhale, 6 seconds exhale.",
        category: "breathing"
      }
    ]
  },
  {
    id: "sauna-recovery-1",
    name: "Sauna & Recovery",
    type: "wellness",
    icon: "♨️",
    durationMinutes: 20,
    targetMuscleGroups: ["Full Body", "Recovery"],
    description: "Advanced recovery protocol including myofascial release and thermal therapy.",
    movements: [
      {
        name: "Foam rolling — quads & IT band",
        durationSeconds: 120,
        sides: "left_right",
        coachingCue: "Roll slowly. Pause on any tight or tender spots.",
        category: "foam_roll"
      },
      {
        name: "Foam rolling — upper back & lats",
        durationSeconds: 120,
        sides: "both",
        coachingCue: "Support your neck and breathe as you roll the upper back.",
        category: "foam_roll"
      },
      {
        name: "Foam rolling — calves",
        durationSeconds: 60,
        sides: "left_right",
        coachingCue: "Cross one leg over the other for more pressure if needed.",
        category: "foam_roll"
      },
      {
        name: "Sauna session",
        durationSeconds: 600,
        sides: "both",
        coachingCue: "Relax and hydrate. Aim for 150-180°F.",
        category: "wellness"
      },
      {
        name: "Cold plunge / cold shower",
        durationSeconds: 120,
        sides: "both",
        coachingCue: "2 minutes. Breathe slowly through the nose.",
        category: "wellness"
      }
    ]
  },
  {
    id: "full-mobility-1",
    name: "Full Body Mobility",
    type: "full_mobility",
    icon: "🌀",
    durationMinutes: 12,
    targetMuscleGroups: ["Full Body"],
    description: "A comprehensive mobility routine to improve joint range of motion and overall flexibility.",
    movements: [
      {
        name: "Cat-cow",
        durationSeconds: 45,
        sides: "both",
        coachingCue: "Move slowly through spinal flexion and extension.",
        category: "dynamic_warmup"
      },
      {
        name: "World's greatest stretch",
        durationSeconds: 45,
        sides: "left_right",
        coachingCue: "Sink hips low and reach top arm toward the ceiling.",
        category: "dynamic_warmup"
      },
      {
        name: "Thoracic rotation",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Open your chest, keeping your lower back stable.",
        category: "dynamic_warmup"
      },
      {
        name: "90/90 hip switches",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Keep your torso tall as you rotate your hips internally and externally.",
        category: "dynamic_warmup"
      },
      {
        name: "Band pull-aparts / shoulder dislocates",
        durationSeconds: 30,
        sides: "both",
        coachingCue: "Keep arms straight and squeeze shoulder blades together.",
        category: "dynamic_warmup"
      },
      {
        name: "Deep squat hold",
        durationSeconds: 45,
        sides: "both",
        coachingCue: "Keep chest up and heels flat on the floor.",
        category: "static_stretch"
      },
      {
        name: "Scorpion stretch",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Lie on your stomach and reach opposite foot to opposite hand.",
        category: "static_stretch"
      },
      {
        name: "Supine spinal twist",
        durationSeconds: 30,
        sides: "left_right",
        coachingCue: "Keep both shoulders on the ground as you drop your knee across.",
        category: "static_stretch"
      }
    ]
  }
];

export function getMuscleGroupsFromWorkout(exercises: { name: string; category?: string | null }[]): string[] {
  const muscleGroups = new Set<string>();

  exercises.forEach((exercise) => {
    const name = exercise.name.toLowerCase();
    const cat = (exercise.category || "").toLowerCase();
    
    // Chest
    if (name.includes("bench") || name.includes("fly") || name.includes("pushup") || name.includes("push-up") || cat.includes("chest")) {
      muscleGroups.add("Chest");
    }
    
    // Shoulders
    if (name.includes("press") && (name.includes("shoulder") || name.includes("overhead") || name.includes("military"))) {
      muscleGroups.add("Shoulders");
    } else if (name.includes("lateral") || name.includes("delt") || cat.includes("shoulder")) {
      muscleGroups.add("Shoulders");
    }
    
    // Back
    if (name.includes("row") || name.includes("pullup") || name.includes("pull-up") || name.includes("pulldown") || name.includes("chinup") || name.includes("deadlift") || cat.includes("back")) {
      muscleGroups.add("Back");
    }
    
    // Arms
    if (name.includes("curl") || name.includes("tricep") || name.includes("extension") && name.includes("tricep") || name.includes("skullcrusher") || name.includes("dip") || cat.includes("arm") || cat.includes("bicep") || cat.includes("tricep")) {
      muscleGroups.add("Arms");
    }
    
    // Legs
    if (name.includes("squat") || name.includes("lunge") || name.includes("calf") || name.includes("leg press") || name.includes("leg extension") || name.includes("leg curl") || cat.includes("leg")) {
      muscleGroups.add("Legs");
    }
    
    // Glutes
    if (name.includes("glute") || name.includes("bridge") || name.includes("hip thrust")) {
      muscleGroups.add("Glutes");
      muscleGroups.add("Legs"); // Often tied together
    }
    
    // Core
    if (name.includes("core") || name.includes("crunch") || name.includes("situp") || name.includes("plank") || name.includes("ab ") || cat.includes("core") || cat.includes("ab")) {
      muscleGroups.add("Core");
    }
  });

  if (muscleGroups.size === 0) {
    return ["Full Body"];
  }

  return Array.from(muscleGroups);
}
