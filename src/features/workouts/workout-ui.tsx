import type { ReactNode } from "react";
import type { WeightUnit } from "./types";
import { kgToWeight } from "./units";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="text-balance text-display font-semibold tracking-[-0.055em]">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "success" }) {
  const colors = tone === "accent" ? "border-accent/30 bg-accent-soft text-accent-bright" : tone === "success" ? "border-success/25 bg-success/10 text-success" : "border-border bg-surface-raised text-muted";
  return <span className={`inline-flex items-center rounded-pill border px-2.5 py-1 text-[11px] font-medium capitalize ${colors}`}>{children}</span>;
}

export function Notice({ children, kind = "error" }: { children: ReactNode; kind?: "error" | "success" | "info" }) {
  const colors = kind === "success" ? "border-success/25 bg-success/10 text-success" : kind === "info" ? "border-accent/25 bg-accent-soft text-accent-bright" : "border-danger/25 bg-danger/10 text-danger";
  return <p className={`rounded-control border px-4 py-3 text-sm leading-6 ${colors}`} role={kind === "error" ? "alert" : "status"}>{children}</p>;
}

export function formatDuration(startedAt: string, finishedAt: string | null, now = Date.now()): string {
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : now;
  const totalMinutes = Math.max(0, Math.floor((end - start) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
}

export function formatWorkoutWeight(weightKg: number, unit: WeightUnit): string {
  const value = kgToWeight(weightKg, unit);
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(value));
}
