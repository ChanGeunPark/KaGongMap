import { RefObject, useEffect, useRef } from "react";
import { USER_MARKER_SIZE } from "@/components/map/mapConfig";
import { userPinHtml } from "@/components/map/markerIcons";
import type { UserLocation } from "./useMapGeolocation";

const ACCURACY_CIRCLE_STYLE = {
  fillColor: "#3772cf",
  fillOpacity: 0.1,
  strokeColor: "#3772cf",
  strokeOpacity: 0.35,
  strokeWeight: 1,
} as const;

interface UseUserMarkerOptions {
  mapRef: RefObject<naver.maps.Map | null>;
  userLocation: UserLocation | null;
}

export function useUserMarker({ mapRef, userLocation }: UseUserMarkerOptions) {
  const markerRef = useRef<naver.maps.Marker | null>(null);
  const circleRef = useRef<naver.maps.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const position = new naver.maps.LatLng(userLocation.lat, userLocation.lng);

    if (markerRef.current) {
      (
        markerRef.current as unknown as {
          setPosition(p: naver.maps.LatLng): void;
        }
      ).setPosition(position);
    } else {
      markerRef.current = new naver.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          content: userPinHtml(),
          anchor: new naver.maps.Point(
            USER_MARKER_SIZE / 2,
            USER_MARKER_SIZE / 2,
          ),
        },
        zIndex: 1000,
      });
    }

    if (circleRef.current) {
      circleRef.current.setCenter(position);
      circleRef.current.setRadius(userLocation.accuracy);
    } else {
      circleRef.current = new naver.maps.Circle({
        map: mapRef.current,
        center: position,
        radius: userLocation.accuracy,
        ...ACCURACY_CIRCLE_STYLE,
      });
    }
  }, [userLocation, mapRef]);
}
