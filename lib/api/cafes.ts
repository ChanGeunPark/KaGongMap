import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  CafeMarker,
  CafeWithDetail,
  CafeSubmission,
  CreateSubmissionPayload,
  CafeImageSubmission,
  CreateCafeImageSubmissionPayload,
  CafeEditSubmission,
  CreateCafeEditSubmissionPayload,
} from "@/types/db";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const cafeKeys = {
  all: ["cafes"] as const,
  markers: () => [...cafeKeys.all, "markers"] as const,
  detail: (id: string) => [...cafeKeys.all, "detail", id] as const,
  list: () => [...cafeKeys.all, "list"] as const,
};

export const submissionKeys = {
  all: ["submissions"] as const,
  list: () => [...submissionKeys.all, "list"] as const,
};

export const imageSubmissionKeys = {
  all: ["imageSubmissions"] as const,
  list: () => [...imageSubmissionKeys.all, "list"] as const,
};

export const editSubmissionKeys = {
  all: ["editSubmissions"] as const,
  list: () => [...editSubmissionKeys.all, "list"] as const,
};

// ── Tier 1: 지도 마커 전체 로딩 ──────────────────────────────────────────────

export async function fetchCafeMarkers(): Promise<CafeMarker[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_markers")
    .select("id, name, lat, lng, like_count, min_order_amount, tags");

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

// ── 이미지 제보: 사용자 제출 ──────────────────────────────────────────────────

export async function createCafeImageSubmission(
  payload: CreateCafeImageSubmissionPayload,
): Promise<string> {
  const res = await fetch(`/api/cafes/${payload.cafe_id}/image-submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: payload.images,
      caption: payload.caption ?? null,
      user_id: payload.user_id ?? null,
    }),
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "이미지 제보 중 오류가 발생했습니다.");
  }
  const { id } = await res.json();
  return id as string;
}

// ── 어드민: 이미지 제보 목록 ──────────────────────────────────────────────────

export async function fetchImageSubmissions(): Promise<CafeImageSubmission[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_image_submissions")
    .select("*, cafes (name, address)")
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const cafe = row.cafes as { name?: string; address?: string } | null;
    return {
      id: row.id as string,
      cafe_id: row.cafe_id as string,
      user_id: row.user_id as string | null,
      images: (row.images as string[]) ?? [],
      caption: row.caption as string | null,
      status: row.status as CafeImageSubmission["status"],
      submitted_at: row.submitted_at as string,
      reviewed_at: row.reviewed_at as string | null,
      cafe_name: cafe?.name,
      cafe_address: cafe?.address,
    };
  });
}

// ── 어드민: 이미지 제보 승인 ──────────────────────────────────────────────────

export async function approveImageSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/admin/image-submissions/${id}/approve`, {
    method: "POST",
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "승인 중 오류가 발생했습니다.");
  }
}

// ── 어드민: 이미지 제보 거절(삭제) ────────────────────────────────────────────

export async function deleteImageSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/admin/image-submissions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "삭제 중 오류가 발생했습니다.");
  }
}

// ── 수정 제보: 사용자 제출 ────────────────────────────────────────────────────

export async function createCafeEditSubmission(
  payload: CreateCafeEditSubmissionPayload,
): Promise<string> {
  const res = await fetch(`/api/cafes/${payload.cafe_id}/edit-submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      address: payload.address,
      lat: payload.lat,
      lng: payload.lng,
      hours: payload.hours ?? null,
      min_order_amount: payload.min_order_amount ?? null,
      description: payload.description ?? null,
      tags: payload.tags,
      user_id: payload.user_id ?? null,
    }),
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "수정 제보 중 오류가 발생했습니다.");
  }
  const { id } = await res.json();
  return id as string;
}

// ── 어드민: 수정 제보 목록 ────────────────────────────────────────────────────

export async function fetchEditSubmissions(): Promise<CafeEditSubmission[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_edit_submissions")
    .select("*, cafes (name, address)")
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const cafe = row.cafes as { name?: string; address?: string } | null;
    return {
      id: row.id as string,
      cafe_id: row.cafe_id as string,
      user_id: row.user_id as string | null,
      name: row.name as string,
      address: row.address as string,
      lat: row.lat as number,
      lng: row.lng as number,
      hours: row.hours as string | null,
      min_order_amount: row.min_order_amount as number | null,
      description: row.description as string | null,
      tags: (row.tags as CafeEditSubmission["tags"]) ?? [],
      status: row.status as CafeEditSubmission["status"],
      submitted_at: row.submitted_at as string,
      reviewed_at: row.reviewed_at as string | null,
      cafe_name: cafe?.name,
      cafe_address: cafe?.address,
    };
  });
}

// ── 어드민: 수정 제보 승인 ────────────────────────────────────────────────────

export async function approveEditSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/admin/edit-submissions/${id}/approve`, {
    method: "POST",
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "승인 중 오류가 발생했습니다.");
  }
}

// ── 어드민: 수정 제보 거절(삭제) ──────────────────────────────────────────────

export async function deleteEditSubmission(id: string): Promise<void> {
  const res = await fetch(`/api/admin/edit-submissions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "삭제 중 오류가 발생했습니다.");
  }
}

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
