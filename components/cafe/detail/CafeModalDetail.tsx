"use client";

import { useEffect } from "react";
import { track } from "@/lib/firebase/analytics";
import Badge from "@/components/badge/Badge";
import KaGongButton from "@/components/button/KaGongButton";
import KGIcon from "@/components/ui/KGIcon";
import { openNaverMapPlace } from "@/lib/naverMapAppLink";
import { cls, getCloudflareImageUrl } from "@/lib/utils";
import {
  useCafeEditModalStore,
  useImageModalStore,
  useImageSubmitModalStore,
} from "@/stores/modalStore";
import { CafeMarker, CafeWithDetail } from "@/types/db";
import { useLikes } from "@/hooks/useLikes";
import { useBookmarks } from "@/hooks/useBookmarks";
import Image from "next/image";
import { TbClock, TbCoin, TbHeart, TbMapPin } from "react-icons/tb";
import LikeButton from "@/components/button/LikeButton";
import BookmarkButton from "@/components/button/BookmarkButton";
import CafeReviewSection from "@/components/cafe/detail/CafeReviewSection";
import { TAG_LABELS } from "@/lib/data";

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
  const { setShowImageSubmitModal, setCafeId, setCafeName } =
    useImageSubmitModalStore();
  const { setShowCafeEditModal, setCafe } = useCafeEditModalStore();

  const { isLiked, toggle, isAuthed: likeAuthed } = useLikes();
  const liked = isLiked(cafe.id);
  const {
    isBookmarked,
    toggle: toggleBookmark,
    isPending: bookmarkPending,
    isAuthed: bookmarkAuthed,
  } = useBookmarks();
  const bookmarked = isBookmarked(cafe.id);

  useEffect(() => {
    track("cafe_view", {
      cafe_id: cafe.id,
      cafe_name: cafe.name,
      tag_count: cafe.tags.length,
      like_count: cafe.like_count,
    });
  }, [cafe.id, cafe.name, cafe.like_count, cafe.tags.length]);

  const images = detail?.images ?? [];
  const visibleImages = images.slice(0, 5);
  const hasDetailInfo = !!(
    detail &&
    (detail.address || detail.hours || detail.description)
  );

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
                onClick={() => {
                  setCafeId(cafe.id);
                  setCafeName(cafe.name);
                  setShowImageSubmitModal(true);
                }}
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
          {/* 최소금액 */}
          {detail?.min_order_amount != null && (
            <div className="flex gap-2 text-mono text-fg-2">
              <TbCoin
                size={14}
                strokeWidth={2}
                className="shrink-0 text-fg-4 mt-1"
              />
              <span className="leading-snug">
                최소금액 {detail.min_order_amount.toLocaleString("ko-KR")}원
              </span>
            </div>
          )}

          {detail?.address && (
            <div className="flex items-start gap-2 text-mono text-fg-2">
              <TbMapPin
                size={14}
                strokeWidth={2}
                className="shrink-0 text-fg-4 mt-1"
              />
              <span className="leading-snug">{detail.address}</span>
            </div>
          )}
          {detail?.hours && (
            <div className="flex gap-2 text-mono text-fg-2">
              <TbClock
                size={14}
                strokeWidth={2}
                className="shrink-0 text-fg-4 mt-1"
              />
              <span className="leading-snug">{detail.hours}</span>
            </div>
          )}
          {detail?.description && (
            <p className="whitespace-pre-line text-fg-3 text-sm border-t border-black/5 mt-0.5 pt-3">
              {detail.description}
            </p>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 justify-between">
          <KaGongButton
            buttonStyle="OUTLINED"
            buttonSize="LARGE"
            onClick={() => {
              if (detail) {
                setShowCafeEditModal(true);
                setCafe(detail);
              }
            }}
            disabled={!detail || detailLoading}
          >
            수정하기
          </KaGongButton>

          <div className="flex gap-2">
            <KaGongButton
              buttonStyle="PRIMARY"
              buttonSize="LARGE"
              onClick={() => {
                const lat = detail?.lat ?? cafe.lat;
                const lng = detail?.lng ?? cafe.lng;
                const placeName = detail?.name ?? cafe.name;
                const webSearchQuery = [cafe.name, detail?.address]
                  .filter(Boolean)
                  .join(" ");
                openNaverMapPlace({
                  lat,
                  lng,
                  placeName,
                  webSearchQuery: webSearchQuery.trim() || placeName,
                });
              }}
            >
              길찾기
            </KaGongButton>
            <BookmarkButton
              bookmarked={bookmarked}
              onClick={() => {
                track("favorite_toggle", {
                  cafe_id: cafe.id,
                  action: bookmarked ? "remove" : "add",
                  is_logged_in: bookmarkAuthed,
                });
                toggleBookmark(cafe.id);
              }}
              disabled={bookmarkPending}
            />
            <LikeButton
              liked={liked}
              onClick={() => {
                track("like_toggle", {
                  cafe_id: cafe.id,
                  action: liked ? "remove" : "add",
                  is_logged_in: likeAuthed,
                });
                toggle(cafe.id);
              }}
            />
          </div>
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
    </div>
  );
}
