import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/admin/contact-inquiries/[id]/resolve — 문의 처리 완료
export async function POST(_: Request, ctx: RouteCtx) {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;

  const { id } = await ctx.params;
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("contact_inquiries")
    .update({ status: "resolved", read_at: now, resolved_at: now })
    .eq("id", id);

  if (error) {
    console.error("[POST /api/admin/contact-inquiries/:id/resolve] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
