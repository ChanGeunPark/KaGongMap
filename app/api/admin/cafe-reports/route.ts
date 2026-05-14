import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";
import type { CafeReport, CafeReportGroup, CafeWithDetail } from "@/types/db";

// GET /api/admin/cafe-reports — pending 신고를 카페 단위로 그룹핑
export async function GET() {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;

  const supabase = createAdminClient();

  const { data: reports, error: reportErr } = await supabase
    .from("cafe_reports")
    .select("id, cafe_id, reporter_id, reason, detail, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (reportErr) {
    console.error("[GET /api/admin/cafe-reports] reports error", reportErr);
    return NextResponse.json({ message: reportErr.message }, { status: 500 });
  }

  const list = (reports ?? []) as CafeReport[];
  if (list.length === 0) {
    return NextResponse.json({ groups: [] satisfies CafeReportGroup[] });
  }

  const cafeIds = Array.from(new Set(list.map((r) => r.cafe_id)));
  const { data: cafes, error: cafeErr } = await supabase
    .from("cafe_detail")
    .select("*")
    .in("id", cafeIds);

  if (cafeErr) {
    console.error("[GET /api/admin/cafe-reports] cafes error", cafeErr);
    return NextResponse.json({ message: cafeErr.message }, { status: 500 });
  }

  const cafeMap = new Map<string, CafeWithDetail>();
  (cafes ?? []).forEach((c) => cafeMap.set(c.id as string, c as CafeWithDetail));

  const groupMap = new Map<string, CafeReportGroup>();
  list.forEach((rep) => {
    const cafe = cafeMap.get(rep.cafe_id);
    if (!cafe) return;
    if (!groupMap.has(rep.cafe_id)) {
      groupMap.set(rep.cafe_id, { cafe, pending_count: 0, reports: [] });
    }
    const group = groupMap.get(rep.cafe_id)!;
    group.pending_count += 1;
    group.reports.push(rep);
  });

  const groups = Array.from(groupMap.values()).sort(
    (a, b) => b.pending_count - a.pending_count,
  );

  return NextResponse.json({ groups });
}
