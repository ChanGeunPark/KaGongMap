import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/admin/review-reports/[id]/dismiss — 단건 신고 무시
export async function POST(_: Request, ctx: RouteCtx) {
  const { id: reportId } = await ctx.params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("review_reports")
    .update({ status: "dismissed" })
    .eq("id", reportId);

  if (error) {
    console.error("[POST /api/admin/review-reports/:id/dismiss] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
