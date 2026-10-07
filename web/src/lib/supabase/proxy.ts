import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getOptionalSupabasePublicEnv } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getOptionalSupabasePublicEnv();

  // Public marketing pages remain available before local/deployment values are
  // configured. Authenticated routes still fail closed in their server DAL.
  if (!env) return response;

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getClaims validates the access token and refreshes an expired session.
  // Authorization is still repeated inside pages, DAL functions and actions.
  await supabase.auth.getClaims();

  const memberOnlyPrefixes = [
    "/onboarding",
    "/hesabim",
    "/profil",
    "/uyum",
    "/kesfet",
    "/kapi-sorularim",
    "/tanisma-talebi",
    "/talepler",
    "/gorusmeler",
    "/engellenenler",
  ];
  const isMemberOnlyPath = memberOnlyPrefixes.some(
    (prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`),
  );

  if (isMemberOnlyPath) {
    const { data: staffRole } = await supabase.rpc("get_my_staff_role");

    if (staffRole === "admin" || staffRole === "moderator") {
      const redirectResponse = NextResponse.redirect(
        new URL("/yonetim/sikayetler", request.url),
      );

      for (const cookie of response.cookies.getAll()) {
        redirectResponse.cookies.set(cookie);
      }

      return redirectResponse;
    }
  }

  return response;
}
