"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useDemoWorkout } from "./demo-workout-store";
import type { Routine } from "./types";
import { Notice, PageHeading, Tag } from "./workout-ui";
import { createRoutineAction, deleteRoutineAction, duplicateRoutineAction } from "./actions";

function newId(): string { return globalThis.crypto.randomUUID(); }

export function RoutineLibrary({ initialRoutines, demoMode }: { initialRoutines: Routine[]; demoMode: boolean }) {
  const router = useRouter();
  const store = useDemoWorkout();
  const [routines, setRoutines] = useState(initialRoutines);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const visibleRoutines = demoMode ? store.data.routines : routines;

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanName = name.trim();
    if (cleanName.length < 2) { setError("Give your routine a name with at least 2 characters."); return; }
    startTransition(async () => {
      if (demoMode) {
        const now = new Date().toISOString();
        const routine: Routine = { id: newId(), name: cleanName, description: description.trim() || null, createdAt: now, updatedAt: now, exercises: [] };
        store.dispatch({ type: "routine.create", routine });
        router.push(`/routines/${routine.id}`);
        return;
      }
      const result = await createRoutineAction({ name: cleanName, description: description.trim() || null });
      if (!result.ok) { setError(result.error); return; }
      setRoutines((items) => [result.data, ...items]);
      router.push(`/routines/${result.data.id}`);
    });
  }

  function duplicate(routine: Routine) {
    startTransition(async () => {
      if (demoMode) {
        const copy: Routine = { ...routine, id: newId(), name: `${routine.name} copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), exercises: routine.exercises.map((exercise, position) => ({ ...exercise, id: newId(), position })) };
        store.dispatch({ type: "routine.duplicate", routine: copy });
      } else {
        const result = await duplicateRoutineAction(routine.id);
        if (!result.ok) { setError(result.error); return; }
        setRoutines((items) => [result.data, ...items]);
      }
    });
  }

  function remove(routine: Routine) {
    if (!window.confirm(`Delete ${routine.name}? Completed workouts will stay in history.`)) return;
    startTransition(async () => {
      if (demoMode) store.dispatch({ type: "routine.delete", id: routine.id });
      else {
        const result = await deleteRoutineAction(routine.id);
        if (!result.ok) { setError(result.error); return; }
        setRoutines((items) => items.filter((item) => item.id !== routine.id));
      }
    });
  }

  return (
    <Container className="py-8 sm:py-11 lg:py-14">
      <PageHeading eyebrow="Build a repeatable rhythm" title="Your routines" description="Save a plan for the next time you train, then adjust it as you progress." action={<Tag tone="accent">{visibleRoutines.length} saved</Tag>} />
      {demoMode && <Notice kind="info">Demo routines are stored in this browser only. They are never sent to Supabase.</Notice>}
      {error && <div className="mb-4"><Notice>{error}</Notice></div>}
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="h-fit p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Start a plan</p>
          <h2 className="mt-2 text-xl font-semibold">Create a routine</h2>
          <form className="mt-5 grid gap-4" onSubmit={create}>
            <div className="grid gap-2"><label className="text-sm font-medium" htmlFor="routine-name">Routine name</label><input className="min-h-12 rounded-control border border-border bg-surface-raised px-4 text-[16px] outline-none focus:border-accent/70" id="routine-name" maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Upper body A" required value={name} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium" htmlFor="routine-description">Notes <span className="font-normal text-muted">(optional)</span></label><textarea className="min-h-24 rounded-control border border-border bg-surface-raised px-4 py-3 text-[16px] outline-none focus:border-accent/70" id="routine-description" maxLength={500} onChange={(event) => setDescription(event.target.value)} placeholder="A short note for next time" value={description} /></div>
            <Button disabled={pending} type="submit">{pending ? "Creating…" : "Create routine"}<span aria-hidden="true">↗</span></Button>
          </form>
          <p className="mt-4 text-xs leading-5 text-muted">Add exercises and set targets after you create the routine.</p>
        </Card>
        <section aria-labelledby="saved-routines-heading">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold" id="saved-routines-heading">Saved routines</h2></div>
          {demoMode && !store.ready ? <Card className="p-8 text-center text-sm text-muted" aria-live="polite">Loading your local routines…</Card> : visibleRoutines.length ? <ul className="grid gap-3">
            {visibleRoutines.map((routine) => <li key={routine.id}><Card className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="min-w-0"><h3 className="truncate text-lg font-semibold">{routine.name}</h3><p className="mt-1 line-clamp-2 text-sm text-muted">{routine.description || "Build your plan from the exercise library."}</p><div className="mt-3 flex flex-wrap gap-2"><Tag>{routine.exercises.length} exercises</Tag><Tag>{routine.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0)} planned sets</Tag></div></div><div className="flex shrink-0 flex-wrap gap-2"><Link className="inline-flex min-h-10 items-center justify-center rounded-control bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-bright" href={`/workouts/new?routine=${routine.id}`}>Start</Link><Link className="inline-flex min-h-10 items-center justify-center rounded-control border border-border px-4 text-sm font-semibold hover:bg-surface-raised" href={`/routines/${routine.id}`}>Edit</Link><Button onClick={() => duplicate(routine)} size="small" variant="secondary">Duplicate</Button><Button onClick={() => remove(routine)} size="small" variant="quiet">Delete</Button></div></div></Card></li>)}
          </ul> : <Card className="p-8 text-center sm:p-10"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-xl text-accent-bright" aria-hidden="true">↗</div><h3 className="mt-4 text-lg font-semibold">Your next session starts here</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Create a routine, add a few movements, and set a target that feels right for you.</p><Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-accent-bright underline underline-offset-4" href="/exercises">Browse exercises</Link></Card>}
        </section>
      </div>
    </Container>
  );
}
