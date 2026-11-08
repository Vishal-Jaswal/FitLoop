import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-[var(--shadow-panel)] ${className}`}
      {...props}
    />
  );
}
