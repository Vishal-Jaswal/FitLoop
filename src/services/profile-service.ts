import type { Profile } from "@/infrastructure/database/supabase/database.types";
import { findProfileById, upsertProfile } from "@/infrastructure/database/supabase/profile-repository";

export function getProfile(userId: string): Promise<Profile | null> {
  return findProfileById(userId);
}

export function saveProfile(userId: string, displayName: string): Promise<Profile> {
  return upsertProfile(userId, displayName);
}
