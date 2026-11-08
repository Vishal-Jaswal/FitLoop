import type { Profile } from "./database.types";
import { createClient } from "./server";

export async function findProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) throw new Error("We could not load your profile. Please try again.");
  return data;
}

export async function upsertProfile(userId: string, displayName: string): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, display_name: displayName }, { onConflict: "id" })
    .select("*")
    .single();

  if (error || !data) throw new Error("We could not save your profile. Please try again.");
  return data;
}
