import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: cafeId } = await params;
  const body = await req.json().catch(() => null);

  if (!body || !Array.isArray(body.images) || body.images.length === 0) {
    return NextResponse.json(
      { message: "이미지를 1장 이상 첨부해주세요." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: cafe, error: cafeError } = await supabase
    .from("cafes")
    .select("id, name")
    .eq("id", cafeId)
    .maybeSingle();

  if (cafeError) {
    return NextResponse.json({ message: cafeError.message }, { status: 500 });
  }
  if (!cafe) {
    return NextResponse.json(
      { message: "존재하지 않는 카페입니다." },
      { status: 404 },
    );
  }

  const { data, error } = await supabase
    .from("cafe_image_submissions")
    .insert({
      cafe_id: cafeId,
      user_id: typeof body.user_id === "string" ? body.user_id : null,
      images: body.images,
      caption: typeof body.caption === "string" ? body.caption : null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  after(async () => {
    try {
      await notifyAdmins("admin_new_image_submission", { cafeName: cafe.name });
    } catch (err) {
      console.error("[image-submissions] push 실패", err);
    }
  });

  return NextResponse.json({ id: data.id });
}
