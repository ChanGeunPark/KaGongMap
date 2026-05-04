import Image from "next/image";
import type { CafeSubmission } from "@/types/db";
import { TAG_LABELS } from "@/lib/data";
import { getCloudflareImageUrl } from "@/lib/utils";
import { CARD_ACCENT, STATUS_LABEL, STATUS_STYLE } from "./constants";

interface SubmissionCardProps {
  submission: CafeSubmission;
  onApprove: () => void;
  onDelete: () => void;
  isApproving: boolean;
  isDeleting: boolean;
}

export default function SubmissionCard({
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[submission.status]}`}
              >
                {STATUS_LABEL[submission.status]}
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {submission.name}
              </h2>
            </div>

            <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
              <span>📍</span>
              {submission.address}
            </p>

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
              {submission.hours && (
                <span className="flex items-start gap-1">
                  <span>🕐</span>
                  <span className="whitespace-pre-line">{submission.hours}</span>
                </span>
              )}
              {submission.min_order_amount != null && (
                <span className="flex items-center gap-1">
                  <span>💰</span>
                  최소 {submission.min_order_amount.toLocaleString("ko-KR")}원
                </span>
              )}
              <span>
                제보{" "}
                {new Date(submission.submitted_at).toLocaleDateString("ko-KR")}
              </span>
              {submission.reviewed_at && (
                <span>
                  검토{" "}
                  {new Date(submission.reviewed_at).toLocaleDateString("ko-KR")}
                </span>
              )}
            </div>

            {submission.description && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 leading-relaxed">
                {submission.description}
              </p>
            )}

            {submission.images.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {submission.images.map((id, i) => (
                  <Image
                    key={i}
                    src={getCloudflareImageUrl(id, "middle")}
                    alt={`제보 이미지 ${i + 1}`}
                    width={100}
                    height={100}
                    className="h-20 w-20 object-cover rounded-xl shrink-0 border border-gray-100"
                  />
                ))}
              </div>
            )}
          </div>

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
