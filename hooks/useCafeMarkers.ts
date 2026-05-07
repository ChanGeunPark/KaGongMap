import { RefObject, useEffect, useRef } from "react";
import { CafeMarkerClusterer } from "@/components/map/CafeMarkerClusterer";
import { cafePinHtml } from "@/components/map/markerIcons";
import { orderCafesForCluster } from "@/components/map/markerOrdering";
import { MarkerWithMutableMeta } from "@/types/naverMap";
import { CafeMarker } from "@/types/db";

// z-index 정책: 사용자 마커(useUserMarker)는 100으로 항상 최상단.
// 카페 마커는 그 아래에서 active(선택/호버)와 inactive를 구분.
const INACTIVE_MARKER_Z_INDEX = 1;
const ACTIVE_MARKER_Z_INDEX = 100;

interface UseCafeMarkersOptions {
  ready: boolean;
  cafes: CafeMarker[];
  selectedId: string | null;
  hoveredId: string | null;
  clustererRef: RefObject<CafeMarkerClusterer | null>;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function useCafeMarkers({
  ready,
  cafes,
  selectedId,
  hoveredId,
  clustererRef,
  onSelect,
  onHover,
}: UseCafeMarkersOptions) {
  const markers = useRef<Map<string, naver.maps.Marker>>(new Map());

  // 카페 목록 ↔ 마커 인스턴스 diff 동기화
  useEffect(() => {
    if (!ready || !clustererRef.current) return;

    const nextIds = new Set(cafes.map((c) => c.id));

    markers.current.forEach((marker, id) => {
      if (nextIds.has(id)) return;
      marker.setMap(null);
      markers.current.delete(id);
    });

    cafes.forEach((cafe) => {
      if (cafe.lat == null || cafe.lng == null) return;

      const existing = markers.current.get(cafe.id);
      if (existing) {
        const m = existing as MarkerWithMutableMeta;
        m.setPosition(new naver.maps.LatLng(cafe.lat, cafe.lng));
        m.setTitle(cafe.name);
        return;
      }

      const next = new naver.maps.Marker({
        position: new naver.maps.LatLng(cafe.lat, cafe.lng),
        map: null,
        icon: {
          content: cafePinHtml(cafe, false),
          anchor: new naver.maps.Point(0, 14),
        },
        title: cafe.name,
      });

      naver.maps.Event.addListener(next, "click", () => onSelect(cafe.id));
      naver.maps.Event.addListener(next, "mouseover", () => onHover(cafe.id));
      naver.maps.Event.addListener(next, "mouseout", () => onHover(null));
      markers.current.set(cafe.id, next);
    });

    const ordered = cafes
      .map((c) => markers.current.get(c.id))
      .filter((m): m is naver.maps.Marker => Boolean(m));

    clustererRef.current.setMarkers(ordered);
  }, [ready, cafes, onSelect, onHover, clustererRef]);

  // 선택/호버 상태 변경 시 핀 아이콘 + z-index 갱신.
  // 책임 분리:
  //  - orderCafesForCluster (partition): clusterer의 30개 표시 한도 안에 active를
  //    포함시키기 위해 active를 array 앞에 둠
  //  - setZIndex: DOM 추가 순서에 의존하지 않고 active 마커가 시각적 위에 오게 함
  //    (clusterer의 setMap 순서는 partition을 따라 active가 먼저 그려져 가려지기 때문)
  useEffect(() => {
    if (!ready || !clustererRef.current) return;

    const ordered = orderCafesForCluster(cafes, selectedId, hoveredId);
    const orderedMarkers: naver.maps.Marker[] = [];

    for (const cafe of ordered) {
      const marker = markers.current.get(cafe.id);
      if (!marker) continue;
      const isActive = cafe.id === selectedId || cafe.id === hoveredId;
      marker.setIcon({
        content: cafePinHtml(cafe, isActive),
        anchor: new naver.maps.Point(0, 14),
      });
      (marker as MarkerWithMutableMeta).setZIndex(
        isActive ? ACTIVE_MARKER_Z_INDEX : INACTIVE_MARKER_Z_INDEX,
      );
      orderedMarkers.push(marker);
    }

    clustererRef.current.setMarkers(orderedMarkers);
  }, [ready, selectedId, hoveredId, cafes, clustererRef]);

  // unmount 시 로컬 마커 store만 비움 (clusterer.destroy는 useNaverMap이 담당)
  useEffect(() => {
    const store = markers.current;
    return () => {
      store.clear();
    };
  }, []);
}
