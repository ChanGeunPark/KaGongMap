import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  CafeMarker,
  CafeWithDetail,
  CafeSubmission,
  CreateSubmissionPayload,
} from "@/types/db";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const cafeKeys = {
  all: ["cafes"] as const,
  markers: () => [...cafeKeys.all, "markers"] as const,
  detail: (id: string) => [...cafeKeys.all, "detail", id] as const,
};

export const submissionKeys = {
  all: ["submissions"] as const,
  list: () => [...submissionKeys.all, "list"] as const,
};

// ── Tier 1: 지도 마커 전체 로딩 ──────────────────────────────────────────────

export async function fetchCafeMarkers(): Promise<CafeMarker[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_markers")
    .select("id, name, lat, lng, avg_rating, min_order_amount, tags");

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

// ── 카페 제보 제출 ────────────────────────────────────────────────────────────

export async function createSubmission(
  payload: CreateSubmissionPayload,
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cafe_submissions")
    .insert({
      name: payload.name,
      address: payload.address,
      lat: payload.lat,
      lng: payload.lng,
      hours: payload.hours ?? null,
      min_order_amount: payload.min_order_amount ?? null,
      images: payload.images,
      description: payload.description ?? null,
      tags: payload.tags,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

// ── 어드민: 제보 목록 조회 ────────────────────────────────────────────────────

export async function fetchSubmissions(): Promise<CafeSubmission[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_submissions")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CafeSubmission[];
}

// ── 어드민: 제보 승인 ──────────────────────────────────────────────────────────
// status → 'approved' 로 변경하면 DB 트리거가 자동으로 cafes + cafe_tags에 삽입

// ── 어드민: 제보 승인 ──────────────────────────────────────────────────────────
// service_role Route Handler 경유 → RLS 우회 → DB 트리거가 cafes에 자동 INSERT

export async function approveSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/admin/submissions/${id}/approve`, {
    method: "POST",
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message ?? "승인 중 오류가 발생했습니다.");
  }
}

// ── 어드민: 제보 삭제 (거절) ──────────────────────────────────────────────────

export async function deleteSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/admin/submissions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message ?? "삭제 중 오류가 발생했습니다.");
  }
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

export function useSubmissions() {
  return useQuery({
    queryKey: submissionKeys.list(),
    queryFn: fetchSubmissions,
  });
}

export function useApproveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.markers() });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.list() });
    },
  });
}
