import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submissionKeys,
  cafeKeys,
  fetchSubmissions,
  approveSubmission,
  deleteSubmission,
} from "@/lib/api/cafes";

// ── 제보 목록 조회 ────────────────────────────────────────────────────────────

export function useSubmissions() {
  return useQuery({
    queryKey: submissionKeys.list(),
    queryFn: fetchSubmissions,
  });
}

// ── 제보 승인 → DB 트리거로 cafes에 자동 삽입 ────────────────────────────────

export function useApproveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveSubmission,
    onSuccess: () => {
      // 제보 목록 갱신 + 지도 마커도 갱신 (새 카페가 추가됐으므로)
      queryClient.invalidateQueries({ queryKey: submissionKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.markers() });
    },
  });
}

// ── 제보 삭제 (거절) ──────────────────────────────────────────────────────────

export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.list() });
    },
  });
}
