import { RefObject, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { TRANSITION } from "@/components/map/mapConfig";
import { nativeBridge } from "@/lib/native/bridge";
import { useLocationPermission } from "@/hooks/geolocation/useLocationPermission";
import { useNativeStore } from "@/stores/nativeStore";
import { MapWithMorph } from "@/types/naverMap";
import type { UserLocation } from "./useMapGeolocation";

const WEBVIEW_DISTANCE_FILTER_METERS = 5;

/**
 * WebView 환경의 위치 추적 — Flutter 브릿지로 위임.
 *
 * - 권한 `granted` 일 때만 `START_LOCATION_UPDATES` 송신 → cleanup 시 STOP.
 * - 좌표는 NativeBridgeInit 이 `LOCATION_UPDATE` 수신해 `nativeStore.nativeLocation` 에 박음.
 * - `moveToCurrentLocation`: 이미 좌표 있으면 morph, 없으면 `REQUEST_LOCATION` 1회 송신.
 *
 * @param enabled false 면 모든 활동 중단 (다른 환경에 양보)
 */
export function useWebViewGeolocation(
  mapRef: RefObject<naver.maps.Map | null>,
  enabled: boolean,
) {
  const locationPermission = useLocationPermission();
  const nativeLocation = useNativeStore((s) => s.nativeLocation);

  useEffect(() => {
    if (!enabled) return;
    if (locationPermission !== "granted") return;

    const sent = nativeBridge.send({
      type: "START_LOCATION_UPDATES",
      payload: {
        highAccuracy: true,
        distanceFilter: WEBVIEW_DISTANCE_FILTER_METERS,
      },
    });
    if (!sent) return;

    return () => {
      nativeBridge.send({ type: "STOP_LOCATION_UPDATES" });
    };
  }, [enabled, locationPermission]);

  const setUserLocation = useCallback(
    (loc: UserLocation | null) => {
      if (!enabled) return;
      useNativeStore.getState().setNativeLocation(loc);
    },
    [enabled],
  );

  const moveToCurrentLocation = useCallback(() => {
    if (!enabled) return;

    if (locationPermission === "denied") {
      toast.error("앱 설정에서 위치 권한을 허용해주세요.");
      return;
    }

    if (nativeLocation) {
      (mapRef.current as MapWithMorph | null)?.morph(
        new naver.maps.LatLng(nativeLocation.lat, nativeLocation.lng),
        16,
        TRANSITION,
      );
      return;
    }

    const sent = nativeBridge.send({
      type: "REQUEST_LOCATION",
      payload: { highAccuracy: true },
    });
    if (!sent) {
      toast.error("앱 연결이 끊어졌어요. 잠시 후 다시 시도해주세요.");
    }
  }, [enabled, locationPermission, nativeLocation, mapRef]);

  return {
    isLocationEnabled: enabled && locationPermission === "granted",
    locationPermission: enabled ? locationPermission : "checking",
    moveToCurrentLocation,
    setUserLocation,
    userLocation: enabled ? nativeLocation : null,
  } as const;
}
