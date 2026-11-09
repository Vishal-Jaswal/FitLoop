export type MuscleGroup = "chest" | "back" | "shoulders" | "biceps" | "triceps" | "quadriceps" | "hamstrings" | "glutes" | "calves" | "core" | "full body";
export type Equipment = "barbell" | "dumbbell" | "cable" | "machine" | "kettlebell" | "bodyweight" | "band" | "other";
export type WeightUnit = "kg" | "lb";
export type SessionStatus = "in_progress" | "completed" | "cancelled";
export type SetType = "warmup" | "working";

export type Exercise = {
  id: string;
  slug: string;
  name: string;
  instructions: string;
  primaryMuscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: Equipment;
};

export type RoutineExercise = {
  id: string;
  exerciseId: string;
  position: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number | null;
  restSeconds: number | null;
};

export type Routine = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  exercises: RoutineExercise[];
};

export type WorkoutSet = {
  id: string;
  position: number;
  type: SetType;
  reps: number | null;
  weightKg: number | null;
  completedAt: string | null;
};

export type SessionExercise = {
  id: string;
  exerciseId: string;
  name: string;
  primaryMuscleGroup: string;
  position: number;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  routineId: string | null;
  status: SessionStatus;
  weightUnit: WeightUnit;
  startedAt: string;
  finishedAt: string | null;
  exercises: SessionExercise[];
};

export type ProgressSummary = {
  previous: { date: string; topWeightKg: number; reps: number } | null;
  record: { weightKg: number; reps: number; date: string } | null;
};
