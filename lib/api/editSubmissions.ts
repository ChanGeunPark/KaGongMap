import { createClient } from "@/lib/supabase/client";
import type {
  CafeEditSubmission,
  CreateCafeEditSubmissionPayload,
} from "@/types/db";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const editSubmissionKeys = {
  all: ["editSubmissions"] as const,
  list: () => [...editSubmissionKeys.all, "list"] as const,
};

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
    .eq("status", "pending")
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
