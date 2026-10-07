import "server-only";

import { createClient } from "@/lib/supabase/server";

export type BlockedUser = {
  blocked_user_id: string;
  display_name: string;
  blocked_at: string;
};

export async function getMyBlockedUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_blocked_users");

  if (error) {
    throw new Error("Engellenen kullanıcılar yüklenemedi. 0010 migrationını kontrol edin.");
  }

  return (data ?? []) as BlockedUser[];
}
