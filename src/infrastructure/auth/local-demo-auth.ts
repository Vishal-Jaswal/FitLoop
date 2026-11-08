import { cookies } from "next/headers";

const LOCAL_DEMO_COOKIE = "fitloop-local-demo";

export function isLocalDemoAuthEnabled(): boolean {
  const hasSupabaseSetting = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return process.env.NODE_ENV === "development" && !hasSupabaseSetting;
}

export async function hasLocalDemoSession(): Promise<boolean> {
  if (!isLocalDemoAuthEnabled()) return false;
  const cookieStore = await cookies();
  return cookieStore.get(LOCAL_DEMO_COOKIE)?.value === "active";
}

export async function startLocalDemoSession(): Promise<void> {
  if (!isLocalDemoAuthEnabled()) throw new Error("Local demo authentication is disabled.");
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_DEMO_COOKIE, "active", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export async function clearLocalDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_DEMO_COOKIE);
}
