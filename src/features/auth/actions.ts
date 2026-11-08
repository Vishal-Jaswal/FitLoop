"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/supabase/server";
import { SupabaseConfigurationError } from "@/infrastructure/database/supabase/config";
import {
  clearLocalDemoSession,
  isLocalDemoAuthEnabled,
  startLocalDemoSession,
} from "@/infrastructure/auth/local-demo-auth";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { createProfile } from "@/services/profile-service";
import { credentialsSchema, profileSchema, type AuthActionState } from "@/shared/validation/auth";

function getFriendlyError(error: unknown): string {
  if (error instanceof SupabaseConfigurationError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function getValidationState(
  issues: readonly { message: string; path: readonly PropertyKey[] }[],
): AuthActionState {
  const issue = issues[0];
  if (!issue) return { error: "Check your details and try again." };

  const field = issue.path[0];
  if (field === "email" || field === "username" || field === "password" || field === "displayName") {
    const fieldErrors: NonNullable<AuthActionState["fieldErrors"]> = {};
    fieldErrors[field] = issue.message;
    return { fieldErrors };
  }

  return { error: issue.message };
}

export async function loginAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (isLocalDemoAuthEnabled()) {
    if (formData.get("username") !== "test") {
      return { fieldErrors: { username: "Use the local demo username: test." } };
    }
    if (formData.get("password") !== "test") {
      return { fieldErrors: { password: "Use the local demo password: test." } };
    }

    try {
      await startLocalDemoSession();
    } catch (error) {
      return { error: getFriendlyError(error) };
    }

    redirect("/dashboard");
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return getValidationState(parsed.error.issues);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: "Those sign-in details did not work. Check them and try again." };
  } catch (error) {
    return { error: getFriendlyError(error) };
  }

  redirect("/dashboard");
}

export async function signUpAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (isLocalDemoAuthEnabled()) {
    return { error: "Local demo mode does not create accounts. Sign in with test / test instead." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return getValidationState(parsed.error.issues);

  let signedIn = false;
  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/profile/setup` },
    });

    if (error) return { error: error.message };
    signedIn = Boolean(data.session);
  } catch (error) {
    return { error: getFriendlyError(error) };
  }

  if (signedIn) redirect("/profile/setup");
  return { message: "Check your email for a confirmation link to finish creating your account." };
}

export async function saveProfileAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = profileSchema.safeParse({ displayName: formData.get("displayName") });
  if (!parsed.success) return getValidationState(parsed.error.issues);

  let userId: string | null;
  try {
    userId = await getAuthenticatedUserId();
    if (userId) await createProfile(userId, parsed.data.displayName);
  } catch (error) {
    return { error: getFriendlyError(error) };
  }

  if (!userId) redirect("/login");

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  if (isLocalDemoAuthEnabled()) {
    await clearLocalDemoSession();
    revalidatePath("/", "layout");
    redirect("/");
  }

  let logoutFailed = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    logoutFailed = Boolean(error);
  } catch {
    logoutFailed = true;
  }

  revalidatePath("/", "layout");
  redirect(logoutFailed ? "/login?error=logout" : "/");
}
