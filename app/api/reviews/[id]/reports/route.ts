import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToAdmins } from "@/lib/firebase/sendPush";
import type { ReviewReportReason } from "@/types/db";

const REASON_LABEL: Record<ReviewReportReason, string> = {
  spam: "스팸/광고",
  abuse: "욕설/혐오",
  inappropriate: "부적절한 내용",
  irrelevant: "관련 없는 내용",
  other: "기타",
};

const VALID_REASONS: ReviewReportReason[] = [
  "spam",
  "abuse",
  "inappropriate",
  "irrelevant",
  "other",
];

const DETAIL_MAX = 500;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/reviews/[id]/reports — 누구나 신고 가능
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { id: reviewId } = await ctx.params;

  let body: { reason?: string; detail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const reason = body.reason as ReviewReportReason | undefined;
  const detail = body.detail?.trim();

  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ message: "올바른 신고 사유를 선택해주세요." }, { status: 400 });
  }
  if (reason === "other" && (!detail || detail.length === 0)) {
    return NextResponse.json({ message: "기타 사유는 상세 내용을 입력해주세요." }, { status: 400 });
  }
  if (detail && detail.length > DETAIL_MAX) {
    return NextResponse.json(
      { message: `상세 내용은 ${DETAIL_MAX}자 이내여야 합니다.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // 후기 존재 확인 + 본인 글 신고 차단
  const { data: review, error: fetchErr } = await supabase
    .from("reviews")
    .select("id, user_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ message: fetchErr.message }, { status: 500 });
  }
  if (!review) {
    return NextResponse.json({ message: "후기를 찾을 수 없습니다." }, { status: 404 });
  }

  let reporterId: string | null = null;
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (oauthId) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", oauthId)
      .maybeSingle();
    reporterId = (dbUser?.id as string | undefined) ?? null;

    // 본인 글 신고 차단 (로그인 본인 매칭 시)
    if (reporterId && review.user_id === reporterId) {
      return NextResponse.json(
        { message: "본인이 작성한 후기는 신고할 수 없습니다." },
        { status: 403 },
      );
    }
  }

  const { error } = await supabase.from("review_reports").insert({
    review_id: reviewId,
    reporter_id: reporterId,
    reason,
    detail: detail ?? null,
  });

  if (error) {
    console.error("[POST /api/reviews/:id/reports] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  void sendPushToAdmins({
    title: "새 후기 신고",
    body: `사유: ${REASON_LABEL[reason]}`,
    link: "/admin",
  }).catch((err) => console.error("[review-reports] push 실패", err));

  return NextResponse.json({ ok: true });
}
