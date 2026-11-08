import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/infrastructure/database/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/profile/setup";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        url.pathname = next;
        url.search = "";
        return NextResponse.redirect(url);
      }
    } catch {
      // Send the user to sign-in with a clear recovery message.
    }
  }

  url.pathname = "/login";
  url.search = "?error=confirmation";
  return NextResponse.redirect(url);
}
