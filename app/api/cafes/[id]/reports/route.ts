import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/server";
import type { CafeReportReason } from "@/types/db";

const REASON_LABEL: Record<CafeReportReason, string> = {
  photo_issue: "사진 문제",
  closed: "가게 없어짐",
  wrong_info: "정보 오류",
  inappropriate_place: "부적절한 장소",
  duplicate: "중복 등록",
  other: "기타",
};

const VALID_REASONS: CafeReportReason[] = [
  "photo_issue",
  "closed",
  "wrong_info",
  "inappropriate_place",
  "duplicate",
  "other",
];

const DETAIL_MAX = 500;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/cafes/[id]/reports — 누구나 카페 신고 가능
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { id: cafeId } = await ctx.params;

  let body: { reason?: string; detail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const reason = body.reason as CafeReportReason | undefined;
  const detail = body.detail?.trim();

  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json(
      { message: "올바른 신고 사유를 선택해주세요." },
      { status: 400 },
    );
  }
  if (reason === "other" && (!detail || detail.length === 0)) {
    return NextResponse.json(
      { message: "기타 사유는 상세 내용을 입력해주세요." },
      { status: 400 },
    );
  }
  if (detail && detail.length > DETAIL_MAX) {
    return NextResponse.json(
      { message: `상세 내용은 ${DETAIL_MAX}자 이내여야 합니다.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: cafe, error: cafeErr } = await supabase
    .from("cafes")
    .select("id, name, user_id")
    .eq("id", cafeId)
    .maybeSingle();

  if (cafeErr) {
    return NextResponse.json({ message: cafeErr.message }, { status: 500 });
  }
  if (!cafe) {
    return NextResponse.json(
      { message: "존재하지 않는 카페입니다." },
      { status: 404 },
    );
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

    // 본인이 등록한 카페는 신고 대신 수정 제안을 사용하도록 막는다.
    if (reporterId && cafe.user_id === reporterId) {
      return NextResponse.json(
        { message: "본인이 등록한 카페는 신고할 수 없습니다." },
        { status: 403 },
      );
    }
  }

  const { error } = await supabase.from("cafe_reports").insert({
    cafe_id: cafeId,
    reporter_id: reporterId,
    reason,
    detail: detail ?? null,
  });

  if (error) {
    console.error("[POST /api/cafes/:id/reports] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  after(async () => {
    try {
      await notifyAdmins("admin_new_cafe_report", {
        cafeName: cafe.name,
        reasonLabel: REASON_LABEL[reason],
      });
    } catch (err) {
      console.error("[cafe-reports] push 실패", err);
    }
  });

  return NextResponse.json({ ok: true });
}
