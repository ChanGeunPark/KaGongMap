import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

const DELETED_USER_MARKER = "deleted_user";
const DETAIL_MAX = 500;

const VALID_REASONS = [
  "not_useful",
  "missing_features",
  "privacy_concern",
  "too_many_notifications",
  "using_other_service",
  "temporary",
  "other",
] as const;

type DeletionReason = (typeof VALID_REASONS)[number];

function isDeletionReason(value: string | undefined): value is DeletionReason {
  return !!value && VALID_REASONS.includes(value as DeletionReason);
}

// DELETE /api/users/me — 현재 로그인한 사용자의 카공맵 계정 삭제
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { reason?: string; detail?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const reason = body.reason;
  const detail = body.detail?.trim();
  if (!isDeletionReason(reason)) {
    return NextResponse.json(
      { message: "탈퇴 사유를 선택해주세요." },
      { status: 400 },
    );
  }
  if (reason === "other" && !detail) {
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

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();

  if (userError) {
    console.error("[DELETE /api/users/me] user lookup error", userError);
    return NextResponse.json({ message: userError.message }, { status: 500 });
  }

  if (!userRow?.id) {
    return NextResponse.json({ ok: true });
  }

  const userUuid = userRow.id as string;

  const { error: feedbackError } = await supabase
    .from("account_deletion_feedback")
    .insert({
      user_id: userUuid,
      reason,
      detail: detail || null,
    });

  if (feedbackError) {
    // 피드백 테이블 마이그레이션 누락이 탈퇴 자체를 막지 않도록 기록만 남긴다.
    console.error("[DELETE /api/users/me] feedback insert error", feedbackError);
  }

  const cleanupSteps = [
    supabase
      .from("cafe_submissions")
      .update({ user_id: null })
      .eq("user_id", oauthId),
    supabase
      .from("cafe_image_submissions")
      .update({ user_id: null })
      .eq("user_id", oauthId),
    supabase
      .from("cafe_edit_submissions")
      .update({ user_id: DELETED_USER_MARKER })
      .eq("user_id", oauthId),
    supabase.from("fcm_tokens").delete().eq("user_id", userUuid),
  ];

  for (const step of cleanupSteps) {
    const { error } = await step;
    if (error) {
      console.error("[DELETE /api/users/me] cleanup error", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", userUuid);

  if (deleteError) {
    console.error("[DELETE /api/users/me] delete user error", deleteError);
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
