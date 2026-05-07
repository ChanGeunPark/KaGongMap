"use client";

import { useEffect } from "react";
import CafeReviewSection from "@/components/cafe/detail/CafeReviewSection";
import { track } from "@/lib/firebase/analytics";
import type { CafeMarker, CafeWithDetail } from "@/types/db";
import Actions from "./Actions";
import DetailInfo from "./DetailInfo";
import Header from "./Header";
import ImageGallery from "./ImageGallery";

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
  useEffect(() => {
    track("cafe_view", {
      cafe_id: cafe.id,
      cafe_name: cafe.name,
      tag_count: cafe.tags.length,
      like_count: cafe.like_count,
    });
  }, [cafe.id, cafe.name, cafe.like_count, cafe.tags.length]);

  const images = detail?.images ?? [];

  return (
    <div className="flex flex-col gap-5 p-5">
      <ImageGallery cafe={cafe} images={images} loading={detailLoading} />
      <Header cafe={cafe} />
      <DetailInfo detail={detail} loading={detailLoading} />

      <div className="flex flex-col gap-2">
        <Actions cafe={cafe} detail={detail} loading={detailLoading} />
        <CafeReviewSection cafeId={cafe.id} />
      </div>
    </div>
  );
}
