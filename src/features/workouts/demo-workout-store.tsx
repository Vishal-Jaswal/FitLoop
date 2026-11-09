"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Routine, SessionExercise, WorkoutSession } from "./types";

const STORAGE_KEY = "fitloop-workout-demo-v1";

type DemoWorkoutData = { routines: Routine[]; sessions: WorkoutSession[] };
type DemoAction =
  | { type: "routine.create"; routine: Routine }
  | { type: "routine.update"; routine: Routine }
  | { type: "routine.delete"; id: string }
  | { type: "routine.duplicate"; routine: Routine }
  | { type: "routine.add-exercise"; routineId: string; exercise: Routine["exercises"][number] }
  | { type: "routine.remove-exercise"; routineId: string; exerciseId: string }
  | { type: "routine.target"; routineId: string; exerciseId: string; values: Pick<Routine["exercises"][number], "targetSets" | "targetRepsMin" | "targetRepsMax" | "restSeconds"> }
  | { type: "routine.reorder"; routineId: string; exerciseIds: string[] }
  | { type: "session.start"; session: WorkoutSession }
  | { type: "session.add-exercise"; sessionId: string; exercise: SessionExercise }
  | { type: "session.add-set"; sessionId: string; exerciseId: string; set: SessionExercise["sets"][number] }
  | { type: "session.update-set"; sessionId: string; exerciseId: string; setId: string; reps: number | null; weightKg: number | null; completedAt: string | null }
  | { type: "session.delete-set"; sessionId: string; exerciseId: string; setId: string }
  | { type: "session.finish"; sessionId: string; finishedAt: string }
  | { type: "session.cancel"; sessionId: string; finishedAt: string };

type StoreValue = {
  enabled: boolean;
  ready: boolean;
  data: DemoWorkoutData;
  dispatch: (action: DemoAction) => void;
};

const emptyData: DemoWorkoutData = { routines: [], sessions: [] };
const DemoWorkoutContext = createContext<StoreValue | null>(null);

function loadDemoData(): DemoWorkoutData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyData;
    const candidate = parsed as Partial<DemoWorkoutData>;
    if (!Array.isArray(candidate.routines) || !Array.isArray(candidate.sessions)) return emptyData;
    return { routines: candidate.routines as Routine[], sessions: candidate.sessions as WorkoutSession[] };
  } catch {
    return emptyData;
  }
}

function reduceDemoData(data: DemoWorkoutData, action: DemoAction): DemoWorkoutData {
  switch (action.type) {
    case "routine.create":
    case "routine.duplicate":
      return { ...data, routines: [action.routine, ...data.routines] };
    case "routine.update":
      return { ...data, routines: data.routines.map((routine) => routine.id === action.routine.id ? action.routine : routine) };
    case "routine.delete":
      return { ...data, routines: data.routines.filter((routine) => routine.id !== action.id) };
    case "routine.add-exercise":
      return { ...data, routines: data.routines.map((routine) => routine.id === action.routineId ? { ...routine, updatedAt: new Date().toISOString(), exercises: [...routine.exercises, action.exercise] } : routine) };
    case "routine.remove-exercise":
      return { ...data, routines: data.routines.map((routine) => routine.id === action.routineId ? { ...routine, updatedAt: new Date().toISOString(), exercises: routine.exercises.filter((exercise) => exercise.id !== action.exerciseId).map((exercise, position) => ({ ...exercise, position })) } : routine) };
    case "routine.target":
      return { ...data, routines: data.routines.map((routine) => routine.id === action.routineId ? { ...routine, updatedAt: new Date().toISOString(), exercises: routine.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, ...action.values } : exercise) } : routine) };
    case "routine.reorder":
      return { ...data, routines: data.routines.map((routine) => routine.id === action.routineId ? { ...routine, updatedAt: new Date().toISOString(), exercises: action.exerciseIds.map((id) => routine.exercises.find((exercise) => exercise.id === id)).filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise)).map((exercise, position) => ({ ...exercise, position })) } : routine) };
    case "session.start":
      return { ...data, sessions: [action.session, ...data.sessions] };
    case "session.add-exercise":
      return { ...data, sessions: data.sessions.map((session) => session.id === action.sessionId ? { ...session, exercises: [...session.exercises, action.exercise] } : session) };
    case "session.add-set":
      return { ...data, sessions: data.sessions.map((session) => session.id === action.sessionId ? { ...session, exercises: session.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, sets: [...exercise.sets, action.set] } : exercise) } : session) };
    case "session.update-set":
      return { ...data, sessions: data.sessions.map((session) => session.id === action.sessionId ? { ...session, exercises: session.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, sets: exercise.sets.map((set) => set.id === action.setId ? { ...set, reps: action.reps, weightKg: action.weightKg, completedAt: action.completedAt } : set) } : exercise) } : session) };
    case "session.delete-set":
      return { ...data, sessions: data.sessions.map((session) => session.id === action.sessionId ? { ...session, exercises: session.exercises.map((exercise) => exercise.id === action.exerciseId ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== action.setId).map((set, position) => ({ ...set, position })) } : exercise) } : session) };
    case "session.finish":
      return { ...data, sessions: data.sessions.map((session) => session.id === action.sessionId ? { ...session, status: "completed", finishedAt: action.finishedAt } : session) };
    case "session.cancel":
      return { ...data, sessions: data.sessions.map((session) => session.id === action.sessionId ? { ...session, status: "cancelled", finishedAt: action.finishedAt } : session) };
  }
}

export function DemoWorkoutProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [data, setData] = useState<DemoWorkoutData>(emptyData);
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    const frame = window.requestAnimationFrame(() => {
      setData(loadDemoData());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [enabled]);

  useEffect(() => {
    if (enabled && ready) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Local demo mode remains usable for this visit if storage is unavailable.
      }
    }
  }, [data, enabled, ready]);

  const dispatch = useCallback((action: DemoAction) => setData((current) => reduceDemoData(current, action)), []);
  const value = useMemo(() => ({ enabled, ready, data, dispatch }), [data, dispatch, enabled, ready]);

  return <DemoWorkoutContext.Provider value={value}>{children}</DemoWorkoutContext.Provider>;
}

export function useDemoWorkout(): StoreValue {
  const value = useContext(DemoWorkoutContext);
  if (!value) throw new Error("useDemoWorkout must be used inside DemoWorkoutProvider");
  return value;
}
