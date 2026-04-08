import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/server/supabase/server";
import { ensureProfileForUser } from "@/server/auth/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=Missing+confirmation+code`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=Auth+not+configured`);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=Confirmation+link+expired+or+invalid`,
    );
  }

  await ensureProfileForUser(data.user);
  return NextResponse.redirect(`${origin}/auth/confirmed`);
}
