"use client";

import Badge from "@/components/badge/Badge";
import KaGongButton from "@/components/button/KaGongButton";
import KGIcon from "@/components/ui/KGIcon";
import ImageSubmitModal from "@/components/cafe/detail/ImageSubmitModal";
import CafeEditModal from "@/components/cafe/detail/CafeEditModal";
import { cls, getCloudflareImageUrl } from "@/lib/utils";
import { useImageModalStore } from "@/stores/modalStore";
import { CafeMarker, CafeWithDetail } from "@/types/db";
import { useLikes } from "@/hooks/useLikes";
import Image from "next/image";
import { useState } from "react";
import { TbClock, TbHeart, TbMapPin } from "react-icons/tb";
import LikeButton from "@/components/button/LikeButton";
import CafeReviewSection from "@/components/cafe/detail/CafeReviewSection";

interface CafeModalDetailProps {
  cafe: CafeMarker;
  detail: CafeWithDetail | null;
  detailLoading: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
}

export function CafeModalDetail({
  cafe,
  detail,
  detailLoading,
}: CafeModalDetailProps) {
  const { setImageUrl, setShowImageModal } = useImageModalStore();
  const [showImageSubmit, setShowImageSubmit] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { isLiked, toggle } = useLikes();
  const liked = isLiked(cafe.id);

  const images = detail?.images ?? [];
  const visibleImages = images.slice(0, 5);
  const hasDetailInfo = !!(
    detail &&
    (detail.address || detail.hours || detail.description)
  );

  const TAG_LABELS: Record<string, string> = {
    콘센트_있음: "🔌 콘센트",
    와이파이_있음: "📶 와이파이",
    조용함: "🤫 조용함",
    "24시간": "🕐 24시간",
    시간제한없음: "♾️ 시간제한 없음",
    노트북_허용: "💻 노트북 허용",
    혼잡도_낮음: "🟢 혼잡도 낮음",
    늦은영업: "🌙 늦은영업",
    가성비_좋음: "💸 가성비 좋음",
    자연채광: "☀️ 자연채광",
    야외테라스: "🌿 야외테라스",
    반려동물_가능: "🐶 반려동물 가능",
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* ── Image Gallery ── */}
      {(images.length > 0 || !detailLoading) && (
        <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {visibleImages.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => {
                  setImageUrl(getCloudflareImageUrl(img, "public"));
                  setShowImageModal(true);
                }}
                className={cls(
                  "relative size-[84px] rounded-lg overflow-hidden shrink-0",
                  "ring-1 ring-black/5 hover:ring-black/15",
                  "transition-all active:scale-[0.97] cursor-pointer",
                )}
              >
                <Image
                  src={getCloudflareImageUrl(img, "middle")}
                  alt={`${cafe.name} ${idx + 1}`}
                  width={84}
                  height={84}
                  className="size-full object-cover"
                />
              </button>
            ))}

            {visibleImages.length < 5 && (
              <button
                type="button"
                onClick={() => setShowImageSubmit(true)}
                className={cls(
                  "size-[84px] rounded-lg shrink-0 cursor-pointer",
                  "border border-dashed border-zinc-300 bg-gray-50/60",
                  "flex flex-col items-center justify-center gap-1",
                  "text-zinc-400 hover:text-zinc-500",
                  "hover:border-zinc-400 hover:bg-gray-50 transition-colors",
                )}
              >
                <KGIcon name="plus" size={20} stroke={2.2} />
                <span className="text-[10px] font-medium tracking-tight">
                  사진 제보
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[17px] font-bold tracking-[-0.4px] text-fg m-0 leading-tight truncate">
            {cafe.name}
          </h4>

          <div className="flex items-center gap-1.5 text-sm text-fg-3">
            <div className="flex items-center gap-1 text-sm font-bold text-zinc-400 py-1">
              <TbHeart size={15} strokeWidth={2.2} />
              <span>{cafe.like_count}</span>
            </div>
            {cafe.min_order_amount != null && (
              <>
                <span className="text-fg-4">·</span>
                <span>
                  최소금액 {cafe.min_order_amount.toLocaleString("ko-KR")}원
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {cafe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {cafe.tags.map((t) => (
              <Badge key={t} BadgeStyle="OUTLINED" BadgeSize="SMALL">
                {TAG_LABELS[t]}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* ── Tier 2 상세 정보 ── */}
      {detailLoading && (
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-gray-50">
          <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
      )}
      {!detailLoading && hasDetailInfo && (
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-gray-50">
          {detail?.address && (
            <div className="flex items-start gap-2 text-[12px] text-fg-2">
              <TbMapPin
                size={14}
                strokeWidth={2}
                className="shrink-0 text-fg-4 mt-[2px]"
              />
              <span className="leading-snug">{detail.address}</span>
            </div>
          )}
          {detail?.hours && (
            <div className="flex items-start gap-2 text-memo text-fg-2">
              <TbClock
                size={14}
                strokeWidth={2}
                className="shrink-0 text-fg-4 mt-1"
              />
              <span className="leading-snug">{detail.hours}</span>
            </div>
          )}
          {detail?.description && (
            <p className="text-fg-3 text-memo line-clamp-2 leading-snug  border-t border-black/5 mt-0.5 pt-2">
              {detail.description}
            </p>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 justify-end">
          <KaGongButton
            buttonStyle="OUTLINED"
            buttonSize="LARGE"
            onClick={() => detail && setShowEditModal(true)}
            disabled={!detail || detailLoading}
          >
            수정하기
          </KaGongButton>
          <LikeButton liked={liked} onClick={() => toggle(cafe.id)} />
        </div>

        <CafeReviewSection cafeId={cafe.id} />
        {/* <button
          type="button"
          onClick={() => setShowImageSubmit(true)}
          className={cls(
            "flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl",
            "text-[13px] font-semibold text-fg-2",
            "bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors",
          )}
        >
          <TbCamera size={15} strokeWidth={2.2} />
          사진 제보하기
        </button> */}
      </div>

      <ImageSubmitModal
        cafeId={cafe.id}
        cafeName={cafe.name}
        showModal={showImageSubmit}
        onClose={() => setShowImageSubmit(false)}
      />

      {detail && (
        <CafeEditModal
          cafe={detail}
          showModal={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
