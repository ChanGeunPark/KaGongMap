"use client";

import { useQuery } from "@tanstack/react-query";
import CafeCard from "@/components/cafe/card/CafeCard";
import { cafeKeys, fetchMyRegisteredCafes } from "@/lib/api/cafes";
import EmptyPanel from "./EmptyPanel";

type MyCafesTabProps = {
  onSelectCafe: (id: string) => void;
};

export default function MyCafesTab({ onSelectCafe }: MyCafesTabProps) {
  const { data: cafes = [], isLoading } = useQuery({
    queryKey: cafeKeys.mine(),
    queryFn: fetchMyRegisteredCafes,
  });

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
        icon="pin"
        title="아직 등록된 카페가 없어요."
        description="제보가 어드민 승인을 통과하면 여기에 모입니다."
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
