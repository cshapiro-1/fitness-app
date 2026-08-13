export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core"
  | "Cardio";

export type EquipmentType =
  | "Barbell"
  | "Dumbbell"
  | "Machine"
  | "Cable"
  | "Bodyweight"
  | "Kettlebell"
  | "Cardio Machine";

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  equipment: EquipmentType;
  targetMuscle: string;
  secondaryMuscles: string[];
  instructions: string[];
  tips: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  iconName?: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weightLbs: number;
  reps: number;
  completed: boolean;
  rpe?: number;
  isPersonalRecord?: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: MuscleGroup;
  sets: WorkoutSet[];
  notes?: string;
}

export interface RoutineItem {
  exerciseId: string;
  defaultSets: number;
  defaultReps: string;
  defaultRestSec: number;
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  category: MuscleGroup | "Full Body" | "HIIT";
  targetFocus: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  items: RoutineItem[];
  isCustom?: boolean;
}

export interface WorkoutLog {
  id: string;
  title: string;
  completedAt: string; // ISO string
  durationSeconds: number;
  totalVolumeLbs: number;
  totalSets: number;
  totalReps: number;
  exercises: WorkoutExercise[];
  notes?: string;
  moodRating?: number; // 1-5
}

export interface BodyMetricLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightLbs: number;
  bodyFatPercentage?: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  goal: "Build Muscle" | "Gain Strength" | "Fat Loss" | "General Fitness";
  fitnessLevel: "Beginner" | "Intermediate" | "Advanced";
  weightLbs: number;
  heightInches: number;
  weeklyTargetWorkouts: number;
}

export interface AiGeneratedDay {
  dayName: string;
  focusArea: string;
  exercises: {
    name: string;
    category: MuscleGroup;
    sets: number;
    reps: string;
    restSeconds: number;
    equipment: string;
    coachingTip: string;
  }[];
}

export interface AiGeneratedProgram {
  programTitle: string;
  summary: string;
  weeklyDays: AiGeneratedDay[];
  nutritionAdvice: string;
}
