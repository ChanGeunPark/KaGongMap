import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { hashPin, isValidPin } from "@/lib/pinHash";

const CONTENT_MAX = 1000;
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

const HIDE_THRESHOLD = 3;

// GET /api/cafes/[id]/reviews — 후기 목록 (최신순). pending 신고 3개 이상은 숨김.
export async function GET(_: NextRequest, ctx: RouteCtx) {
  const { id: cafeId } = await ctx.params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("id, cafe_id, user_id, nickname, content, created_at")
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/cafes/:id/reviews] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const reviews = data ?? [];
  if (reviews.length === 0) {
    return NextResponse.json({ reviews: [] });
  }

  const ids = reviews.map((r) => r.id as string);
  const { data: pendingReports, error: reportErr } = await supabase
    .from("review_reports")
    .select("review_id")
    .in("review_id", ids)
    .eq("status", "pending");

  if (reportErr) {
    console.error("[GET /api/cafes/:id/reviews] report count error", reportErr);
    return NextResponse.json({ reviews });
  }

  const counts = new Map<string, number>();
  (pendingReports ?? []).forEach((r) => {
    const k = r.review_id as string;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  });

  const visible = reviews.filter((r) => (counts.get(r.id as string) ?? 0) < HIDE_THRESHOLD);
  return NextResponse.json({ reviews: visible });
}

// POST /api/cafes/[id]/reviews — 후기 작성
//   로그인:    body { content }
//   비로그인:  body { content, nickname, password }
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { id: cafeId } = await ctx.params;

  let body: { content?: string; nickname?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ message: "내용을 입력해주세요." }, { status: 400 });
  }
  if (content.length > CONTENT_MAX) {
    return NextResponse.json(
      { message: `내용은 ${CONTENT_MAX}자 이내여야 합니다.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;

  if (oauthId) {
    // 로그인 경로 — users.nickname을 그대로 사용
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id, nickname")
      .eq("user_id", oauthId)
      .maybeSingle();

    if (userErr || !dbUser) {
      return NextResponse.json({ message: "유저를 찾을 수 없습니다." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        cafe_id: cafeId,
        user_id: dbUser.id,
        nickname: dbUser.nickname,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/cafes/:id/reviews authed] error", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ review: data });
  }

  // 비로그인 경로 — 닉네임 + 4자리 PIN 필수
  const nickname = body.nickname?.trim();
  const password = body.password?.trim();

  if (!nickname || nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
    return NextResponse.json(
      { message: `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자여야 합니다.` },
      { status: 400 },
    );
  }
  if (!password || !isValidPin(password)) {
    return NextResponse.json({ message: "비밀번호는 4자리 숫자여야 합니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      cafe_id: cafeId,
      user_id: null,
      nickname,
      content,
      password_hash: hashPin(password),
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/cafes/:id/reviews anon] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}
