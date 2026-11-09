"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useDemoWorkout } from "./demo-workout-store";
import type { Exercise, ProgressSummary } from "./types";
import { formatDate, formatWorkoutWeight, PageHeading, Tag } from "./workout-ui";

export function ExerciseDetail({ exercise, initialProgress }: { exercise: Exercise; initialProgress: ProgressSummary }) {
  const { enabled, data } = useDemoWorkout();
  const progress = useMemo(() => {
    if (!enabled) return initialProgress;
    const completed = data.sessions.filter((session) => session.status === "completed").sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt));
    const performances = completed.flatMap((session) => {
      const item = session.exercises.find((entry) => entry.exerciseId === exercise.id);
      return (item?.sets ?? []).filter((set) => set.type === "working" && set.completedAt && set.weightKg !== null && set.reps !== null).map((set) => ({
        date: session.finishedAt ?? session.startedAt,
        weightKg: set.weightKg ?? 0,
        reps: set.reps ?? 0,
      }));
    });
    const previousSession = completed.find((session) => session.exercises.some((item) => item.exerciseId === exercise.id));
    const previousSets = (previousSession?.exercises.find((item) => item.exerciseId === exercise.id)?.sets ?? []).filter((set) => set.type === "working" && set.completedAt && set.weightKg !== null && set.reps !== null);
    const previousTop = [...previousSets].sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))[0];
    const best = [...performances].sort((a, b) => b.weightKg - a.weightKg)[0];
    return {
      previous: previousSession && previousTop ? { date: previousSession.finishedAt ?? previousSession.startedAt, topWeightKg: previousTop.weightKg ?? 0, reps: previousTop.reps ?? 0 } : null,
      record: best ? { weightKg: best.weightKg, reps: best.reps, date: best.date } : null,
    };
  }, [data.sessions, enabled, exercise.id, initialProgress]);

  return (
    <Container className="py-8 sm:py-11 lg:py-14">
      <Link className="mb-7 inline-flex min-h-10 items-center gap-2 text-sm text-muted transition hover:text-foreground" href="/exercises"><span aria-hidden="true">←</span> Exercise library</Link>
      <PageHeading eyebrow="Exercise details" title={exercise.name} description={exercise.instructions} action={<Tag tone="accent">{exercise.equipment}</Tag>} />
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Muscles and setup</h2>
          <div className="mt-4 flex flex-wrap gap-2"><Tag tone="accent">Primary · {exercise.primaryMuscleGroup}</Tag>{exercise.secondaryMuscles.map((muscle) => <Tag key={muscle}>{muscle}</Tag>)}</div>
          <div className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div><p className="text-xs uppercase tracking-wide text-subtle">Equipment</p><p className="mt-2 capitalize">{exercise.equipment}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-subtle">Training focus</p><p className="mt-2 capitalize">{exercise.primaryMuscleGroup}</p></div>
          </div>
        </Card>
        <Card className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Your progression</p>
          <h2 className="mt-2 text-lg font-semibold">Recent performance</h2>
          {progress.previous ? <p className="mt-4 text-sm leading-6 text-muted">Last time · {formatDate(progress.previous.date)}<br /><strong className="font-semibold text-foreground">{formatWorkoutWeight(progress.previous.topWeightKg, "kg")} × {progress.previous.reps}</strong></p> : <p className="mt-4 text-sm leading-6 text-muted">Log a working set to start building your history.</p>}
          {progress.record ? <div className="mt-5 rounded-control border border-accent/25 bg-accent-soft p-4"><p className="text-xs uppercase tracking-wide text-accent-bright">Best working weight</p><p className="mt-1 text-xl font-semibold">{formatWorkoutWeight(progress.record.weightKg, "kg")} × {progress.record.reps}</p><p className="mt-1 text-xs text-muted">Set on {formatDate(progress.record.date)}</p></div> : <div className="mt-5 rounded-control border border-border bg-surface-raised p-4 text-xs leading-5 text-muted">Your personal record will appear after your first completed workout.</div>}
        </Card>
      </div>
      <div className="mt-6 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-bright" href={`/workouts/new?exercise=${encodeURIComponent(exercise.id)}`}>Start with this exercise</Link><Link className="inline-flex min-h-11 items-center justify-center rounded-control border border-border px-5 text-sm font-semibold hover:bg-surface-raised" href="/routines">View routines</Link></div>
    </Container>
  );
}
