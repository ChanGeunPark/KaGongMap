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
  if (error) return null;
  return (data?.id as string | undefined) ?? null;
}

async function bumpCount(cafeId: string, delta: 1 | -1) {
  const supabase = createAdminClient();
  return supabase.rpc("bump_cafe_like_count", {
    p_cafe_id: cafeId,
    p_delta: delta,
  });
}

interface RouteCtx {
  params: Promise<{ cafeId: string }>;
}

// POST /api/likes/[cafeId] → 좋아요 추가 (로그인/비로그인 모두)
export async function POST(_: Request, ctx: RouteCtx) {
  const { cafeId } = await ctx.params;
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  const supabase = createAdminClient();

  if (!oauthId) {
    const { error } = await bumpCount(cafeId, 1);
    if (error) {
      console.error("[POST /api/likes/:cafeId anon] error", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ liked: true, anonymous: true });
  }

  const userPk = await resolveUserPk(oauthId);
  if (!userPk) {
    return NextResponse.json({ message: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  const { error } = await supabase
    .from("cafe_likes")
    .upsert(
      { user_id: userPk, cafe_id: cafeId },
      { onConflict: "user_id,cafe_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("[POST /api/likes/:cafeId] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ liked: true });
}

// DELETE /api/likes/[cafeId] → 좋아요 해제 (로그인/비로그인 모두)
export async function DELETE(_: Request, ctx: RouteCtx) {
  const { cafeId } = await ctx.params;
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  const supabase = createAdminClient();

  if (!oauthId) {
    const { error } = await bumpCount(cafeId, -1);
    if (error) {
      console.error("[DELETE /api/likes/:cafeId anon] error", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ liked: false, anonymous: true });
  }

  const userPk = await resolveUserPk(oauthId);
  if (!userPk) {
    return NextResponse.json({ message: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  const { error } = await supabase
    .from("cafe_likes")
    .delete()
    .eq("user_id", userPk)
    .eq("cafe_id", cafeId);

  if (error) {
    console.error("[DELETE /api/likes/:cafeId] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ liked: false });
}
