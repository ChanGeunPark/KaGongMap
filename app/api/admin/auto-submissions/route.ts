import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAccess, getAdminSessionStatus } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";
import type { CafeTag } from "@/types/db";

// 어드민이 자동 제보 검수 후 cafe_submissions 에 status='pending' 으로 INSERT.
// 일반 제보 라우트(/api/cafes/submissions)와 달리 어드민 인증 필수,
// images 는 빈 배열, user_id 는 어드민 본인 oauthId.

export async function POST(req: NextRequest) {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;

  const { userId } = await getAdminSessionStatus();

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.address !== "string" ||
    typeof body.lat !== "number" ||
    typeof body.lng !== "number" ||
    !Array.isArray(body.tags)
  ) {
    return NextResponse.json(
      { message: "필수 항목(name, address, lat, lng, tags)을 확인해주세요." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cafe_submissions")
    .insert({
      user_id: userId,
      name: body.name,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      hours: typeof body.hours === "string" && body.hours.length > 0
        ? body.hours
        : null,
      min_order_amount:
        typeof body.min_order_amount === "number"
          ? body.min_order_amount
          : null,
      images: [],
      description:
        typeof body.description === "string" && body.description.length > 0
          ? body.description
          : null,
      tags: body.tags as CafeTag[],
    })
    .select("id")
    .single();

  if (error) {
    console.error("[POST /api/admin/auto-submissions] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
