import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { nickname?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const nickname = body.nickname?.trim();
  if (!nickname || nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
    return NextResponse.json(
      { message: `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자여야 합니다.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .update({ nickname })
    .eq("user_id", oauthId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[PATCH /api/users/me/nickname] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ message: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ user: data });
}
