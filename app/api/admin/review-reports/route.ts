import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type {
  DbReview,
  ReviewReport,
  ReviewReportGroup,
} from "@/types/db";

// GET /api/admin/review-reports — pending 신고를 후기 단위로 그룹핑
export async function GET() {
  const supabase = createAdminClient();

  const { data: reports, error: reportErr } = await supabase
    .from("review_reports")
    .select("id, review_id, reporter_id, reason, detail, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (reportErr) {
    console.error("[GET /api/admin/review-reports] reports error", reportErr);
    return NextResponse.json({ message: reportErr.message }, { status: 500 });
  }

  const list = (reports ?? []) as ReviewReport[];
  if (list.length === 0) {
    return NextResponse.json({ groups: [] satisfies ReviewReportGroup[] });
  }

  const reviewIds = Array.from(new Set(list.map((r) => r.review_id)));
  const { data: reviews, error: reviewErr } = await supabase
    .from("reviews")
    .select("id, cafe_id, user_id, nickname, content, created_at")
    .in("id", reviewIds);

  if (reviewErr) {
    console.error("[GET /api/admin/review-reports] reviews error", reviewErr);
    return NextResponse.json({ message: reviewErr.message }, { status: 500 });
  }

  const reviewMap = new Map<string, DbReview>();
  (reviews ?? []).forEach((r) => reviewMap.set(r.id as string, r as DbReview));

  const groupMap = new Map<string, ReviewReportGroup>();
  list.forEach((rep) => {
    const review = reviewMap.get(rep.review_id);
    if (!review) return;
    if (!groupMap.has(rep.review_id)) {
      groupMap.set(rep.review_id, { review, pending_count: 0, reports: [] });
    }
    const g = groupMap.get(rep.review_id)!;
    g.pending_count += 1;
    g.reports.push(rep);
  });

  const groups = Array.from(groupMap.values()).sort(
    (a, b) => b.pending_count - a.pending_count,
  );

  return NextResponse.json({ groups });
}
