import { createClient } from "@/lib/supabase/client";
import type {
  CafeImageSubmission,
  CreateCafeImageSubmissionPayload,
} from "@/types/db";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const imageSubmissionKeys = {
  all: ["imageSubmissions"] as const,
  list: () => [...imageSubmissionKeys.all, "list"] as const,
};

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
    .eq("status", "pending")
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
