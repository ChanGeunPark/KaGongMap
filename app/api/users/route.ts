import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateRandomNickname } from "@/lib/randomNickname";

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
  let body: { userId?: string; avatar_url?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { userId, avatar_url } = body;

  if (!userId) {
    return NextResponse.json(
      { message: "userId는 필수입니다." },
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

  // 이미 있으면 닉네임 유지(중복 생성 시 덮어쓰지 않음). 신규일 때만 랜덤 닉네임 부여.
  const { data: existing } = await supabase
    .from("users")
    .select("id, nickname")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("users")
      .update({ avatar_url: avatar_url ?? null })
      .eq("user_id", userId);
    if (error) {
      console.error("[POST /api/users update] supabase error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, created: false });
  }

  const { error } = await supabase.from("users").insert({
    user_id: userId,
    nickname: generateRandomNickname(),
    avatar_url: avatar_url ?? null,
  });

  if (error) {
    console.error("[POST /api/users insert] supabase error:", error);
    return NextResponse.json({ message: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: true });
}
