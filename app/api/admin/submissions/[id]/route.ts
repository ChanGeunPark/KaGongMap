import { NextRequest, NextResponse, after } from "next/server";
import { requireAdminApiAccess } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUserByOAuth } from "@/lib/notifications";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: submission, error: fetchError } = await supabase
    .from("cafe_submissions")
    .select("user_id, name")
    .eq("id", id)
    .maybeSingle<{ user_id: string | null; name: string }>();

  if (fetchError) {
    return NextResponse.json({ message: fetchError.message }, { status: 500 });
  }
  if (!submission) {
    return NextResponse.json(
      { message: "존재하지 않는 제보입니다." },
      { status: 404 },
    );
  }

  const { error } = await supabase
    .from("cafe_submissions")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const submitterOAuthId = submission.user_id;
  if (submitterOAuthId) {
    after(async () => {
      try {
        await notifyUserByOAuth(submitterOAuthId, "cafe_submission_rejected", {
          cafeName: submission.name,
        });
      } catch (err) {
        console.error("[submissions/reject] push 실패", err);
      }
    });
  }

  return NextResponse.json({ ok: true });
}
