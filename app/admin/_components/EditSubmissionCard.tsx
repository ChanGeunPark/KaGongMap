import type { CafeEditSubmission } from "@/types/db";
import { TAG_LABELS } from "@/lib/data";

interface EditSubmissionCardProps {
  submission: CafeEditSubmission;
  onApprove: () => void;
  onDelete: () => void;
  isApproving: boolean;
  isDeleting: boolean;
}

export default function EditSubmissionCard({
  submission,
  onApprove,
  onDelete,
  isApproving,
  isDeleting,
}: EditSubmissionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-purple-400 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                수정 제보
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {submission.cafe_name ?? submission.name}
              </h2>
            </div>

            {submission.cafe_address && (
              <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
                <span>현재:</span>
                <span className="truncate">{submission.cafe_address}</span>
              </p>
            )}

            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5 text-xs text-gray-700 mb-3">
              <div>
                <span className="text-gray-400">이름</span>{" "}
                <span className="font-medium">{submission.name}</span>
              </div>
              <div>
                <span className="text-gray-400">주소</span>{" "}
                <span className="font-medium">{submission.address}</span>
              </div>
              {submission.hours && (
                <div>
                  <span className="text-gray-400">영업시간</span>{" "}
                  <span className="font-medium">{submission.hours}</span>
                </div>
              )}
              {submission.min_order_amount != null && (
                <div>
                  <span className="text-gray-400">최소금액</span>{" "}
                  <span className="font-medium">
                    {submission.min_order_amount.toLocaleString("ko-KR")}원
                  </span>
                </div>
              )}
              {submission.description && (
                <div>
                  <span className="text-gray-400">설명</span>{" "}
                  <span className="font-medium">{submission.description}</span>
                </div>
              )}
            </div>

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

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
              <span>
                제보{" "}
                {new Date(submission.submitted_at).toLocaleDateString("ko-KR")}
              </span>
              {submission.user_id && (
                <span className="truncate max-w-[160px]">
                  user: {submission.user_id}
                </span>
              )}
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
}
