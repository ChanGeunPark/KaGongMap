import { NextResponse } from "next/server";
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
