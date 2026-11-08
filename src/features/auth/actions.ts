"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/supabase/server";
import { SupabaseConfigurationError } from "@/infrastructure/database/supabase/config";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { saveProfile } from "@/services/profile-service";
import { credentialsSchema, profileSchema, type AuthActionState } from "@/shared/validation/auth";

function getFriendlyError(error: unknown): string {
  if (error instanceof SupabaseConfigurationError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function loginAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

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
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid display name." };

  let userId: string | null;
  try {
    userId = await getAuthenticatedUserId();
    if (userId) await saveProfile(userId, parsed.data.displayName);
  } catch (error) {
    return { error: getFriendlyError(error) };
  }

  if (!userId) redirect("/login");

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Always end the local flow even if the project is temporarily unavailable.
  }
  redirect("/");
}
