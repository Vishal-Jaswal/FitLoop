"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useDemoWorkout } from "./demo-workout-store";
import type { Exercise, Routine } from "./types";
import { Notice, PageHeading, Tag } from "./workout-ui";
import { addRoutineExerciseAction, removeRoutineExerciseAction, reorderRoutineExercisesAction, updateRoutineAction, updateRoutineExerciseAction } from "./actions";

function newId(): string { return globalThis.crypto.randomUUID(); }

export function RoutineEditor({ routineId, initialRoutine, exercises, demoMode }: { routineId: string; initialRoutine: Routine | null; exercises: Exercise[]; demoMode: boolean }) {
  const store = useDemoWorkout();
  const routine = demoMode ? store.data.routines.find((item) => item.id === routineId) ?? null : initialRoutine;
  if (demoMode && !store.ready) return <Container className="py-12"><Card className="p-8 text-center text-sm text-muted" aria-live="polite">Loading your local routine…</Card></Container>;
  if (!routine) return <Container className="py-12"><Card className="p-8 text-center"><h1 className="text-xl font-semibold">Routine not found</h1><p className="mt-2 text-sm text-muted">This routine may have been deleted or is not available to this account.</p><Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-accent-bright underline underline-offset-4" href="/routines">Back to routines</Link></Card></Container>;
  return <RoutineEditorForm key={routine.id} routineId={routineId} initialRoutine={routine} exercises={exercises} demoMode={demoMode} />;
}

function RoutineEditorForm({ routineId, initialRoutine, exercises, demoMode }: { routineId: string; initialRoutine: Routine; exercises: Exercise[]; demoMode: boolean }) {
  const store = useDemoWorkout();
  const [serverRoutine, setServerRoutine] = useState<Routine>(initialRoutine);
  const [name, setName] = useState(initialRoutine.name);
  const [description, setDescription] = useState(initialRoutine.description ?? "");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();
  const routine = demoMode ? store.data.routines.find((item) => item.id === routineId) ?? initialRoutine : serverRoutine;
  const exerciseById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);

  function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSuccess("");
    const values = { name: name.trim(), description: description.trim() || null };
    if (values.name.length < 2) { setError("Use at least 2 characters for the routine name."); return; }
    startTransition(async () => {
      if (demoMode && routine) {
        store.dispatch({ type: "routine.update", routine: { ...routine, ...values, updatedAt: new Date().toISOString() } });
        setSuccess("Routine details saved."); return;
      }
      const result = await updateRoutineAction(routineId, values);
      if (!result.ok) { setError(result.error); return; }
      setServerRoutine((value) => value ? { ...value, ...values, updatedAt: new Date().toISOString() } : value);
      setSuccess("Routine details saved.");
    });
  }

  function addExercise(event: React.ChangeEvent<HTMLSelectElement>) {
    const exerciseId = event.target.value;
    setSelectedExercise("");
    if (!routine || !exerciseId) return;
    setError(""); setSuccess("");
    startTransition(async () => {
      if (demoMode) {
        store.dispatch({ type: "routine.add-exercise", routineId, exercise: { id: newId(), exerciseId, position: routine.exercises.length, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90 } });
        return;
      }
      const result = await addRoutineExerciseAction(routineId, exerciseId);
      if (!result.ok) { setError(result.error); return; }
      setServerRoutine((value) => value ? { ...value, exercises: [...value.exercises, result.data], updatedAt: new Date().toISOString() } : value);
    });
  }

  function removeExercise(memberId: string) {
    if (!routine) return;
    startTransition(async () => {
      if (demoMode) { store.dispatch({ type: "routine.remove-exercise", routineId, exerciseId: memberId }); return; }
      const result = await removeRoutineExerciseAction(routineId, memberId);
      if (!result.ok) { setError(result.error); return; }
      setServerRoutine((value) => value ? { ...value, exercises: value.exercises.filter((item) => item.id !== memberId).map((item, position) => ({ ...item, position })) } : value);
    });
  }

  function moveExercise(index: number, direction: -1 | 1) {
    if (!routine) return;
    const next = [...routine.exercises];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    const ordered = next.map((item, position) => ({ ...item, position }));
    startTransition(async () => {
      if (demoMode) { store.dispatch({ type: "routine.reorder", routineId, exerciseIds: ordered.map((item) => item.id) }); return; }
      const result = await reorderRoutineExercisesAction(routineId, ordered.map((item) => item.id));
      if (!result.ok) { setError(result.error); return; }
      setServerRoutine((value) => value ? { ...value, exercises: ordered } : value);
    });
  }

  function saveTarget(memberId: string, values: { targetSets: number; targetRepsMin: number; targetRepsMax: number | null; restSeconds: number | null }) {
    if (!routine) return;
    setError(""); setSuccess("");
    if (values.targetRepsMax !== null && values.targetRepsMax < values.targetRepsMin) { setError("Maximum reps must be at least the minimum."); return; }
    startTransition(async () => {
      if (demoMode) { store.dispatch({ type: "routine.target", routineId, exerciseId: memberId, values }); setSuccess("Target saved."); return; }
      const result = await updateRoutineExerciseAction(routineId, memberId, values);
      if (!result.ok) { setError(result.error); return; }
      setServerRoutine((value) => value ? { ...value, exercises: value.exercises.map((item) => item.id === memberId ? { ...item, ...values } : item) } : value);
      setSuccess("Target saved.");
    });
  }

  return (
    <Container className="py-8 sm:py-11 lg:py-14">
      <Link className="mb-7 inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-foreground" href="/routines"><span aria-hidden="true">←</span> Routines</Link>
      <PageHeading eyebrow="Reusable workout plan" title={routine.name} description={`${routine.exercises.length} exercises · ${routine.exercises.reduce((sum, item) => sum + item.targetSets, 0)} planned sets`} action={<Link className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-bright" href={`/workouts/new?routine=${routine.id}`}>Start this routine <span aria-hidden="true" className="ml-2">↗</span></Link>} />
      {demoMode && <div className="mb-4"><Notice kind="info">Changes save in this browser’s local demo workspace.</Notice></div>}
      {error && <div className="mb-4"><Notice>{error}</Notice></div>}{success && <div className="mb-4"><Notice kind="success">{success}</Notice></div>}
      <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <Card className="h-fit p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Routine details</h2>
          <form className="mt-5 grid gap-4" onSubmit={saveDetails}>
            <div className="grid gap-2"><label className="text-sm font-medium" htmlFor="routine-edit-name">Name</label><input className="min-h-12 rounded-control border border-border bg-surface-raised px-4 text-[16px] outline-none focus:border-accent/70" id="routine-edit-name" maxLength={80} onChange={(event) => setName(event.target.value)} required value={name} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium" htmlFor="routine-edit-description">Notes</label><textarea className="min-h-24 rounded-control border border-border bg-surface-raised px-4 py-3 text-[16px] outline-none focus:border-accent/70" id="routine-edit-description" maxLength={500} onChange={(event) => setDescription(event.target.value)} value={description} /></div>
            <Button disabled={pending} type="submit" variant="secondary">Save details</Button>
          </form>
        </Card>
        <section aria-labelledby="routine-exercises-heading">
          <Card className="mb-4 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Plan the session</p><h2 className="mt-1 text-lg font-semibold" id="routine-exercises-heading">Exercises</h2></div>
              <div className="grid gap-2 sm:min-w-64"><label className="text-xs font-medium text-muted" htmlFor="add-routine-exercise">Add an exercise</label><select className="min-h-11 rounded-control border border-border bg-surface-raised px-3 text-sm capitalize outline-none focus:border-accent/70" id="add-routine-exercise" onChange={addExercise} value={selectedExercise}><option value="">Choose from library…</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></div>
            </div>
          </Card>
          {routine.exercises.length ? <ol className="grid gap-3">
            {[...routine.exercises].sort((a, b) => a.position - b.position).map((item, index) => {
              const exercise = exerciseById.get(item.exerciseId);
              return <li key={item.id}><RoutineExerciseCard exercise={exercise} item={item} index={index} total={routine.exercises.length} pending={pending} onMove={moveExercise} onRemove={removeExercise} onSave={saveTarget} /></li>;
            })}
          </ol> : <Card className="p-8 text-center"><p className="font-semibold">Add your first movement</p><p className="mt-2 text-sm text-muted">Choose an exercise above, then set the reps and rest that fit your plan.</p></Card>}
        </section>
      </div>
    </Container>
  );
}

function RoutineExerciseCard({ exercise, item, index, total, pending, onMove, onRemove, onSave }: { exercise?: Exercise; item: Routine["exercises"][number]; index: number; total: number; pending: boolean; onMove: (index: number, direction: -1 | 1) => void; onRemove: (id: string) => void; onSave: (id: string, values: { targetSets: number; targetRepsMin: number; targetRepsMax: number | null; restSeconds: number | null }) => void }) {
  const [sets, setSets] = useState(item.targetSets);
  const [minReps, setMinReps] = useState(item.targetRepsMin);
  const [maxReps, setMaxReps] = useState(item.targetRepsMax ?? item.targetRepsMin);
  const [rest, setRest] = useState(item.restSeconds ?? 90);
  return <Card className="p-4 sm:p-5"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-raised text-xs font-semibold text-muted">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold">{exercise?.name ?? "Exercise unavailable"}</h3><div className="mt-1 flex flex-wrap gap-2"><Tag>{exercise?.primaryMuscleGroup ?? "movement"}</Tag><Tag>{item.targetSets} sets · {item.targetRepsMin}{item.targetRepsMax ? `–${item.targetRepsMax}` : "+"} reps</Tag></div></div><div className="flex gap-1"><button aria-label={`Move ${exercise?.name ?? "exercise"} up`} className="min-h-9 min-w-9 rounded-control border border-border text-sm disabled:opacity-40" disabled={index === 0 || pending} onClick={() => onMove(index, -1)} type="button">↑</button><button aria-label={`Move ${exercise?.name ?? "exercise"} down`} className="min-h-9 min-w-9 rounded-control border border-border text-sm disabled:opacity-40" disabled={index === total - 1 || pending} onClick={() => onMove(index, 1)} type="button">↓</button><button aria-label={`Remove ${exercise?.name ?? "exercise"}`} className="min-h-9 rounded-control px-3 text-xs font-medium text-danger hover:bg-danger/10" disabled={pending} onClick={() => onRemove(item.id)} type="button">Remove</button></div></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumberField id={`sets-${item.id}`} label="Sets" min={1} max={20} value={sets} onChange={setSets} />
            <NumberField id={`min-reps-${item.id}`} label="Min reps" min={1} max={100} value={minReps} onChange={setMinReps} />
            <NumberField id={`max-reps-${item.id}`} label="Max reps" min={1} max={100} value={maxReps} onChange={setMaxReps} />
            <NumberField id={`rest-${item.id}`} label="Rest · sec" min={0} max={900} value={rest} onChange={setRest} />
          </div>
          <div className="mt-3 flex justify-end"><Button disabled={pending} onClick={() => onSave(item.id, { targetSets: sets, targetRepsMin: minReps, targetRepsMax: maxReps, restSeconds: rest })} size="small" variant="secondary">Save targets</Button></div>
        </div></div></Card>;
}

function NumberField({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="grid gap-1.5"><label className="text-[11px] font-medium text-muted" htmlFor={id}>{label}</label><input className="min-h-10 w-full rounded-control border border-border bg-surface-raised px-3 text-[16px] outline-none focus:border-accent/70" id={id} max={max} min={min} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))} type="number" value={value} /></div>;
}
