import Image from "next/image";
import type { CafeImageSubmission } from "@/types/db";
import { getCloudflareImageUrl } from "@/lib/utils";

interface ImageSubmissionCardProps {
  submission: CafeImageSubmission;
  onApprove: () => void;
  onDelete: () => void;
  isApproving: boolean;
  isDeleting: boolean;
}

export default function ImageSubmissionCard({
  submission,
  onApprove,
  onDelete,
  isApproving,
  isDeleting,
}: ImageSubmissionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-blue-400 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                사진 제보
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {submission.cafe_name ?? "카페 정보 없음"}
              </h2>
            </div>

            {submission.cafe_address && (
              <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                <span>📍</span>
                {submission.cafe_address}
              </p>
            )}

            {submission.caption && (
              <p className="mt-1 mb-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 leading-relaxed">
                💬 {submission.caption}
              </p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400 mb-3">
              <span>
                제보{" "}
                {new Date(submission.submitted_at).toLocaleDateString("ko-KR")}
              </span>
              <span>{submission.images.length}장</span>
              {submission.user_id && (
                <span className="truncate max-w-[160px]">
                  user: {submission.user_id}
                </span>
              )}
            </div>

            {submission.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
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
