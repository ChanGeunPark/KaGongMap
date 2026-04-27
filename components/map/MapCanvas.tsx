"use client";

import { Cafe } from "@/types/cafe";
import { useCallback, useEffect, useRef, useState } from "react";
import KGIcon from "../ui/KGIcon";
import { toast } from "react-toastify";

function scoreColor(score: number) {
  if (score >= 85) return "#22c55e";
  if (score >= 65) return "#f5a524";
  return "#ef4444";
}

function pinHtml(cafe: Cafe, active: boolean) {
  const color = scoreColor(cafe.score);
  // const size = active ? 52 : 42;
  // const fontSize = active ? 13 : 11;
  return `
    <div
            id="overlay_${cafe.id}"
            class="overlay_content"
            style="transform:translateY(-20px) ;width:100%; cursor:pointer; padding-left:4px; padding-top:2px; padding-bottom:2px; padding-right:12px; display:flex; align-items:center; border:none; border-radius:999px; background-color:white; border:2px solid ${color}; box-shadow:0 2px 7px rgba(0,0,0,0.2); position:relative;"
            >
            <figure style="height: 24px; width: 0; overflow:hidden; transition: all 0.3s ease;">
              <img
                style="height: 24px; width:24px; object-fit: cover; border-radius: 50%; pointer-events: none; "
                src="https://picsum.photos/id/103/300/300"
              />
            </figure>
            <p style="padding:0; margin:0; margin-left:12px; font-size:12px; font-weight:700; pointer-events: none;">
            ${cafe.name}
            </p>
            <div style="position:absolute; left:50%; bottom:-1px; transform: translateX(-50%) translateY(50%); pointer-events:none;">
            <div class="overlay_content_point" style="border-radius:0 0 3px 0; width:8px; height:8px; transform:rotate(45deg); background-color:white; pointer-events:none; border-right:2px solid ${color}; border-bottom:2px solid ${color};"/>
            </div>
          </div>
  `;
}

interface MapCanvasProps {
  cafes: Cafe[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

type LocationPermission =
  | "checking" // 위치 권한 확인 중
  | "granted" // 위치 권한 허용
  | "prompt" // 위치 권한 요청필요 (사용자가 위치 권한을 허용해야 함)
  | "denied" // 위치 권한 거절
  | "unsupported"; // 위치 권한 지원 안 됨 (브라우저가 위치 권한을 지원하지 않음)

export default function MapCanvas({
  cafes,
  selectedId,
  onSelect,
}: MapCanvasProps) {
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markers = useRef<Map<string, naver.maps.Marker>>(new Map());
  const initialized = useRef(false);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermission>(() => {
      if (typeof window === "undefined") return "checking";
      if (!navigator.geolocation) return "unsupported";
      if (!navigator.permissions?.query) return "prompt";
      return "checking";
    });
  const isLocationEnabled = locationPermission === "granted";

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !navigator.geolocation ||
      !navigator.permissions?.query
    ) {
      toast.error(
        "위치 권한을 허용해주세요. 브라우저가 위치 권한을 지원하지 않습니다.",
      );
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
        mapInstance.current?.setCenter(
          new naver.maps.LatLng(coords.latitude, coords.longitude),
        );
        mapInstance.current?.setZoom(16);
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
  }, []);

  useEffect(() => {
    function initMap() {
      if (initialized.current) return;
      initialized.current = true;

      const center = new naver.maps.LatLng(37.5005, 127.038);
      mapInstance.current = new naver.maps.Map("naver-map", {
        center,
        zoom: 15,
        minZoom: 12,
        maxZoom: 19,
      });

      cafes.forEach((cafe) => {
        if (cafe.lat == null || cafe.lng == null) return;

        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(cafe.lat, cafe.lng),
          map: mapInstance.current!,
          icon: {
            content: pinHtml(cafe, false),
            anchor: new naver.maps.Point(21, 21),
          },
          title: cafe.name,
        });

        naver.maps.Event.addListener(marker, "click", () => onSelect(cafe.id));
        markers.current.set(cafe.id, marker);
      });
    }

    if (
      typeof window !== "undefined" &&
      (window as Window & { naver?: typeof naver }).naver?.maps
    ) {
      initMap();
    } else {
      const interval = setInterval(() => {
        if ((window as Window & { naver?: typeof naver }).naver?.maps) {
          clearInterval(interval);
          initMap();
        }
      }, 100);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    markers.current.forEach((marker, id) => {
      const cafe = cafes.find((c) => c.id === id);
      if (!cafe) return;
      marker.setIcon({
        content: pinHtml(cafe, id === selectedId),
        anchor: new naver.maps.Point(21, 21),
      });
    });
  }, [selectedId, cafes]);

  return (
    <>
      <div id="naver-map" className="absolute inset-0 w-full h-full" />;
      {/* Zoom controls */}
      <div className="absolute top-5 right-5 flex flex-col gap-2 z-20">
        <MapCtrlBtn
          onClick={() => {
            if (mapInstance.current) {
              mapInstance.current.setZoom(mapInstance.current.getZoom() + 1);
            }
          }}
          icon="plus"
        />
        <MapCtrlBtn
          onClick={() => {
            if (mapInstance.current) {
              mapInstance.current.setZoom(mapInstance.current.getZoom() - 1);
            }
          }}
          icon="minus"
        />
        <div className="h-px bg-border-subtle" />
        <MapCtrlBtn
          onClick={moveToCurrentLocation}
          icon="locate"
          active={isLocationEnabled}
          title={
            locationPermission === "denied"
              ? "위치 권한이 꺼져 있습니다"
              : "현재 위치로 이동"
          }
        />
      </div>
    </>
  );
}

function MapCtrlBtn({
  icon,
  onClick,
  active = false,
  title,
}: {
  icon: string;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-xl border inline-flex items-center justify-center cursor-pointer shadow-card ${
        active
          ? "bg-brand text-white border-accent"
          : "bg-bg text-fg-2 border-border-subtle"
      }`}
    >
      <KGIcon name={icon} size={16} stroke={2} />
    </button>
  );
}
