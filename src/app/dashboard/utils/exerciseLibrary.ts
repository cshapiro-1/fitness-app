export interface ExerciseDefinition {
  name: string;
  muscleGroup: "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Full Body";
  equipment: "Barbell" | "Dumbbell" | "Cable" | "Machine" | "Bodyweight" | "Kettlebell" | "Other";
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
  { name: "Push-Up", muscleGroup: "Chest", equipment: "Bodyweight", isCompound: true },
  { name: "Weighted Push-Up", muscleGroup: "Chest", equipment: "Bodyweight", isCompound: true },
  { name: "Chest Dip", muscleGroup: "Chest", equipment: "Bodyweight", isCompound: true },
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
  { name: "Pull-Up", muscleGroup: "Back", equipment: "Bodyweight", isCompound: true },
  { name: "Chin-Up", muscleGroup: "Back", equipment: "Bodyweight", isCompound: true },
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

  // ARMS (BICEPS & TRICEPS)
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
  { name: "Tricep Bench Dip", muscleGroup: "Arms", equipment: "Bodyweight" },
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
  { name: "Bird Dog", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Side Plank", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Pallof Press", muscleGroup: "Core", equipment: "Cable" },

  // FULL BODY / OLYMPIC & FUNCTIONAL
  { name: "Power Clean", muscleGroup: "Full Body", equipment: "Barbell", isCompound: true },
  { name: "Clean and Jerk", muscleGroup: "Full Body", equipment: "Barbell", isCompound: true },
  { name: "Snatch", muscleGroup: "Full Body", equipment: "Barbell", isCompound: true },
  { name: "Kettlebell Swing", muscleGroup: "Full Body", equipment: "Kettlebell", isCompound: true },
  { name: "Turkish Get-Up", muscleGroup: "Full Body", equipment: "Kettlebell", isCompound: true },
  { name: "Burpee", muscleGroup: "Full Body", equipment: "Bodyweight" },
  { name: "Box Jump", muscleGroup: "Full Body", equipment: "Bodyweight" },
  { name: "Medicine Ball Slam", muscleGroup: "Full Body", equipment: "Other" },
  { name: "Rowing Machine (Ergometer)", muscleGroup: "Full Body", equipment: "Machine" },
];

export function searchExercises(query: string, muscleFilter?: string, equipmentFilter?: string): ExerciseDefinition[] {
  const q = query.toLowerCase().trim();
  return EXERCISE_LIBRARY.filter((ex) => {
    const matchesQuery = !q || ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q) || ex.equipment.toLowerCase().includes(q);
    const matchesMuscle = !muscleFilter || muscleFilter === "All" || ex.muscleGroup === muscleFilter;
    const matchesEquipment = !equipmentFilter || equipmentFilter === "All" || ex.equipment === equipmentFilter;
    return matchesQuery && matchesMuscle && matchesEquipment;
  });
}
