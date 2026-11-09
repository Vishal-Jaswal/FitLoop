"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useDemoWorkout } from "./demo-workout-store";
import type { WorkoutSession } from "./types";
import { formatDate, formatDuration, formatWorkoutWeight, Notice, PageHeading, Tag } from "./workout-ui";

export function WorkoutHistory({ initialSessions, demoMode }: { initialSessions: WorkoutSession[]; demoMode: boolean }) {
  const store = useDemoWorkout();
  const sessions = useMemo(() => (demoMode ? store.data.sessions : initialSessions).filter((session) => session.status === "completed").sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "")), [demoMode, initialSessions, store.data.sessions]);
  return (
    <Container className="py-8 sm:py-11 lg:py-14">
      <PageHeading eyebrow="Every session adds up" title="Workout history" description="Review your completed training and see how your work is building over time." action={<Tag tone="accent">{sessions.length} completed</Tag>} />
      {demoMode && <div className="mb-5"><Notice kind="info">Demo history is stored in this browser only.</Notice></div>}
      {demoMode && !store.ready ? <Card className="p-8 text-center text-sm text-muted" aria-live="polite">Loading local workout history…</Card> : sessions.length ? <ul className="grid gap-3">
        {sessions.map((session) => {
          const completedSets = session.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completedAt);
          const workingSets = completedSets.filter((set) => set.type === "working");
          return <li key={session.id}><Link className="block" href={"/history/" + session.id}><Card className="p-5 transition hover:border-accent/35 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">{formatDate(session.finishedAt ?? session.startedAt)}</p><h2 className="mt-1 text-lg font-semibold">{session.routineId ? "Routine session" : "Training session"}</h2><p className="mt-1 text-sm text-muted">{session.exercises.length} exercises · {workingSets.length} working sets</p></div><div className="flex items-center gap-3"><Tag>{formatDuration(session.startedAt, session.finishedAt)}</Tag><span aria-hidden="true" className="text-accent-bright">↗</span></div></div><div className="mt-4 flex flex-wrap gap-2">{session.exercises.slice(0, 5).map((exercise) => <Tag key={exercise.id}>{exercise.name}</Tag>)}{session.exercises.length > 5 && <Tag>+{session.exercises.length - 5} more</Tag>}</div></Card></Link></li>;
        })}
      </ul> : <Card className="p-8 text-center sm:p-12"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-xl text-accent-bright" aria-hidden="true">⌁</div><h2 className="mt-4 text-lg font-semibold">Your history begins with one session</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Complete a workout to see its exercises, sets, and duration here.</p><Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-accent-bright underline underline-offset-4" href="/workouts/new">Start a workout</Link></Card>}
    </Container>
  );
}

export function WorkoutHistoryDetail({ sessionId, initialSession, demoMode }: { sessionId: string; initialSession: WorkoutSession | null; demoMode: boolean }) {
  const store = useDemoWorkout();
  const session = demoMode ? store.data.sessions.find((item) => item.id === sessionId && item.status === "completed") ?? null : initialSession;
  if (demoMode && !store.ready) return <Container className="py-12"><Card className="p-8 text-center text-sm text-muted" aria-live="polite">Loading this workout…</Card></Container>;
  if (!session) return <Container className="py-12"><Card className="p-8 text-center"><h1 className="text-xl font-semibold">Workout not found</h1><p className="mt-2 text-sm text-muted">This session is not in your completed history.</p><Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-accent-bright underline underline-offset-4" href="/history">Back to history</Link></Card></Container>;
  const completedSets = session.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completedAt);
  const workingSets = completedSets.filter((set) => set.type === "working");
  const totalVolume = workingSets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
  return (
    <Container className="py-8 sm:py-11 lg:py-14">
      <Link className="mb-7 inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-foreground" href="/history"><span aria-hidden="true">←</span> Workout history</Link>
      <PageHeading eyebrow="Session completed" title={formatDate(session.finishedAt ?? session.startedAt)} description={"Completed in " + formatDuration(session.startedAt, session.finishedAt)} action={<Tag tone="success">{workingSets.length} working sets</Tag>} />
      {demoMode && <div className="mb-5"><Notice kind="info">This session is saved only in your local demo workspace.</Notice></div>}
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><SummaryCard label="Duration" value={formatDuration(session.startedAt, session.finishedAt)} /><SummaryCard label="Exercises" value={String(session.exercises.length)} /><SummaryCard label="Working sets" value={String(workingSets.length)} /></div>
      {session.exercises.length ? <ol className="grid gap-4">{[...session.exercises].sort((a, b) => a.position - b.position).map((exercise, index) => {
        const sets = [...exercise.sets].sort((a, b) => a.position - b.position);
        return <li key={exercise.id}><Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 border-b border-border bg-surface-raised/60 p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-xs font-semibold text-accent-bright">{String(index + 1).padStart(2, "0")}</span><div><h2 className="font-semibold">{exercise.name}</h2><p className="mt-1 text-xs capitalize text-muted">{exercise.primaryMuscleGroup}</p></div></div><Tag>{sets.filter((set) => set.completedAt).length} sets</Tag></div><div className="divide-y divide-border px-4 sm:px-5">{sets.filter((set) => set.completedAt).map((set, setIndex) => <div className="flex items-center justify-between gap-3 py-3 text-sm" key={set.id}><span className="text-muted">{set.type === "warmup" ? "Warm-up" : "Set " + (setIndex + 1)}</span><strong className="font-semibold">{set.weightKg === null ? "—" : formatWorkoutWeight(set.weightKg, session.weightUnit)} × {set.reps ?? "—"}</strong></div>)}</div></Card></li>;
      })}</ol> : <Card className="p-7 text-sm text-muted">This session has no exercise details.</Card>}
      {totalVolume > 0 && <p className="mt-5 text-right text-xs text-muted">Logged load volume · {formatWorkoutWeight(totalVolume, "kg")} total</p>}
      <div className="mt-7 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-bright" href="/workouts/new">Start another workout</Link><Link className="inline-flex min-h-11 items-center justify-center rounded-control border border-border px-5 text-sm font-semibold hover:bg-surface-raised" href="/history">All history</Link></div>
    </Container>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <Card className="p-4 sm:p-5"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></Card>;
}
