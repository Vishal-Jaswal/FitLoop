import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link aria-label="FitLoop home" className="inline-flex items-center gap-2.5" href="/">
      <span className="grid size-8 place-items-center rounded-[11px] bg-accent text-base font-bold leading-none text-white shadow-[0_5px_18px_rgba(255,113,56,0.3)]" aria-hidden="true">
        f
      </span>
      {!compact ? <span className="text-[17px] font-semibold tracking-[-0.04em]">fitloop</span> : null}
    </Link>
  );
}
