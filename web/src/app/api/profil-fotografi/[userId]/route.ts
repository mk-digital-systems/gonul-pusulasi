import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const parsedUserId = z.string().uuid().safeParse((await params).userId);
  if (!parsedUserId.success) return new Response(null, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });

  const { data: objectPath, error: pathError } = await supabase.rpc(
    "get_profile_photo_path",
    { p_user_id: parsedUserId.data },
  );

  if (pathError || typeof objectPath !== "string" || !objectPath) {
    return new Response(null, { status: 404 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("profile-photos")
      .download(objectPath);

    if (error || !data) return new Response(null, { status: 404 });

    return new Response(await data.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(data.size),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
