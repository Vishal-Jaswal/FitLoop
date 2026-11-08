import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/infrastructure/database/supabase/config";
import { updateSession } from "@/infrastructure/database/supabase/update-session";

export async function proxy(request: NextRequest) {
  if (!hasSupabaseConfig()) return NextResponse.next({ request });
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
