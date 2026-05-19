"use client";

import { useState } from "react";
import BookmarkButton from "@/components/button/BookmarkButton";
import CafeReportModal from "@/components/cafe/detail/CafeReportModal";
import KaGongButton from "@/components/button/KaGongButton";
import LikeButton from "@/components/button/LikeButton";
import { useBookmarks } from "@/hooks/user/useBookmarks";
import { useLikes } from "@/hooks/user/useLikes";
import { track } from "@/lib/firebase/analytics";
import { openNaverMapPlace } from "@/lib/naverMapAppLink";
import { useCafeEditModalStore } from "@/stores/modalStore";
import type { CafeMarker, CafeWithDetail } from "@/types/db";

type ActionsProps = {
  cafe: CafeMarker;
  detail: CafeWithDetail | null;
  loading: boolean;
};

export default function Actions({ cafe, detail, loading }: ActionsProps) {
  const { setShowCafeEditModal, setCafe } = useCafeEditModalStore();

  const {
    isLiked,
    toggle: toggleLike,
    isAuthed: likeAuthed,
    isPending: likePending,
  } = useLikes();
  const liked = isLiked(cafe.id);

  const {
    isBookmarked,
    toggle: toggleBookmark,
    isAuthed: bookmarkAuthed,
    isPending: bookmarkPending,
  } = useBookmarks();
  const bookmarked = isBookmarked(cafe.id);

  const handleEdit = () => {
    if (!detail) return;
    setShowCafeEditModal(true);
    setCafe(detail);
  };

  const handleNavigate = () => {
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
  };

  const handleBookmark = () => {
    track("favorite_toggle", {
      cafe_id: cafe.id,
      action: bookmarked ? "remove" : "add",
      is_logged_in: bookmarkAuthed,
    });
    toggleBookmark(cafe.id);
  };

  const handleLike = () => {
    if (likePending) return;
    track("like_toggle", {
      cafe_id: cafe.id,
      action: liked ? "remove" : "add",
      is_logged_in: likeAuthed,
    });
    toggleLike(cafe.id);
  };

  return (
    <>
      <div className="flex gap-2 justify-between">
        <div className="flex gap-2">
          <KaGongButton
            buttonStyle="OUTLINED"
            buttonSize="LARGE"
            onClick={handleEdit}
            disabled={!detail || loading}
          >
            수정제안
          </KaGongButton>
        </div>

        <div className="flex gap-2">
          <KaGongButton
            buttonStyle="PRIMARY"
            buttonSize="LARGE"
            onClick={handleNavigate}
          >
            길찾기
          </KaGongButton>
          <BookmarkButton
            bookmarked={bookmarked}
            onClick={handleBookmark}
            disabled={bookmarkPending}
          />
          <LikeButton
            liked={liked}
            disabled={likePending}
            onClick={handleLike}
          />
        </div>
      </div>
    </>
  );
}
