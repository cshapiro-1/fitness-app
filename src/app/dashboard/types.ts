export interface Client {
  id: string;
  userId?: string;
  name: string;
  image?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  fitnessGoals?: string | null;
  createdAt: string;
  inviteStatus?: "NOT_SENT" | "PENDING" | "ACCEPTED";
  inviteToken?: string | null;
  inviteUrl?: string | null;
  emailNotifications?: boolean;
  _count?: { workoutSessions: number };
}

export interface WorkoutSet {
  id: string;
  order: number;
  weight: number;
  reps: number;
  notes?: string | null;
}

export interface WorkoutExercise {
  id: string;
  order: number;
  name: string;
  category?: string | null;
  isBodyweight?: boolean;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  clientId: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  exercises: WorkoutExercise[];
}

export type DraftSet = { weight: string; reps: string; notes: string };
export type DraftExercise = {
  name: string;
  category?: string | null;
  isBodyweight?: boolean;
  sets: DraftSet[];
};
export type DraftWorkout = {
  startedAt: string;
  notes: string;
  exercises: DraftExercise[];
  plannedWorkoutId?: string | null;
};