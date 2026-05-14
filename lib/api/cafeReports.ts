import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CafeReportGroup,
  CreateCafeReportPayload,
} from "@/types/db";
import { cafeKeys } from "@/lib/api/cafes";

export const cafeReportKeys = {
  all: ["cafeReports"] as const,
  list: () => [...cafeReportKeys.all, "list"] as const,
};

// 사용자: 카페 신고 제출
export async function reportCafe(
  cafeId: string,
  payload: CreateCafeReportPayload,
): Promise<void> {
  const res = await fetch(`/api/cafes/${encodeURIComponent(cafeId)}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "신고 중 오류가 발생했습니다.");
  }
}

// 어드민: pending 신고 목록 (카페 단위 그룹)
export async function fetchAdminCafeReports(): Promise<CafeReportGroup[]> {
  const res = await fetch("/api/admin/cafe-reports", { cache: "no-store" });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "신고 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { groups: CafeReportGroup[] };
  return json.groups ?? [];
}

// 어드민: 단건 신고 무시
export async function dismissCafeReport(reportId: string): Promise<void> {
  const res = await fetch(
    `/api/admin/cafe-reports/${encodeURIComponent(reportId)}/dismiss`,
    { method: "POST" },
  );
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "신고 무시 중 오류가 발생했습니다.");
  }
}

// 어드민: 단건 신고 처리 완료
export async function resolveCafeReport(reportId: string): Promise<void> {
  const res = await fetch(
    `/api/admin/cafe-reports/${encodeURIComponent(reportId)}/resolve`,
    { method: "POST" },
  );
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "신고 처리 중 오류가 발생했습니다.");
  }
}

// ── React Query Hooks ───────────────────────────────────────────────────────

export function useReportCafe(cafeId: string) {
  return useMutation({
    mutationFn: (payload: CreateCafeReportPayload) =>
      reportCafe(cafeId, payload),
  });
}

export function useAdminCafeReports() {
  return useQuery({
    queryKey: cafeReportKeys.list(),
    queryFn: fetchAdminCafeReports,
  });
}

export function useDismissCafeReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => dismissCafeReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cafeReportKeys.list() });
    },
  });
}

export function useResolveCafeReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => resolveCafeReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cafeReportKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.all });
    },
  });
}
