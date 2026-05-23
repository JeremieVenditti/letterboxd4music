import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.includes(":")
    ? nextParam
    : "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
