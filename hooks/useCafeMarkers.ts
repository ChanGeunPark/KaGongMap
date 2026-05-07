import { RefObject, useEffect, useRef } from "react";
import { CafeMarkerClusterer } from "@/components/map/CafeMarkerClusterer";
import { cafePinHtml } from "@/components/map/markerIcons";
import { MarkerWithMutableMeta } from "@/types/naverMap";
import { CafeMarker } from "@/types/db";

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

  // 선택/호버 상태 변경 시 핀 아이콘 + z-order 갱신.
  // cafes를 한 번 순회하며 setIcon과 active/inactive 분할을 동시에 수행 → O(n).
  // active 정렬은 sort 대신 2-way partition으로 처리.
  useEffect(() => {
    if (!ready || !clustererRef.current) return;

    const active: naver.maps.Marker[] = [];
    const inactive: naver.maps.Marker[] = [];

    for (const cafe of cafes) {
      const marker = markers.current.get(cafe.id);
      if (!marker) continue;
      const isActive = cafe.id === selectedId || cafe.id === hoveredId;
      marker.setIcon({
        content: cafePinHtml(cafe, isActive),
        anchor: new naver.maps.Point(0, 14),
      });
      (isActive ? active : inactive).push(marker);
    }

    clustererRef.current.setMarkers([...active, ...inactive]);
  }, [ready, selectedId, hoveredId, cafes, clustererRef]);

  // unmount 시 로컬 마커 store만 비움 (clusterer.destroy는 useNaverMap이 담당)
  useEffect(() => {
    const store = markers.current;
    return () => {
      store.clear();
    };
  }, []);
}
