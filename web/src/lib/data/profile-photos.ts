import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ProfilePhotoStatus = "pending" | "approved" | "rejected";

export type MyProfilePhoto = {
  user_id: string;
  object_path: string;
  byte_size: number;
  width: number;
  height: number;
  status: ProfilePhotoStatus;
  uploaded_at: string;
  reviewed_at: string | null;
  moderation_note: string | null;
};

export async function getMyProfilePhoto() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_photos")
    .select("user_id,object_path,byte_size,width,height,status,uploaded_at,reviewed_at,moderation_note")
    .maybeSingle();

  if (error) {
    throw new Error("Profil fotoğrafı yüklenemedi. 0015 migrationını kontrol edin.");
  }

  return (data ?? null) as MyProfilePhoto | null;
}

export async function getVisibleProfilePhotoUserIds(userIds: string[]) {
  if (userIds.length === 0) return new Set<string>();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_visible_profile_photo_user_ids", {
    p_user_ids: userIds,
  });

  if (error) {
    throw new Error("Görünür profil fotoğrafları yüklenemedi. 0015 migrationını kontrol edin.");
  }

  return new Set((data ?? []).map((row: { user_id: string }) => row.user_id));
}
