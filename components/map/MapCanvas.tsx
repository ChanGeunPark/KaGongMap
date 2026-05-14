"use client";

import { useEffect, useRef } from "react";
import { CafeMarker } from "@/types/db";
import { useCafeMarkers } from "@/hooks/useCafeMarkers";
import { useMapGeolocation } from "@/hooks/useMapGeolocation";
import { useMapMorphTo } from "@/hooks/useMapMorphTo";
import { useNaverMap } from "@/hooks/useNaverMap";
import { useUserMarker } from "@/hooks/useUserMarker";
import { useUserHeading } from "@/hooks/useUserHeading";
import { useNativeStore } from "@/stores/nativeStore";
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

  const isWebView = useNativeStore((s) => s.isWebView);
  const initialRecenterDoneRef = useRef(false);

  // 브라우저: 권한이 granted 일 때 1회 현재 위치로 recenter (low-accuracy, 빠른 fix).
  // 권한이 아직 prompt/denied 면 자동 다이얼로그를 띄우지 않고 사용자 액션 대기.
  useEffect(() => {
    if (isWebView) return;
    if (!ready || !mapRef.current || !navigator.geolocation) return;
    if (locationPermission !== "granted") return;
    if (initialRecenterDoneRef.current) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        initialRecenterDoneRef.current = true;
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
  }, [ready, mapRef, setUserLocation, isWebView, locationPermission]);

  // WebView: navigator.geolocation 이 동작하지 않으니, Flutter 가 push 한 첫 좌표가
  // store 에 들어오면 그때 1회 recenter.
  useEffect(() => {
    if (!isWebView) return;
    if (!ready || !mapRef.current || !userLocation) return;
    if (initialRecenterDoneRef.current) return;
    initialRecenterDoneRef.current = true;
    mapRef.current.setCenter(
      new naver.maps.LatLng(userLocation.lat, userLocation.lng),
    );
    mapRef.current.setZoom(16);
  }, [isWebView, ready, mapRef, userLocation]);

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

  // 위치 권한이 있을 때만 컴퍼스 구독 — 지도 화면 떠나면 자동 STOP (배터리 보호)
  const heading = useUserHeading(isLocationEnabled);

  useUserMarker({ mapRef, ready, userLocation, heading });

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
