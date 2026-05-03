import Image from "next/image";
import type { CafeWithDetail } from "@/types/db";
import { TAG_LABELS } from "@/lib/data";
import { getCloudflareImageUrl } from "@/lib/utils";

interface RegisteredCafeCardProps {
  cafe: CafeWithDetail;
  onDelete: () => void;
  isDeleting: boolean;
}

export default function RegisteredCafeCard({
  cafe,
  onDelete,
  isDeleting,
}: RegisteredCafeCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-emerald-400 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                등록됨
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {cafe.name}
              </h2>
              <span className="text-[11px] text-gray-400">
                ❤ {cafe.like_count}
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
              <span>📍</span>
              {cafe.address}
            </p>

            {cafe.tags && cafe.tags.length > 0 && cafe.tags[0] !== null && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {cafe.tags.map((tag) => (
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
              {cafe.hours && (
                <span className="flex items-center gap-1">
                  <span>🕐</span>
                  {cafe.hours}
                </span>
              )}
              {cafe.min_order_amount != null && (
                <span className="flex items-center gap-1">
                  <span>💰</span>
                  최소 {cafe.min_order_amount.toLocaleString("ko-KR")}원
                </span>
              )}
              <span>
                등록 {new Date(cafe.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            {cafe.description && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 leading-relaxed">
                {cafe.description}
              </p>
            )}

            {cafe.images.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {cafe.images.map((id, i) => (
                  <Image
                    key={i}
                    src={getCloudflareImageUrl(id, "middle")}
                    alt={`${cafe.name} 이미지 ${i + 1}`}
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
              onClick={onDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isDeleting ? "삭제 중…" : "🗑 삭제"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
