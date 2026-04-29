import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/reviews/[id] — 어드민이 후기 강제 삭제 (CASCADE로 review_reports도 정리)
export async function DELETE(_: Request, ctx: RouteCtx) {
  const { id: reviewId } = await ctx.params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) {
    console.error("[DELETE /api/admin/reviews/:id] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
