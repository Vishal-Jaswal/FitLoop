import { createClient } from "@/infrastructure/database/supabase/server";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims || typeof data.claims.sub !== "string") return null;
  return data.claims.sub;
}
