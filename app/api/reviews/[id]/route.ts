import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPin } from "@/lib/pinHash";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// DELETE /api/reviews/[id]
//   로그인:    본인 user_id 매칭으로 삭제
//   비로그인:  body { password } — password_hash 검증 후 삭제
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { id: reviewId } = await ctx.params;
  const supabase = createAdminClient();

  const { data: review, error: fetchErr } = await supabase
    .from("reviews")
    .select("id, user_id, password_hash")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ message: fetchErr.message }, { status: 500 });
  }
  if (!review) {
    return NextResponse.json({ message: "후기를 찾을 수 없습니다." }, { status: 404 });
  }

  if (review.user_id) {
    // 로그인 후기 → 세션 user_id 매칭
    const session = await getServerSession(authOptions);
    const oauthId = (session?.user as { id?: string } | undefined)?.id;
    if (!oauthId) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", oauthId)
      .maybeSingle();

    if (!dbUser || dbUser.id !== review.user_id) {
      return NextResponse.json({ message: "삭제 권한이 없습니다." }, { status: 403 });
    }
  } else {
    // 익명 후기 → password 검증
    let body: { password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "비밀번호를 입력해주세요." }, { status: 400 });
    }

    const password = body.password?.trim();
    if (!password || !review.password_hash || !verifyPin(password, review.password_hash)) {
      return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 403 });
    }
  }

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) {
    console.error("[DELETE /api/reviews/:id] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
