import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteCtx {
  params: Promise<{ cafeId: string }>;
}

async function resolveUserPk(oauthId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();

  if (error) {
    console.error("[bookmarks/:cafeId] resolveUserPk error", error);
    return null;
  }

  return (data?.id as string | undefined) ?? null;
}

async function requireUserPk(): Promise<
  | { ok: true; userPk: string }
  | { ok: false; response: ReturnType<typeof NextResponse.json> }
> {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 },
      ),
    };
  }

  const userPk = await resolveUserPk(oauthId);
  if (!userPk) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "유저를 찾을 수 없습니다." },
        { status: 404 },
      ),
    };
  }

  return { ok: true, userPk };
}

export async function POST(_: Request, ctx: RouteCtx) {
  const { cafeId } = await ctx.params;
  const user = await requireUserPk();
  if (!user.ok) return user.response;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookmarks")
    .upsert(
      { user_id: user.userPk, cafe_id: cafeId },
      { onConflict: "cafe_id,user_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("[POST /api/bookmarks/:cafeId] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarked: true });
}

export async function DELETE(_: Request, ctx: RouteCtx) {
  const { cafeId } = await ctx.params;
  const user = await requireUserPk();
  if (!user.ok) return user.response;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.userPk)
    .eq("cafe_id", cafeId);

  if (error) {
    console.error("[DELETE /api/bookmarks/:cafeId] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarked: false });
}
