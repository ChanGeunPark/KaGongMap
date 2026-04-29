import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: cafeId } = await params;
  const body = await req.json().catch(() => null);

  if (!body || typeof body.name !== "string" || typeof body.address !== "string") {
    return NextResponse.json(
      { message: "이름과 주소는 필수입니다." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: cafe, error: cafeError } = await supabase
    .from("cafes")
    .select("id")
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
    .from("cafe_edit_submissions")
    .insert({
      cafe_id: cafeId,
      user_id: typeof body.user_id === "string" ? body.user_id : null,
      name: body.name,
      address: body.address,
      lat: typeof body.lat === "number" ? body.lat : 0,
      lng: typeof body.lng === "number" ? body.lng : 0,
      hours: typeof body.hours === "string" ? body.hours : null,
      min_order_amount:
        typeof body.min_order_amount === "number" ? body.min_order_amount : null,
      description: typeof body.description === "string" ? body.description : null,
      tags: Array.isArray(body.tags) ? body.tags : [],
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
