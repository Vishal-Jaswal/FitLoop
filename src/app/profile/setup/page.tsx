import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ProfileSetupForm } from "@/features/profile/profile-setup-form";
import { Brand } from "@/components/layout/brand";
import { Container } from "@/components/ui/container";
import { hasSupabaseConfig } from "@/infrastructure/database/supabase/config";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function ProfileSetupPage() {
  await connection();
  if (!hasSupabaseConfig()) redirect("/login?error=setup");
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const profile = await getProfile(userId);
  if (profile) redirect("/dashboard");

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <Container className="max-w-[1120px] p-0">
        <div className="flex items-center justify-between"><Brand /><Link className="text-sm text-muted hover:text-foreground" href="/">Exit setup</Link></div>
        <div className="mx-auto grid min-h-[calc(100vh-110px)] max-w-[820px] items-center gap-12 py-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          <div className="hidden md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Your space, your pace</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-[-0.06em]">Make FitLoop<br /><span className="text-muted">feel like yours.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted">Choose a name to see across your personal fitness space. You can update it later.</p>
          </div>
          <section className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-[var(--shadow-panel)] sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">One last detail</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Set up your profile</h2>
            <p className="mb-7 mt-2 text-sm leading-6 text-muted">Your profile is private and belongs to your account.</p>
            <ProfileSetupForm />
          </section>
        </div>
      </Container>
    </main>
  );
}
