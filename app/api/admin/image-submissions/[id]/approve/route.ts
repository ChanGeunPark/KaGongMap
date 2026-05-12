import { NextRequest, NextResponse, after } from "next/server";
import { requireAdminApiAccess } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUserByOAuth } from "@/lib/notifications";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: submission, error: fetchError } = await supabase
    .from("cafe_image_submissions")
    .select("user_id, cafe_id, cafes(name)")
    .eq("id", id)
    .maybeSingle<{
      user_id: string | null;
      cafe_id: string;
      cafes: { name: string } | null;
    }>();

  if (fetchError) {
    return NextResponse.json({ message: fetchError.message }, { status: 500 });
  }
  if (!submission) {
    return NextResponse.json(
      { message: "존재하지 않는 제보입니다." },
      { status: 404 },
    );
  }

  const { error: updateError } = await supabase
    .from("cafe_image_submissions")
    .update({ status: "approved" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("cafe_image_submissions")
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

  const submitterOAuthId = submission.user_id;
  const cafeName = submission.cafes?.name;
  if (submitterOAuthId && cafeName) {
    after(async () => {
      try {
        await notifyUserByOAuth(submitterOAuthId, "image_submission_approved", {
          cafeName,
          cafeId: submission.cafe_id,
        });
      } catch (err) {
        console.error("[image-submissions/approve] push 실패", err);
      }
    });
  }

  return NextResponse.json({ ok: true });
}
