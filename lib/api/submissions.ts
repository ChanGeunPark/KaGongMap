import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CafeSubmission, CreateSubmissionPayload } from "@/types/db";
import { cafeKeys } from "./cafes";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const submissionKeys = {
  all: ["submissions"] as const,
  list: () => [...submissionKeys.all, "list"] as const,
  mySummary: () => [...submissionKeys.all, "mySummary"] as const,
};

// ── 내 제보 집계 ─────────────────────────────────────────────────────────────
// 승인된 카페는 cafes로 이동하면서 *_submissions 행이 삭제되므로,
// "등록된 카페"는 cafes.user_id 기준으로 별도 카운트한다.

export type SubmissionStatusCount = {
  pending: number;
  rejected: number;
};

export type MySubmissionsSummary = {
  cafes_registered: number;
  cafe_submissions: SubmissionStatusCount;
  cafe_image_submissions: SubmissionStatusCount;
  cafe_edit_submissions: SubmissionStatusCount;
};

export async function fetchMySubmissionsSummary(): Promise<MySubmissionsSummary> {
  const res = await fetch("/api/users/me/submissions-summary");
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "내 제보 집계 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { summary: MySubmissionsSummary };
  return json.summary;
}

// ── 카페 제보 제출 ────────────────────────────────────────────────────────────

export async function createSubmission(
  payload: CreateSubmissionPayload,
): Promise<string> {
  const res = await fetch("/api/cafes/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "제보 중 오류가 발생했습니다.");
  }

  const json = (await res.json()) as { id: string };
  return json.id;
}

// ── 어드민: 제보 목록 조회 ────────────────────────────────────────────────────

export async function fetchSubmissions(): Promise<CafeSubmission[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cafe_submissions")
    .select("*")
    .eq("status", "pending")
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

export function useMySubmissionsSummary(enabled = true) {
  return useQuery({
    queryKey: submissionKeys.mySummary(),
    queryFn: fetchMySubmissionsSummary,
    enabled,
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
