import { RefObject, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TRANSITION } from "@/components/map/mapConfig";
import { MapWithMorph } from "@/types/naverMap";

export type LocationPermission =
  | "checking"
  | "granted"
  | "prompt"
  | "denied"
  | "unsupported";

export type UserLocation = {
  lat: number;
  lng: number;
  accuracy: number;
};

export function useMapGeolocation(
  mapRef: RefObject<naver.maps.Map | null>,
) {
  const [locationPermission, setLocationPermission] =
    useState<LocationPermission>("checking");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setTimeout(() => setLocationPermission("unsupported"), 0);
      return;
    }

    if (!navigator.permissions?.query) {
      setTimeout(() => setLocationPermission("prompt"), 0);
      return;
    }

    let permissionStatus: PermissionStatus | null = null;
    let cancelled = false;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (cancelled) return;

        permissionStatus = status;
        setLocationPermission(status.state);
        status.onchange = () => setLocationPermission(status.state);
      })
      .catch(() => {
        if (!cancelled) setLocationPermission("prompt");
      });

    return () => {
      cancelled = true;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  useEffect(() => {
    if (locationPermission !== "granted" || !navigator.geolocation) return;

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
  }, [locationPermission]);

  const moveToCurrentLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationPermission("unsupported");
      toast.error("브라우저가 위치 권한을 지원하지 않습니다.");
      return;
    }

    if (locationPermission === "denied") {
      toast.error("위치 권한이 꺼져 있습니다.");
      return;
    }

    if (locationPermission === "prompt") {
      toast.error("위치 권한을 허용해주세요.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationPermission("granted");
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
        setLocationPermission(
          error.code === error.PERMISSION_DENIED ? "denied" : "prompt",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  }, [locationPermission, mapRef]);

  return {
    isLocationEnabled: locationPermission === "granted",
    locationPermission,
    moveToCurrentLocation,
    setUserLocation,
    userLocation,
  };
}
