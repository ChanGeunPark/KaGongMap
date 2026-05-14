import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";
import type { ContactInquiry } from "@/types/db";

// GET /api/admin/contact-inquiries — 문의 목록
export async function GET() {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select(
      "id, user_id, category, email, content, status, created_at, read_at, resolved_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[GET /api/admin/contact-inquiries] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    inquiries: (data ?? []) as ContactInquiry[],
  });
}
