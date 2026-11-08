import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AuthForm } from "@/features/auth/auth-form";
import { Brand } from "@/components/layout/brand";
import { Container } from "@/components/ui/container";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  await connection();
  let notice: string | undefined;
  try {
    const userId = await getAuthenticatedUserId();
    if (userId) {
      const profile = await getProfile(userId);
      redirect(profile ? "/dashboard" : "/profile/setup");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Supabase is not configured")) {
      notice = "Account access is ready once Supabase is configured. The dashboard preview is still available.";
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Start with what matters</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-[-0.06em]">A healthier rhythm<br /><span className="text-muted">starts here.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted">Create your space and build a foundation that grows with you.</p>
          </div>
          <section className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-[var(--shadow-panel)] sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Private beta</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Create your account</h2>
            <p className="mb-7 mt-2 text-sm leading-6 text-muted">A few details are all you need to begin.</p>
            <AuthForm mode="signup" notice={notice} />
          </section>
        </div>
      </Container>
    </main>
  );
}
