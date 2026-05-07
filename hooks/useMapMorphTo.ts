import { RefObject, useEffect } from "react";
import { CafeMarker } from "@/types/db";
import { MapWithMorph } from "@/types/naverMap";

const MIN_ZOOM_ON_SELECT = 16;
const MORPH_DURATION_MS = 500;

interface UseMapMorphToOptions {
  mapRef: RefObject<naver.maps.Map | null>;
  cafes: CafeMarker[];
  selectedId: string | null;
}

export function useMapMorphTo({
  mapRef,
  cafes,
  selectedId,
}: UseMapMorphToOptions) {
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const cafe = cafes.find((c) => c.id === selectedId);
    if (!cafe || cafe.lat == null || cafe.lng == null) return;

    const map = mapRef.current as MapWithMorph;
    map.morph(
      new naver.maps.LatLng(cafe.lat, cafe.lng),
      Math.max(map.getZoom(), MIN_ZOOM_ON_SELECT),
      { duration: MORPH_DURATION_MS, easing: "easeOutCubic" },
    );
  }, [selectedId, cafes, mapRef]);
}
