"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSubmissions,
  approveSubmission,
  deleteSubmission,
  submissionKeys,
} from "@/lib/api/cafes";
import type { CafeSubmission, SubmissionStatus } from "@/types/db";
import { toast } from "react-toastify";

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "대기 중",
  approved: "승인됨",
  rejected: "거절됨",
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
};

const CARD_ACCENT: Record<SubmissionStatus, string> = {
  pending: "border-l-amber-400",
  approved: "border-l-emerald-400",
  rejected: "border-l-red-400",
};

const TAG_LABELS: Record<string, string> = {
  콘센트_있음: "🔌 콘센트",
  와이파이_있음: "📶 와이파이",
  조용함: "🤫 조용함",
  "24시간": "🕐 24시간",
  시간제한없음: "♾️ 시간제한 없음",
  노트북_허용: "💻 노트북 허용",
  혼잡도_낮음: "🟢 혼잡도 낮음",
};

type FilterTab = "pending" | "approved" | "all";

export default function AdminPage() {
  const [filter, setFilter] = useState<FilterTab>("pending");
  const queryClient = useQueryClient();

  const {
    data: submissions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: submissionKeys.list(),
    queryFn: fetchSubmissions,
  });

  const approveMutation = useMutation({
    mutationFn: approveSubmission,
    onSuccess: () => {
      toast.success("제보가 승인되었습니다.");
      queryClient.invalidateQueries({ queryKey: submissionKeys.list() });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      toast.success("제보가 거절되었습니다.");
      queryClient.invalidateQueries({ queryKey: submissionKeys.list() });
    },
    onError: (error) => toast.error(error.message),
  });

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;

  const filtered =
    filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">☕</span>
            <span className="font-bold text-gray-900 text-base">카공맵</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">어드민</span>
          </div>
          {pendingCount > 0 && (
            <span className="text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
              {pendingCount}건 대기
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "전체 제보", value: submissions.length, color: "text-gray-800" },
            { label: "승인 대기", value: pendingCount, color: "text-amber-600" },
            { label: "승인 완료", value: approvedCount, color: "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{isLoading ? "—" : value}</p>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {(["pending", "approved", "all"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                filter === tab
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab === "pending" ? "대기 중" : tab === "approved" ? "승인됨" : "전체"}
            </button>
          ))}
        </div>

        {/* 로딩 */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="h-5 w-12 bg-gray-100 rounded-full" />
                  <div className="h-5 w-40 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-4 w-64 bg-gray-100 rounded mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {isError && (
          <div className="flex flex-col items-center py-24 text-gray-400">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-sm">데이터를 불러오지 못했습니다.</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center py-24 text-gray-400">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-sm">
              {filter === "pending" ? "대기 중인 제보가 없습니다." : "항목이 없습니다."}
            </p>
          </div>
        )}

        {/* 카드 목록 */}
        <div className="space-y-3">
          {filtered.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onApprove={() => approveMutation.mutate(submission.id)}
              onDelete={() => deleteMutation.mutate(submission.id)}
              isApproving={approveMutation.isPending && approveMutation.variables === submission.id}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === submission.id}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

interface SubmissionCardProps {
  submission: CafeSubmission;
  onApprove: () => void;
  onDelete: () => void;
  isApproving: boolean;
  isDeleting: boolean;
}

function SubmissionCard({
  submission,
  onApprove,
  onDelete,
  isApproving,
  isDeleting,
}: SubmissionCardProps) {
  const isPending = submission.status === "pending";

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${CARD_ACCENT[submission.status]} shadow-sm overflow-hidden transition-shadow hover:shadow-md`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* 왼쪽 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {/* 이름 + 상태 배지 */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[submission.status]}`}>
                {STATUS_LABEL[submission.status]}
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {submission.name}
              </h2>
            </div>

            {/* 주소 */}
            <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
              <span>📍</span>
              {submission.address}
            </p>

            {/* 태그 */}
            {submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {submission.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium"
                  >
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
            )}

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
              {submission.hours && (
                <span className="flex items-center gap-1">
                  <span>🕐</span>{submission.hours}
                </span>
              )}
              <span>제보 {new Date(submission.submitted_at).toLocaleDateString("ko-KR")}</span>
              {submission.reviewed_at && (
                <span>검토 {new Date(submission.reviewed_at).toLocaleDateString("ko-KR")}</span>
              )}
            </div>

            {/* 설명 */}
            {submission.description && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 leading-relaxed">
                {submission.description}
              </p>
            )}

            {/* 이미지 */}
            {submission.images.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {submission.images.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`제보 이미지 ${i + 1}`}
                    className="h-20 w-20 object-cover rounded-xl shrink-0 border border-gray-100"
                  />
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          {isPending && (
            <div className="flex flex-col gap-2 shrink-0 pt-0.5">
              <button
                onClick={onApprove}
                disabled={isApproving || isDeleting}
                className="px-4 py-2 text-sm font-semibold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isApproving ? "승인 중…" : "✓ 승인"}
              </button>
              <button
                onClick={onDelete}
                disabled={isApproving || isDeleting}
                className="px-4 py-2 text-sm font-semibold bg-white text-red-500 border border-red-200 rounded-xl hover:bg-red-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isDeleting ? "처리 중…" : "✕ 거절"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
