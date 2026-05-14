import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/admin/contact-inquiries/[id]/read — 문의 확인 처리
export async function POST(_: Request, ctx: RouteCtx) {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;

  const { id } = await ctx.params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("contact_inquiries")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    console.error("[POST /api/admin/contact-inquiries/:id/read] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
