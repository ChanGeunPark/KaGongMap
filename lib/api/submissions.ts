import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CafeSubmission, CreateSubmissionPayload } from "@/types/db";
import { cafeKeys } from "./cafes";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const submissionKeys = {
  all: ["submissions"] as const,
  list: () => [...submissionKeys.all, "list"] as const,
};

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
