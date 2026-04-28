import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "userId가 필요합니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/users] supabase error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data ?? null });
}

export async function POST(req: NextRequest) {
  let body: { userId?: string; nickname?: string; avatar_url?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { userId, nickname, avatar_url } = body;

  if (!userId || !nickname) {
    return NextResponse.json(
      { message: "userId, nickname은 필수입니다." },
      { status: 400 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY is not set on the server" },
      { status: 500 },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("users").upsert(
    { user_id: userId, nickname, avatar_url: avatar_url ?? null },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[POST /api/users] supabase error:", error);
    return NextResponse.json({ message: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: true });
}
