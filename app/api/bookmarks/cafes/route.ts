import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { CafeMarker } from "@/types/db";

interface BookmarkRow {
  cafe_id: string;
}

async function resolveUserPk(oauthId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();

  if (error) {
    console.error("[bookmarks/cafes] resolveUserPk error", error);
    return null;
  }

  return (data?.id as string | undefined) ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const userPk = await resolveUserPk(oauthId);
  if (!userPk) return NextResponse.json({ cafes: [] });

  const supabase = createAdminClient();
  const { data: bookmarkRows, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("cafe_id")
    .eq("user_id", userPk)
    .order("created_at", { ascending: false });

  if (bookmarkError) {
    console.error("[GET /api/bookmarks/cafes] bookmark error", bookmarkError);
    return NextResponse.json(
      { message: bookmarkError.message },
      { status: 500 },
    );
  }

  const cafeIds = ((bookmarkRows ?? []) as BookmarkRow[]).map(
    (row) => row.cafe_id,
  );
  if (cafeIds.length === 0) return NextResponse.json({ cafes: [] });

  const { data: cafes, error: cafesError } = await supabase
    .from("cafe_markers")
    .select("id, name, address, lat, lng, like_count, min_order_amount, tags")
    .in("id", cafeIds);

  if (cafesError) {
    console.error("[GET /api/bookmarks/cafes] cafes error", cafesError);
    return NextResponse.json({ message: cafesError.message }, { status: 500 });
  }

  const cafeById = new Map(
    ((cafes ?? []) as CafeMarker[]).map((cafe) => [cafe.id, cafe]),
  );
  const orderedCafes = cafeIds
    .map((id) => cafeById.get(id))
    .filter((cafe): cafe is CafeMarker => Boolean(cafe));

  return NextResponse.json({ cafes: orderedCafes });
}
