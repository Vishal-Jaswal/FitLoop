import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AuthForm } from "@/features/auth/auth-form";
import { Brand } from "@/components/layout/brand";
import { Container } from "@/components/ui/container";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection();
  const query = await searchParams;
  let notice: string | undefined;
  if (query.error === "confirmation") notice = "That confirmation link could not be verified. Please request a new one and try again.";
  if (query.error === "setup") notice = "Add your Supabase project URL and publishable key to .env.local to use account features.";

  try {
    const userId = await getAuthenticatedUserId();
    if (userId) {
      const profile = await getProfile(userId);
      redirect(profile ? "/dashboard" : "/profile/setup");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Supabase is not configured")) {
      notice ??= "Account access is ready once Supabase is configured. You can still preview the dashboard.";
    } else {
      throw error;
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <Container className="max-w-[1120px] p-0">
        <div className="flex items-center justify-between">
          <Brand />
          <Link className="text-sm text-muted transition hover:text-foreground" href="/">Back to preview</Link>
        </div>
        <div className="mx-auto grid min-h-[calc(100vh-110px)] max-w-[850px] items-center gap-12 py-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          <div className="hidden md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Your health, in rhythm</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-[-0.06em]">Small steps.<br /><span className="text-muted">Stronger days.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted">A thoughtful place to build routines and notice how far you’ve come.</p>
            <div className="mt-9 flex items-center gap-3 text-xs text-subtle"><span className="size-2 rounded-full bg-accent" /> Private beta · Your data stays yours</div>
          </div>
          <section className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-[var(--shadow-panel)] sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Welcome back</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Sign in to FitLoop</h2>
            <p className="mb-7 mt-2 text-sm leading-6 text-muted">Pick up where you left off.</p>
            <AuthForm mode="login" notice={notice} />
          </section>
        </div>
      </Container>
    </main>
  );
}
