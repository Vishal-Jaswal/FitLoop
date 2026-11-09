"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useDemoWorkout } from "./demo-workout-store";
import type { Exercise, ProgressSummary, SessionExercise, WorkoutSession, WorkoutSet } from "./types";
import { kgToWeight, weightToKg } from "./units";
import { formatDate, formatDuration, formatWorkoutWeight, Notice, PageHeading, Tag } from "./workout-ui";
import { addExerciseToWorkoutAction, addWorkoutSetAction, cancelWorkoutAction, deleteWorkoutSetAction, finishWorkoutAction, getExerciseProgressAction, saveWorkoutSetAction } from "./actions";

function newId(): string { return globalThis.crypto.randomUUID(); }

export function ActiveWorkout({ sessionId, initialSession, exercises, demoMode }: { sessionId: string; initialSession: WorkoutSession | null; exercises: Exercise[]; demoMode: boolean }) {
  const store = useDemoWorkout();
  const router = useRouter();
  const [serverSession, setServerSession] = useState(initialSession);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const [restDuration, setRestDuration] = useState(90);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restFinished, setRestFinished] = useState(false);
  const [progress, setProgress] = useState<Record<string, ProgressSummary>>({});
  const [pending, startTransition] = useTransition();
  const session = demoMode ? store.data.sessions.find((item) => item.id === sessionId) ?? null : serverSession;
  const exerciseById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);
  const exerciseIdsKey = session?.exercises.map((exercise) => exercise.exerciseId).join(",") ?? "";
  const activeForProgress = session?.status === "in_progress";

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (restEndsAt !== null && restEndsAt <= current) {
        setRestEndsAt(null);
        setRestFinished(true);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [restEndsAt]);

  useEffect(() => {
    if (!activeForProgress || demoMode) return;
    let cancelled = false;
    const ids = [...new Set(exerciseIdsKey ? exerciseIdsKey.split(",") : [])];
    Promise.all(ids.map(async (exerciseId) => [exerciseId, await getExerciseProgressAction(exerciseId)] as const)).then((results) => {
      if (cancelled) return;
      setProgress(Object.fromEntries(results.flatMap(([exerciseId, result]) => result.ok ? [[exerciseId, result.data]] : [])));
    });
    return () => { cancelled = true; };
  }, [activeForProgress, demoMode, exerciseIdsKey, sessionId]);

  if (demoMode && !store.ready) return <Container className="py-12"><Card className="p-8 text-center text-sm text-muted" aria-live="polite">Loading your workout…</Card></Container>;
  if (!session) return <Container className="py-12"><Card className="p-8 text-center"><h1 className="text-xl font-semibold">Workout not found</h1><p className="mt-2 text-sm text-muted">This session may have been cancelled or is unavailable.</p><Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-accent-bright underline underline-offset-4" href="/workouts/new">Start a workout</Link></Card></Container>;
  if (session.status !== "in_progress") return <Container className="py-12"><Card className="p-8 text-center"><h1 className="text-xl font-semibold">This workout is {session.status}</h1><Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-accent-bright underline underline-offset-4" href={session.status === "completed" ? "/history/" + session.id : "/workouts/new"}>Continue</Link></Card></Container>;
  const activeSession = session;

  function addExercise() {
    if (!session || !selectedExercise) return;
    const exercise = exerciseById.get(selectedExercise);
    if (!exercise) return;
    setError("");
    setSelectedExercise("");
    startTransition(async () => {
      if (demoMode) {
        const item: SessionExercise = { id: newId(), exerciseId: exercise.id, name: exercise.name, primaryMuscleGroup: exercise.primaryMuscleGroup, position: activeSession.exercises.length, sets: [0, 1, 2].map((position) => ({ id: newId(), position, type: "working" as const, reps: null, weightKg: null, completedAt: null })) };
        store.dispatch({ type: "session.add-exercise", sessionId: activeSession.id, exercise: item });
        return;
      }
      const result = await addExerciseToWorkoutAction(activeSession.id, exercise.id);
      if (!result.ok) { setError(result.error); return; }
      setServerSession((current) => current ? { ...current, exercises: [...current.exercises, result.data] } : current);
    });
  }

  function addSet(exercise: SessionExercise, type: "warmup" | "working") {
    startTransition(async () => {
      if (demoMode) {
        const position = exercise.sets.reduce((max, set) => Math.max(max, set.position), -1) + 1;
        store.dispatch({ type: "session.add-set", sessionId: activeSession.id, exerciseId: exercise.id, set: { id: newId(), position, type, reps: null, weightKg: null, completedAt: null } });
        return;
      }
      const result = await addWorkoutSetAction(activeSession.id, exercise.id, type);
      if (!result.ok) { setError(result.error); return; }
      setServerSession((current) => current ? { ...current, exercises: current.exercises.map((item) => item.id === exercise.id ? { ...item, sets: [...item.sets, result.data] } : item) } : current);
    });
  }

  async function saveSet(exerciseId: string, set: WorkoutSet, values: { reps: number | null; weightKg: number | null; completedAt: string | null }): Promise<boolean> {
    if (demoMode) {
      store.dispatch({ type: "session.update-set", sessionId: activeSession.id, exerciseId, setId: set.id, ...values });
      return true;
    }
    const result = await saveWorkoutSetAction(activeSession.id, exerciseId, set.id, values);
    if (!result.ok) { setError(result.error); return false; }
    setServerSession((current) => current ? { ...current, exercises: current.exercises.map((item) => item.id === exerciseId ? { ...item, sets: item.sets.map((currentSet) => currentSet.id === set.id ? { ...currentSet, ...values } : currentSet) } : item) } : current);
    return true;
  }

  function deleteSet(exercise: SessionExercise, setId: string) {
    startTransition(async () => {
      if (demoMode) { store.dispatch({ type: "session.delete-set", sessionId: activeSession.id, exerciseId: exercise.id, setId }); return; }
      const result = await deleteWorkoutSetAction(activeSession.id, exercise.id, setId);
      if (!result.ok) { setError(result.error); return; }
      setServerSession((current) => current ? { ...current, exercises: current.exercises.map((item) => item.id === exercise.id ? { ...item, sets: item.sets.filter((set) => set.id !== setId) } : item) } : current);
    });
  }

  function finish() {
    if (!activeSession.exercises.some((exercise) => exercise.sets.some((set) => set.type === "working" && set.completedAt))) { setError("Complete at least one working set before finishing your workout."); return; }
    if (!window.confirm("Finish this workout and add it to your history?")) return;
    startTransition(async () => {
      const finishedAt = new Date().toISOString();
      if (demoMode) {
        store.dispatch({ type: "session.finish", sessionId: activeSession.id, finishedAt });
        router.push("/history/" + activeSession.id);
        return;
      }
      const result = await finishWorkoutAction(activeSession.id);
      if (!result.ok) { setError(result.error); return; }
      router.push("/history/" + activeSession.id);
    });
  }

  function cancel() {
    if (!window.confirm("Cancel this workout? It will not appear in completed history.")) return;
    startTransition(async () => {
      if (demoMode) {
        store.dispatch({ type: "session.cancel", sessionId: activeSession.id, finishedAt: new Date().toISOString() });
        router.push("/workouts/new");
        return;
      }
      const result = await cancelWorkoutAction(activeSession.id);
      if (!result.ok) { setError(result.error); return; }
      router.push("/workouts/new");
    });
  }

  const restRemaining = restEndsAt === null ? 0 : Math.max(0, Math.ceil((restEndsAt - now) / 1000));
  return (
    <Container className="py-7 pb-28 sm:py-10 sm:pb-28 lg:py-12">
      <div className="mb-6 flex items-center justify-between gap-3"><Link className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-foreground" href="/workouts/new"><span aria-hidden="true">←</span> Workouts</Link><Tag tone="success">In progress · {formatDuration(session.startedAt, null, now)}</Tag></div>
      <PageHeading eyebrow="One set at a time" title={session.routineId ? "Your planned workout" : "Training session"} description={session.exercises.length + " exercises · " + session.weightUnit.toUpperCase() + " weights"} />
      {demoMode && <div className="mb-4"><Notice kind="info">This workout saves locally in your browser. It does not write to Supabase.</Notice></div>}
      {error && <div className="mb-4"><Notice>{error}</Notice></div>}
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="p-4 sm:p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><label className="text-xs font-medium text-muted" htmlFor="add-session-exercise">Add movement</label><select className="mt-2 min-h-11 w-full rounded-control border border-border bg-surface-raised px-3 text-[16px] capitalize outline-none focus:border-accent/70 sm:min-w-64" id="add-session-exercise" onChange={(event) => setSelectedExercise(event.target.value)} value={selectedExercise}><option value="">Choose exercise…</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></div><Button disabled={!selectedExercise || pending} onClick={addExercise} variant="secondary">Add exercise</Button></div></Card>
        <Card className="flex items-center justify-between gap-3 p-4 sm:p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Rest timer</p><p aria-live="off" className="mt-1 text-2xl font-semibold tabular-nums">{restRemaining ? Math.floor(restRemaining / 60) + ":" + String(restRemaining % 60).padStart(2, "0") : "Ready"}</p>{restFinished && <span className="sr-only" role="status">Rest timer complete.</span>}</div><div className="flex flex-wrap justify-end gap-2"><select aria-label="Rest duration" className="min-h-9 rounded-control border border-border bg-surface-raised px-2 text-sm" onChange={(event) => setRestDuration(Number(event.target.value))} value={restDuration}>{[30, 45, 60, 90, 120, 180].map((seconds) => <option key={seconds} value={seconds}>{seconds} sec</option>)}</select><Button onClick={() => { setRestFinished(false); setRestEndsAt(restRemaining ? null : Date.now() + restDuration * 1000); }} size="small" variant="secondary">{restRemaining ? "Skip" : "Start"}</Button></div></Card>
      </div>
      {session.exercises.length ? <ol className="grid gap-4">{[...session.exercises].sort((a, b) => a.position - b.position).map((exercise, index) => {
        const exerciseProgress = demoMode ? getDemoProgress(store.data.sessions, exercise.exerciseId) : progress[exercise.exerciseId] ?? null;
        return <li key={exercise.id}><ExerciseWorkoutCard exercise={exercise} index={index} unit={session.weightUnit} progress={exerciseProgress} pending={pending} onAddSet={addSet} onSaveSet={saveSet} onDeleteSet={deleteSet} onStartRest={() => { setRestFinished(false); setRestEndsAt(Date.now() + restDuration * 1000); }} /></li>;
      })}</ol> : <Card className="p-8 text-center sm:p-12"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-xl text-accent-bright" aria-hidden="true">↗</div><h2 className="mt-4 text-lg font-semibold">Add your first exercise</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Choose a movement above. Your sets will be saved as you log them.</p></Card>}
      <div className="fixed inset-x-0 bottom-[calc(4.2rem+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-xl gap-3 px-4 lg:bottom-5"><Button className="flex-1 shadow-lg" disabled={pending} onClick={finish}>{pending ? "Saving…" : "Finish workout"}</Button><Button disabled={pending} onClick={cancel} variant="secondary">Cancel</Button></div>
    </Container>
  );
}

function getDemoProgress(sessions: WorkoutSession[], exerciseId: string): ProgressSummary {
  const completed = sessions.filter((session) => session.status === "completed").sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt));
  const performances = completed.flatMap((session) => {
    const exercise = session.exercises.find((item) => item.exerciseId === exerciseId);
    return (exercise?.sets ?? []).filter((set) => set.type === "working" && set.completedAt && set.weightKg !== null && set.reps !== null).map((set) => ({ date: session.finishedAt ?? session.startedAt, weightKg: set.weightKg ?? 0, reps: set.reps ?? 0 }));
  });
  const previous = completed.find((session) => session.exercises.some((item) => item.exerciseId === exerciseId));
  const prevSets = (previous?.exercises.find((item) => item.exerciseId === exerciseId)?.sets ?? []).filter((set) => set.type === "working" && set.completedAt && set.weightKg !== null && set.reps !== null);
  const previousTop = [...prevSets].sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))[0];
  const best = [...performances].sort((a, b) => b.weightKg - a.weightKg)[0];
  return { previous: previous && previousTop ? { date: previous.finishedAt ?? previous.startedAt, topWeightKg: previousTop.weightKg ?? 0, reps: previousTop.reps ?? 0 } : null, record: best ? { weightKg: best.weightKg, reps: best.reps, date: best.date } : null };
}

function ExerciseWorkoutCard({ exercise, index, unit, progress, pending, onAddSet, onSaveSet, onDeleteSet, onStartRest }: { exercise: SessionExercise; index: number; unit: WorkoutSession["weightUnit"]; progress: ProgressSummary | null; pending: boolean; onAddSet: (exercise: SessionExercise, type: "warmup" | "working") => void; onSaveSet: (exerciseId: string, set: WorkoutSet, values: { reps: number | null; weightKg: number | null; completedAt: string | null }) => Promise<boolean>; onDeleteSet: (exercise: SessionExercise, setId: string) => void; onStartRest: () => void }) {
  const completedCount = exercise.sets.filter((set) => set.type === "working" && set.completedAt).length;
  return <Card className="overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface-raised/60 p-4 sm:p-5"><div className="flex min-w-0 gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-xs font-semibold text-accent-bright">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{exercise.name}</h2><div className="mt-1 flex flex-wrap gap-2"><Tag>{exercise.primaryMuscleGroup}</Tag><Tag tone="success">{completedCount} working sets done</Tag></div></div></div><div className="text-right text-xs leading-5 text-muted">{progress?.previous ? <>Last time<br /><strong className="text-foreground">{formatDate(progress.previous.date)} · {formatWorkoutWeight(progress.previous.topWeightKg, unit)} × {progress.previous.reps}</strong></> : "No previous session yet"}</div></div>
    <div className="overflow-x-auto p-4 sm:p-5"><table className="w-full min-w-[540px] border-separate border-spacing-y-2 text-left"><caption className="sr-only">{exercise.name} sets. Enter weight and reps, then mark each set done.</caption><thead><tr className="text-[11px] uppercase tracking-wide text-subtle"><th className="w-14 px-2 pb-1">Set</th><th className="px-2 pb-1">Type</th><th className="px-2 pb-1">Weight · {unit}</th><th className="px-2 pb-1">Reps</th><th className="w-28 px-2 pb-1">Status</th><th className="w-12 px-2 pb-1"><span className="sr-only">Delete</span></th></tr></thead><tbody>{[...exercise.sets].sort((a, b) => a.position - b.position).map((set, setIndex) => <WorkoutSetRow exerciseId={exercise.id} key={set.id + "-" + (set.reps ?? "") + "-" + (set.weightKg ?? "") + "-" + (set.completedAt ?? "")} set={set} setNumber={setIndex + 1} unit={unit} pending={pending} onSave={onSaveSet} onDelete={() => onDeleteSet(exercise, set.id)} onStartRest={onStartRest} />)}</tbody></table>
      <div className="mt-3 flex flex-wrap gap-2"><Button disabled={pending} onClick={() => onAddSet(exercise, "working")} size="small" variant="secondary">+ Add working set</Button><Button disabled={pending} onClick={() => onAddSet(exercise, "warmup")} size="small" variant="quiet">+ Warm-up</Button></div>
      {progress?.record && <p className="mt-4 text-xs text-muted">Personal best · <strong className="text-accent-bright">{formatWorkoutWeight(progress.record.weightKg, "kg")} × {progress.record.reps}</strong></p>}
    </div></Card>;
}

function WorkoutSetRow({ exerciseId, set, setNumber, unit, pending, onSave, onDelete, onStartRest }: { exerciseId: string; set: WorkoutSet; setNumber: number; unit: WorkoutSession["weightUnit"]; pending: boolean; onSave: (exerciseId: string, set: WorkoutSet, values: { reps: number | null; weightKg: number | null; completedAt: string | null }) => Promise<boolean>; onDelete: () => void; onStartRest: () => void }) {
  const [repsText, setRepsText] = useState(set.reps?.toString() ?? "");
  const [weightText, setWeightText] = useState(set.weightKg === null ? "" : kgToWeight(set.weightKg, unit).toString());
  const [error, setError] = useState("");
  const reps = repsText.trim() === "" ? null : Number(repsText);
  const weight = weightText.trim() === "" ? null : Number(weightText);
  const values = { reps: reps !== null && Number.isFinite(reps) && Number.isInteger(reps) ? reps : null, weightKg: weight !== null && Number.isFinite(weight) ? weightToKg(weight, unit) : null };
  async function save(completedAt: string | null) {
    setError("");
    if (completedAt && (values.reps === null || values.reps < 1 || values.weightKg === null || values.weightKg < 0)) { setError("Enter whole-number reps and a valid weight first."); return false; }
    const success = await onSave(exerciseId, set, { ...values, completedAt });
    if (!success) setError("Save failed. Try again.");
    return success;
  }

  return <tr className={set.completedAt ? "align-top bg-success/5" : "align-top bg-surface-raised/65"}><td className="rounded-l-control px-2 py-2.5 text-sm font-semibold tabular-nums">{setNumber}</td><td className="px-2 py-2.5"><Tag tone={set.type === "warmup" ? "neutral" : "accent"}>{set.type}</Tag></td><td className="px-2 py-2"><label className="sr-only" htmlFor={"weight-" + set.id}>Weight in {unit} for set {setNumber}</label><input aria-describedby={error ? "set-error-" + set.id : undefined} aria-invalid={Boolean(error)} autoComplete="off" className="min-h-10 w-24 rounded-control border border-border bg-surface px-2.5 text-[16px] tabular-nums outline-none focus:border-accent/70" id={"weight-" + set.id} inputMode="decimal" min="0" onBlur={(event) => { if (!(event.relatedTarget instanceof HTMLButtonElement)) void save(set.completedAt); }} onChange={(event) => setWeightText(event.target.value)} placeholder="0" step="0.5" type="number" value={weightText} /></td><td className="px-2 py-2"><label className="sr-only" htmlFor={"reps-" + set.id}>Reps for set {setNumber}</label><input aria-describedby={error ? "set-error-" + set.id : undefined} aria-invalid={Boolean(error)} autoComplete="off" className="min-h-10 w-20 rounded-control border border-border bg-surface px-2.5 text-[16px] tabular-nums outline-none focus:border-accent/70" id={"reps-" + set.id} inputMode="numeric" min="1" onBlur={(event) => { if (!(event.relatedTarget instanceof HTMLButtonElement)) void save(set.completedAt); }} onChange={(event) => setRepsText(event.target.value)} placeholder="0" step="1" type="number" value={repsText} /></td><td className="px-2 py-2"><button aria-label={set.completedAt ? "Mark set " + setNumber + " incomplete" : "Complete set " + setNumber} className={set.completedAt ? "min-h-10 min-w-24 rounded-control bg-success/15 px-3 text-xs font-semibold text-success" : "min-h-10 min-w-24 rounded-control bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-bright"} disabled={pending} onClick={() => { if (set.completedAt) void save(null).then((saved) => { if (saved) onStartRest(); }); else void save(new Date().toISOString()).then((saved) => { if (saved) onStartRest(); }); }} type="button">{set.completedAt ? "✓ Done" : "Complete"}</button>{error && <p className="mt-1 max-w-24 text-[10px] leading-4 text-danger" id={"set-error-" + set.id} role="alert">{error}</p>}</td><td className="rounded-r-control px-2 py-2"><button aria-label={"Delete set " + setNumber} className="grid min-h-10 min-w-10 place-items-center rounded-control text-muted hover:bg-danger/10 hover:text-danger" disabled={pending} onClick={onDelete} type="button">×</button></td></tr>;
}
