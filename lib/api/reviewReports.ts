import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateReviewReportPayload,
  ReviewReportGroup,
} from "@/types/db";
import { reviewKeys } from "@/lib/api/reviews";

export const reviewReportKeys = {
  all: ["reviewReports"] as const,
  list: () => [...reviewReportKeys.all, "list"] as const,
};

// 사용자: 후기 신고 제출
export async function reportReview(
  reviewId: string,
  payload: CreateReviewReportPayload,
): Promise<void> {
  const res = await fetch(
    `/api/reviews/${encodeURIComponent(reviewId)}/reports`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "신고 중 오류가 발생했습니다.");
  }
}

// 어드민: pending 신고 목록 (후기 단위 그룹)
export async function fetchAdminReviewReports(): Promise<ReviewReportGroup[]> {
  const res = await fetch("/api/admin/review-reports", { cache: "no-store" });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "신고 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { groups: ReviewReportGroup[] };
  return json.groups ?? [];
}

// 어드민: 단건 신고 무시
export async function dismissReport(reportId: string): Promise<void> {
  const res = await fetch(
    `/api/admin/review-reports/${encodeURIComponent(reportId)}/dismiss`,
    { method: "POST" },
  );
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "신고 무시 중 오류가 발생했습니다.");
  }
}

// 어드민: 신고된 후기 강제 삭제 (CASCADE로 reports도 정리)
export async function adminDeleteReview(reviewId: string): Promise<void> {
  const res = await fetch(
    `/api/admin/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "후기 삭제 중 오류가 발생했습니다.");
  }
}

// ── React Query Hooks ───────────────────────────────────────────────────────

export function useReportReview(reviewId: string) {
  return useMutation({
    mutationFn: (payload: CreateReviewReportPayload) =>
      reportReview(reviewId, payload),
  });
}

export function useAdminReviewReports() {
  return useQuery({
    queryKey: reviewReportKeys.list(),
    queryFn: fetchAdminReviewReports,
  });
}

export function useDismissReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => dismissReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewReportKeys.list() });
    },
  });
}

export function useAdminDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => adminDeleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewReportKeys.list() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
