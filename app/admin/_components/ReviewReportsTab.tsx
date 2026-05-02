"use client";

import { toast } from "react-toastify";
import {
  useAdminDeleteReview,
  useAdminReviewReports,
  useDismissReport,
} from "@/lib/api/reviewReports";
import { formatDate } from "@/lib/utils";
import type { ReviewReport, ReviewReportReason } from "@/types/db";

const REASON_LABEL: Record<ReviewReportReason, string> = {
  spam: "광고/스팸",
  abuse: "욕설/혐오",
  inappropriate: "부적절",
  irrelevant: "카페와 무관",
  other: "기타",
};

const HIDE_THRESHOLD = 3;

export default function ReviewReportsTab() {
  const { data: groups = [], isLoading, isError } = useAdminReviewReports();
  const dismissMut = useDismissReport();
  const deleteReviewMut = useAdminDeleteReview();

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
        <p className="text-sm">신고를 불러오지 못했습니다.</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-gray-400">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm">대기 중인 신고가 없습니다.</p>
      </div>
    );
  }

  const handleDismissAll = async (reports: ReviewReport[]) => {
    if (
      !confirm(
        `이 후기에 대한 신고 ${reports.length}건을 모두 무시할까요? (후기는 그대로 유지됩니다)`,
      )
    )
      return;

    try {
      await Promise.all(
        reports.map((r) =>
          dismissMut.mutateAsync(r.id).catch(() => {
            // 개별 실패 시 그대로 진행 (Promise.all로 모두 실행)
          }),
        ),
      );
      toast.success("신고를 모두 무시했습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!confirm("이 후기를 영구 삭제할까요? (관련 신고도 함께 정리됩니다)"))
      return;
    deleteReviewMut.mutate(reviewId, {
      onSuccess: () => toast.success("후기가 삭제되었습니다."),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-3">
      {groups.map(({ review, pending_count, reports }) => {
        const hidden = pending_count >= HIDE_THRESHOLD;
        return (
          <div
            key={review.id}
            className={`bg-white rounded-2xl border-l-4 border border-gray-100 shadow-sm overflow-hidden ${
              hidden ? "border-l-red-500" : "border-l-amber-400"
            }`}
          >
            <div className="p-5">
              {/* 후기 메타 */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    hidden
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  신고 {pending_count}건{hidden ? " · 자동 숨김" : ""}
                </span>
                <span className="text-[11.5px] font-semibold text-gray-700">
                  {review.nickname}
                </span>
                {review.user_id === null && (
                  <span className="text-[10px] text-gray-400 px-1.5 py-px rounded bg-gray-100">
                    비회원
                  </span>
                )}
                <span className="text-[11px] text-gray-400">
                  {formatDate(review.created_at)}
                </span>
              </div>

              {/* 후기 본문 */}
              <p className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap mb-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                {review.content}
              </p>

              {/* 신고 사유 목록 */}
              <ul className="space-y-1.5 mb-4">
                {reports.map((rep) => (
                  <li
                    key={rep.id}
                    className="flex items-start gap-2 text-[12px] text-gray-600"
                  >
                    <span className="shrink-0 px-1.5 py-px text-[10.5px] font-semibold rounded bg-gray-100 text-gray-700">
                      {REASON_LABEL[rep.reason]}
                    </span>
                    {rep.detail && (
                      <span className="flex-1">{rep.detail}</span>
                    )}
                    <span className="text-gray-400 shrink-0">
                      {formatDate(rep.created_at)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* 액션 */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleDismissAll(reports)}
                  disabled={dismissMut.isPending}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                >
                  전체 무시
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteReview(review.id)}
                  disabled={deleteReviewMut.isPending}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-50"
                >
                  후기 삭제
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
