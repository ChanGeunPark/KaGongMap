import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CafeMarker, CafeWithDetail } from "@/types/db";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const cafeKeys = {
  all: ["cafes"] as const,
  markers: () => [...cafeKeys.all, "markers"] as const,
  detail: (id: string) => [...cafeKeys.all, "detail", id] as const,
  list: () => [...cafeKeys.all, "list"] as const,
  mine: () => [...cafeKeys.all, "mine"] as const,
};

// ── Tier 1: 지도 마커 전체 로딩 ──────────────────────────────────────────────

export async function fetchCafeMarkers(): Promise<CafeMarker[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_markers")
    .select("id, name, address, lat, lng, like_count, min_order_amount, tags");

  if (error) throw new Error(error.message);
  return (data ?? []) as CafeMarker[];
}

// ── Tier 2: 카페 상세 (핀 클릭 시 1건만) ────────────────────────────────────

export async function fetchCafeDetail(id: string): Promise<CafeWithDetail> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_detail")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as CafeWithDetail;
}

// ── 어드민: 등록된 카페 목록 (cafe_detail 뷰) ─────────────────────────────────

export async function fetchCafesAdmin(): Promise<CafeWithDetail[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_detail")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CafeWithDetail[];
}

// ── 어드민: 등록된 카페 삭제 ─────────────────────────────────────────────────

export async function deleteCafe(id: string): Promise<void> {
  const res = await fetch(`/api/admin/cafes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message ?? "카페 삭제 중 오류가 발생했습니다.");
  }
}

// ── 내가 등록한 카페 (cafes.user_id 기준) ────────────────────────────────────

export async function fetchMyRegisteredCafes(): Promise<CafeMarker[]> {
  const res = await fetch("/api/users/me/cafes", { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) return [];
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "내 카페 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { cafes: CafeMarker[] };
  return json.cafes ?? [];
}

// ── 카페 ID 조회 (이름 + 주소로 lookup) ──────────────────────────────────────

export async function getCafeIdByNameAndAddress(
  name: string | null,
  address: string | null,
): Promise<string | null> {
  if (!name || !address) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafes")
    .select("id")
    .eq("name", name)
    .eq("address", address)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

// ── React Query Hooks ───────────────────────────────────────────────────────

export function useCafeMarkers() {
  return useQuery({
    queryKey: cafeKeys.markers(),
    queryFn: fetchCafeMarkers,
  });
}

export function useCafeDetail(id: string | null) {
  return useQuery({
    queryKey: cafeKeys.detail(id ?? ""),
    queryFn: () => fetchCafeDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}
