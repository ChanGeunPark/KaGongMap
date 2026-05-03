"use client";

import { useMemo } from "react";
import { CafeMarker } from "@/types/db";
import { FILTER_TAG_MAP } from "@/lib/data";
import { SortBy } from "@/types/cafe";

interface Bounds {
  ne: naver.maps.LatLng;
  sw: naver.maps.LatLng;
}

// 필터 + 정렬 + 지도 bounds 적용.
// - cafes: 필터/정렬만 적용된 전체 결과 (지도 마커용)
// - visibleCafes: cafes 중 현재 화면에 보이는 것만 (사이드바/시트 카운트용)
export function useFilteredCafes(
  allCafes: CafeMarker[],
  activeFilters: Set<string>,
  sortBy: SortBy,
  bounds: Bounds | null,
) {
  const cafes = useMemo<CafeMarker[]>(() => {
    let list = [...allCafes];

    for (const filterId of activeFilters) {
      const tag = FILTER_TAG_MAP[filterId];
      if (tag) list = list.filter((c) => c.tags.includes(tag));
    }

    if (sortBy === "score" || sortBy === "stars") {
      list.sort((a, b) => {
        const likeDiff = b.like_count - a.like_count;
        if (likeDiff !== 0) return likeDiff;
        return b.tags.length - a.tags.length;
      });
    }

    return list;
  }, [allCafes, activeFilters, sortBy]);

  const visibleCafes = useMemo<CafeMarker[]>(() => {
    if (!bounds) return cafes;
    return cafes.filter(
      (c) =>
        c.lat >= bounds.sw.lat() &&
        c.lat <= bounds.ne.lat() &&
        c.lng >= bounds.sw.lng() &&
        c.lng <= bounds.ne.lng(),
    );
  }, [cafes, bounds]);

  return { cafes, visibleCafes };
}
