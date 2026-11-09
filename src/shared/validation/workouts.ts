import { z } from "zod";

export const routineInputSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Use 80 characters or fewer."),
  description: z.string().trim().max(500, "Use 500 characters or fewer.").nullable(),
});

export const routineTargetSchema = z.object({
  targetSets: z.number().int().min(1).max(20),
  targetRepsMin: z.number().int().min(1).max(100),
  targetRepsMax: z.number().int().min(1).max(100).nullable(),
  restSeconds: z.number().int().min(0).max(900).nullable(),
}).refine((value) => value.targetRepsMax === null || value.targetRepsMax >= value.targetRepsMin, {
  path: ["targetRepsMax"], message: "Maximum reps must be at least the minimum.",
});

export const workoutSetSchema = z.object({
  reps: z.number().int().min(1).max(1000).nullable(),
  weightKg: z.number().min(0).max(10000).nullable(),
  completedAt: z.iso.datetime().nullable(),
}).refine((value) => value.completedAt === null || (value.reps !== null && value.weightKg !== null), {
  path: ["completedAt"], message: "Enter reps and weight before completing this set.",
});

export const weightUnitSchema = z.enum(["kg", "lb"]);
