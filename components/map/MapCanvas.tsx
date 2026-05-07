"use client";

import { useEffect } from "react";
import { CafeMarker } from "@/types/db";
import { useCafeMarkers } from "@/hooks/useCafeMarkers";
import { useMapGeolocation } from "@/hooks/useMapGeolocation";
import { useMapMorphTo } from "@/hooks/useMapMorphTo";
import { useNaverMap } from "@/hooks/useNaverMap";
import { useUserMarker } from "@/hooks/useUserMarker";
import { MapWithMorph } from "@/types/naverMap";
import { MapControls } from "./MapControls";
import { TRANSITION } from "./mapConfig";

const MAP_CONTAINER_ID = "naver-map";

interface MapCanvasProps {
  cafes: CafeMarker[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onBoundsChange?: (bounds: {
    ne: naver.maps.LatLng;
    sw: naver.maps.LatLng;
  }) => void;
}

export default function MapCanvas({
  cafes,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onBoundsChange,
}: MapCanvasProps) {
  const { mapRef, clustererRef, ready } = useNaverMap({
    containerId: MAP_CONTAINER_ID,
    onBoundsChange,
  });

  const {
    isLocationEnabled,
    locationPermission,
    moveToCurrentLocation,
    setUserLocation,
    userLocation,
  } = useMapGeolocation(mapRef);

  // 지도 부트스트랩 직후 1회 현재 위치로 recenter (low-accuracy, 빠른 fix)
  useEffect(() => {
    if (!ready || !mapRef.current || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        });
        mapRef.current?.setCenter(
          new naver.maps.LatLng(coords.latitude, coords.longitude),
        );
        mapRef.current?.setZoom(16);
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 5_000 },
    );
  }, [ready, mapRef, setUserLocation]);

  useCafeMarkers({
    ready,
    cafes,
    selectedId,
    hoveredId,
    clustererRef,
    onSelect,
    onHover,
  });

  useMapMorphTo({ mapRef, cafes, selectedId });

  useUserMarker({ mapRef, userLocation });

  const handleZoom = (delta: number) => {
    const map = mapRef.current as MapWithMorph | null;
    if (!map) return;
    map.morph(map.getCenter(), map.getZoom() + delta, TRANSITION);
  };

  return (
    <>
      <div id={MAP_CONTAINER_ID} className="absolute inset-0 w-full h-full" />
      <MapControls
        isLocationEnabled={isLocationEnabled}
        locationTitle={
          locationPermission === "denied"
            ? "위치 권한이 꺼져 있습니다"
            : "현재 위치로 이동"
        }
        onZoomIn={() => handleZoom(1)}
        onZoomOut={() => handleZoom(-1)}
        onLocate={moveToCurrentLocation}
      />
    </>
  );
}
