import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("cafe_submissions")
    .update({ status: "approved" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  // 승인 트리거가 cafes에 등록자 user_id까지 복사한 뒤,
  // 행은 즉시 삭제해 cafes/cafe_submissions의 데이터 중복을 방지한다.
  const { error: deleteError } = await supabase
    .from("cafe_submissions")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      {
        message: `승인은 완료됐지만 제보 정리에 실패했습니다: ${deleteError.message}`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
