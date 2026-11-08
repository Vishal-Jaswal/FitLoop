import type { Profile } from "@/infrastructure/database/supabase/database.types";
import { createProfile as insertProfile, findProfileById } from "@/infrastructure/database/supabase/profile-repository";

export function getProfile(userId: string): Promise<Profile | null> {
  return findProfileById(userId);
}

export function createProfile(userId: string, displayName: string): Promise<Profile> {
  return insertProfile(userId, displayName);
}
