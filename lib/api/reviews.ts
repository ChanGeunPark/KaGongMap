import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateReviewPayload, DbReview } from "@/types/db";

export const reviewKeys = {
  all: ["reviews"] as const,
  byCafe: (cafeId: string) => [...reviewKeys.all, "cafe", cafeId] as const,
};

export async function fetchReviews(cafeId: string): Promise<DbReview[]> {
  const res = await fetch(
    `/api/cafes/${encodeURIComponent(cafeId)}/reviews`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "후기 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { reviews: DbReview[] };
  return json.reviews ?? [];
}

export async function createReview(
  cafeId: string,
  payload: CreateReviewPayload,
): Promise<DbReview> {
  const res = await fetch(`/api/cafes/${encodeURIComponent(cafeId)}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "후기 작성 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { review: DbReview };
  return json.review;
}

export async function deleteReview(
  reviewId: string,
  password?: string,
): Promise<void> {
  const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
    headers: password ? { "Content-Type": "application/json" } : undefined,
    body: password ? JSON.stringify({ password }) : undefined,
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "후기 삭제 중 오류가 발생했습니다.");
  }
}

// ── React Query Hooks ───────────────────────────────────────────────────────

export function useReviews(cafeId: string | null) {
  return useQuery({
    queryKey: reviewKeys.byCafe(cafeId ?? ""),
    queryFn: () => fetchReviews(cafeId!),
    enabled: !!cafeId,
  });
}

export function useCreateReview(cafeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(cafeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byCafe(cafeId) });
    },
  });
}

export function useDeleteReview(cafeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password?: string }) =>
      deleteReview(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byCafe(cafeId) });
    },
  });
}
