"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  cafeReportKeys,
  useAdminCafeReports,
  useDismissCafeReport,
  useResolveCafeReport,
} from "@/lib/api/cafeReports";
import { cafeKeys, deleteCafe } from "@/lib/api/cafes";
import { TAG_LABELS } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { CafeReport, CafeReportReason } from "@/types/db";

const REASON_LABEL: Record<CafeReportReason, string> = {
  photo_issue: "사진 문제",
  closed: "가게 없어짐",
  wrong_info: "정보 오류",
  inappropriate_place: "부적절한 장소",
  duplicate: "중복 등록",
  other: "기타",
};

export default function CafeReportsTab() {
  const { data: groups = [], isLoading, isError, refetch } = useAdminCafeReports();
  const queryClient = useQueryClient();
  const dismissMut = useDismissCafeReport();
  const resolveMut = useResolveCafeReport();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center py-24 text-gray-400">
        <span className="text-4xl mb-3">⚠️</span>
        <p className="text-sm">카페 신고를 불러오지 못했습니다.</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-gray-400">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm">대기 중인 카페 신고가 없습니다.</p>
      </div>
    );
  }

  const updateAll = async (
    reports: CafeReport[],
    action: "dismiss" | "resolve",
  ) => {
    const label = action === "dismiss" ? "무시" : "처리 완료";
    if (!confirm(`이 카페에 대한 신고 ${reports.length}건을 모두 ${label}할까요?`)) {
      return;
    }

    try {
      const mut = action === "dismiss" ? dismissMut : resolveMut;
      await Promise.all(
        reports.map((r) =>
          mut.mutateAsync(r.id).catch(() => {
            // 개별 실패 시 그대로 진행 (Promise.all로 모두 실행)
          }),
        ),
      );
      toast.success(`신고를 모두 ${label}했습니다.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  const handleDeleteCafe = async (cafeId: string, cafeName: string) => {
    if (
      !confirm(
        `정말 "${cafeName}"을(를) 삭제하시겠습니까?\n관련 신고·후기·즐겨찾기·태그도 함께 삭제됩니다.`,
      )
    ) {
      return;
    }

    try {
      await deleteCafe(cafeId);
      toast.success("카페가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: cafeKeys.all });
      queryClient.invalidateQueries({ queryKey: cafeReportKeys.list() });
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-3">
      {groups.map(({ cafe, pending_count, reports }) => (
        <div
          key={cafe.id}
          className="bg-white rounded-2xl border-l-4 border-l-red-500 border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                    신고 {pending_count}건
                  </span>
                  <span className="text-[13.5px] font-semibold text-gray-900">
                    {cafe.name}
                  </span>
                </div>
                <p className="text-mono text-gray-500">{cafe.address}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0">
                후기 {cafe.review_count}개 · 좋아요 {cafe.like_count}
              </span>
            </div>

            {cafe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {cafe.tags.slice(0, 8).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-gray-50 text-[11px] text-gray-600 border border-gray-100"
                  >
                    {TAG_LABELS[tag]}
                  </span>
                ))}
              </div>
            )}

            <ul className="space-y-1.5 mb-4">
              {reports.map((rep) => (
                <li
                  key={rep.id}
                  className="flex items-start gap-2 text-mono text-gray-600"
                >
                  <span className="shrink-0 px-1.5 py-px text-[10.5px] font-semibold rounded bg-gray-100 text-gray-700">
                    {REASON_LABEL[rep.reason]}
                  </span>
                  {rep.detail && <span className="flex-1">{rep.detail}</span>}
                  <span className="text-gray-400 shrink-0">
                    {formatDate(rep.created_at)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => updateAll(reports, "dismiss")}
                disabled={dismissMut.isPending}
                className="px-3 py-1.5 rounded-lg text-mono font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer disabled:opacity-50"
              >
                전체 무시
              </button>
              <button
                type="button"
                onClick={() => updateAll(reports, "resolve")}
                disabled={resolveMut.isPending}
                className="px-3 py-1.5 rounded-lg text-mono font-medium bg-blue-500 text-white hover:bg-blue-600 cursor-pointer disabled:opacity-50"
              >
                처리 완료
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCafe(cafe.id, cafe.name)}
                className="px-3 py-1.5 rounded-lg text-mono font-medium bg-red-500 text-white hover:bg-red-600 cursor-pointer"
              >
                카페 삭제
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
