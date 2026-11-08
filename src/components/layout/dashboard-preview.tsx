import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const week = [
  { day: "M", height: "h-10", active: true },
  { day: "T", height: "h-16", active: true },
  { day: "W", height: "h-12", active: false },
  { day: "T", height: "h-20", active: true },
  { day: "F", height: "h-14", active: false },
  { day: "S", height: "h-24", active: true },
  { day: "S", height: "h-12", active: false },
];

export function DashboardPreview({ name = "Alex", demoMode = false }: { name?: string; demoMode?: boolean }) {
  return (
    <Container className="py-8 sm:py-11 lg:py-14">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Your weekly overview</p>
          <h1 className="text-balance text-display font-semibold tracking-[-0.055em]">A little progress, <span className="text-muted">every day.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Welcome back, {name}. Your foundation for a more consistent week starts here.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(255,113,56,0.2)] transition hover:bg-accent-bright" href="/signup">Set up your profile <span aria-hidden="true">↗</span></Link>
      </div>

      <section aria-label="Weekly progress" className="grid gap-4 lg:grid-cols-[1.55fr_1fr_1fr]">
        <Card className="relative min-h-64 overflow-hidden p-5 sm:p-7">
          <div className="absolute -right-16 -top-24 size-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted">Weekly consistency</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.06em]">4 <span className="text-lg font-medium text-muted">of 5 days</span></p>
              </div>
              <span className="rounded-pill border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">+1 day this week</span>
            </div>
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {week.map(({ day, height, active }, index) => (
                <div className="flex flex-col items-center gap-2" key={`${day}-${index}`}>
                  <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-surface-raised">
                    <div className={`w-full rounded-lg ${height} ${active ? "bg-gradient-to-t from-accent/55 to-accent" : "bg-surface-hover"}`} />
                  </div>
                  <span className={`text-[11px] ${active ? "text-foreground" : "text-subtle"}`}>{day}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <MetricCard label="Movement" value="38" unit="min" note="Daily goal · 45 min" progress={84} icon="↗" />
        <MetricCard label="Recovery" value="7.8" unit="hrs" note="Rest well, show up well" progress={78} icon="⌁" />
      </section>

      <section aria-label="Get started" className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Your next step</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">Build a routine that fits your life.</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted">Start with the basics. FitLoop will grow with you as you build healthy habits.</p>
            </div>
            <span className="hidden size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-xl text-accent-bright sm:grid" aria-hidden="true">✳</span>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(255,113,56,0.2)] transition hover:bg-accent-bright" href="/signup">Get started <span aria-hidden="true">↗</span></Link>
            <p className="text-xs text-subtle">Private beta · Free to explore</p>
          </div>
        </Card>
        <Card className="flex flex-col justify-between gap-6 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">A balanced day</p>
            <span className="rounded-pill border border-border px-2.5 py-1 text-[10px] text-subtle">PREVIEW</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <PreviewPillar label="Train" symbol="↗" />
            <PreviewPillar label="Fuel" symbol="◌" />
            <PreviewPillar label="Recover" symbol="⌁" />
          </div>
          <p className="text-xs leading-5 text-subtle">One home for your habits, energy, and progress. The first tools are on their way.</p>
        </Card>
      </section>

      <p className="mt-8 text-center text-xs text-subtle">{demoMode ? "Demo values are illustrative and are not saved." : "Preview content is illustrative. Your personal dashboard begins after account setup."}</p>
    </Container>
  );
}

function MetricCard({ label, value, unit, note, progress, icon }: { label: string; value: string; unit: string; note: string; progress: number; icon: string }) {
  return (
    <Card className="flex min-h-64 flex-col justify-between p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-surface-raised text-lg text-accent-bright">{icon}</span>
      </div>
      <div>
        <p className="text-4xl font-semibold tracking-[-0.06em]">{value}<span className="ml-1 text-base font-medium text-muted">{unit}</span></p>
        <p className="mt-2 text-xs text-subtle">{note}</p>
      </div>
      <div aria-label={`${progress}% complete`} className="h-1.5 overflow-hidden rounded-pill bg-surface-raised" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
        <div className="h-full rounded-pill bg-gradient-to-r from-accent to-accent-bright" style={{ width: `${progress}%` }} />
      </div>
    </Card>
  );
}

function PreviewPillar({ label, symbol }: { label: string; symbol: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-raised/70 px-2 py-4">
      <span aria-hidden="true" className="text-lg text-accent">{symbol}</span>
      <span className="text-xs font-medium text-muted">{label}</span>
    </div>
  );
}
