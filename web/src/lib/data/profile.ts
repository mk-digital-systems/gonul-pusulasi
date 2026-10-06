import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/user";

export type AccountStatus = "active" | "paused" | "deletion_requested" | "suspended";
export type ProfileGender = "woman" | "man";

export type Account = {
  user_id: string;
  status: AccountStatus;
  onboarding_completed_at: string | null;
  paused_at: string | null;
  deletion_requested_at: string | null;
};

export type Profile = {
  user_id: string;
  display_name: string | null;
  date_of_birth: string | null;
  birth_date_confirmed_at: string | null;
  gender: ProfileGender | null;
  city_id: number | null;
  relationship_goal_code: string | null;
  age_preference_min: number | null;
  age_preference_max: number | null;
};

export type City = { id: number; name: string };
export type RelationshipGoal = { code: string; label: string };

export async function getMyAccountAndProfile() {
  const user = await requireUser();
  const supabase = await createClient();

  const [accountResult, profileResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("user_id,status,onboarding_completed_at,paused_at,deletion_requested_at")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select(
        "user_id,display_name,date_of_birth,birth_date_confirmed_at,gender,city_id,relationship_goal_code,age_preference_min,age_preference_max",
      )
      .eq("user_id", user.id)
      .single(),
  ]);

  if (accountResult.error || profileResult.error) {
    throw new Error("Hesap bilgileri okunamadı. Faz 1 migration dosyalarının uygulandığını kontrol edin.");
  }

  return {
    user,
    account: accountResult.data as Account,
    profile: profileResult.data as Profile,
  };
}

export async function getProfileOptions() {
  const supabase = await createClient();
  const [citiesResult, goalsResult] = await Promise.all([
    supabase.from("cities").select("id,name").eq("is_active", true).order("id"),
    supabase
      .from("relationship_goals")
      .select("code,label")
      .eq("is_active", true)
      .order("display_order"),
  ]);

  if (citiesResult.error || goalsResult.error) {
    throw new Error("Profil seçenekleri yüklenemedi. Migration kurulumunu kontrol edin.");
  }

  return {
    cities: citiesResult.data as City[],
    goals: goalsResult.data as RelationshipGoal[],
  };
}
