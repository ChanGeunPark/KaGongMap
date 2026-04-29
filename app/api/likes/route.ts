import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

async function resolveUserPk(oauthId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();
  if (error) {
    console.error("[likes] resolveUserPk error", error);
    return null;
  }
  return (data?.id as string | undefined) ?? null;
}

// GET /api/likes → 로그인 유저가 좋아요 한 카페 ID 목록
export async function GET() {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const userPk = await resolveUserPk(oauthId);
  if (!userPk) return NextResponse.json({ cafeIds: [] });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cafe_likes")
    .select("cafe_id")
    .eq("user_id", userPk);

  if (error) {
    console.error("[GET /api/likes] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    cafeIds: (data ?? []).map((r) => r.cafe_id as string),
  });
}

// POST /api/likes  body: { cafeIds: string[] }
//   → 로그인 직후 localStorage 배열을 DB에 합집합 머지 (ON CONFLICT DO NOTHING)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { cafeIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const cafeIds = Array.from(new Set((body.cafeIds ?? []).filter((v) => typeof v === "string")));
  if (cafeIds.length === 0) {
    return NextResponse.json({ merged: 0, cafeIds: [] });
  }

  const userPk = await resolveUserPk(oauthId);
  if (!userPk) {
    return NextResponse.json({ message: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  const supabase = createAdminClient();

  // 익명 상태에서 이미 +1 카운트된 좋아요들을 cafe_likes에 합치는 머지.
  // RPC가 INSERT 후 새로 들어간 행 수만큼 like_count -1로 보정해 중복 카운트 방지.
  const { error: mergeError } = await supabase.rpc("merge_anonymous_likes", {
    p_user_id: userPk,
    p_cafe_ids: cafeIds,
  });
  if (mergeError) {
    console.error("[POST /api/likes] merge error", mergeError);
    return NextResponse.json({ message: mergeError.message }, { status: 500 });
  }

  const { data: after } = await supabase
    .from("cafe_likes")
    .select("cafe_id")
    .eq("user_id", userPk);

  return NextResponse.json({
    merged: cafeIds.length,
    cafeIds: (after ?? []).map((r) => r.cafe_id as string),
  });
}
