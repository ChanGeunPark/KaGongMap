"use client";

import CafeCard from "@/components/cafe/card/CafeCard";
import type { CafeMarker } from "@/types/db";
import EmptyPanel from "./EmptyPanel";

type BookmarkTabProps = {
  cafes: CafeMarker[];
  isLoading: boolean;
  onSelectCafe: (id: string) => void;
};

export default function BookmarkTab({
  cafes,
  isLoading,
  onSelectCafe,
}: BookmarkTabProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg p-6">
        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
        <div className="mt-4 h-20 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (cafes.length === 0) {
    return (
      <EmptyPanel
        icon="bookmark"
        title="아직 즐겨찾기한 카페가 없어요."
        description="상세 모달에서 북마크 버튼을 누르면 여기에 모입니다."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cafes.map((cafe) => (
        <CafeCard
          key={cafe.id}
          cafe={cafe}
          onClick={() => onSelectCafe(cafe.id)}
        />
      ))}
    </div>
  );
}
