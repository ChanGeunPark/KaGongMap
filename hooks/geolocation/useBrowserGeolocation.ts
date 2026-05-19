import { RefObject, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TRANSITION } from "@/components/map/mapConfig";
import { useLocationPermission } from "@/hooks/geolocation/useLocationPermission";
import { MapWithMorph } from "@/types/naverMap";
import type { UserLocation } from "./useMapGeolocation";

/**
 * 브라우저(non-WebView) 환경의 위치 추적 — `navigator.geolocation` 직접 사용.
 *
 * - 권한이 `granted` 일 때만 `watchPosition` 시작 → 좌표 갱신.
 * - `moveToCurrentLocation`: 1회 `getCurrentPosition` 으로 morph.
 *
 * @param enabled false 면 모든 활동 중단 (다른 환경에 양보)
 */
export function useBrowserGeolocation(
  mapRef: RefObject<naver.maps.Map | null>,
  enabled: boolean,
) {
  const locationPermission = useLocationPermission();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (locationPermission !== "granted") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, locationPermission]);

  const moveToCurrentLocation = useCallback(() => {
    if (!enabled) return;

    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("브라우저가 위치 권한을 지원하지 않습니다.");
      return;
    }
    if (locationPermission === "denied") {
      toast.error("위치 권한이 꺼져 있습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        });
        (mapRef.current as MapWithMorph | null)?.morph(
          new naver.maps.LatLng(coords.latitude, coords.longitude),
          16,
          TRANSITION,
        );
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("위치 권한을 허용해주세요.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }, [enabled, locationPermission, mapRef]);

  return {
    isLocationEnabled: enabled && locationPermission === "granted",
    locationPermission: enabled ? locationPermission : "checking",
    moveToCurrentLocation,
    setUserLocation,
    userLocation: enabled ? userLocation : null,
  } as const;
}
