import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { CafeMarker } from "@/types/db";

// 내가 등록한(어드민이 승인한) 카페 목록.
// cafes.user_id (UUID) 기준 — NextAuth OAuth ID(TEXT)를 users.id로 lookup해 매칭.
export async function GET() {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ message: userError.message }, { status: 500 });
  }
  const userUuid = userRow?.id;
  if (!userUuid) return NextResponse.json({ cafes: [] });

  const { data: cafeRows, error: cafesError } = await supabase
    .from("cafes")
    .select("id, created_at")
    .eq("user_id", userUuid)
    .order("created_at", { ascending: false });

  if (cafesError) {
    return NextResponse.json({ message: cafesError.message }, { status: 500 });
  }

  const cafeIds = (cafeRows ?? []).map((row) => row.id as string);
  if (cafeIds.length === 0) return NextResponse.json({ cafes: [] });

  const { data: markers, error: markersError } = await supabase
    .from("cafe_markers")
    .select("id, name, address, lat, lng, like_count, min_order_amount, tags")
    .in("id", cafeIds);

  if (markersError) {
    return NextResponse.json({ message: markersError.message }, { status: 500 });
  }

  const byId = new Map(
    ((markers ?? []) as CafeMarker[]).map((cafe) => [cafe.id, cafe]),
  );
  const ordered = cafeIds
    .map((id) => byId.get(id))
    .filter((cafe): cafe is CafeMarker => Boolean(cafe));

  return NextResponse.json({ cafes: ordered });
}
