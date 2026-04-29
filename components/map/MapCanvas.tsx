"use client";

import { CafeMarker } from "@/types/db";
import { useCallback, useEffect, useRef, useState } from "react";
import KGIcon from "../ui/KGIcon";
import { toast } from "react-toastify";

// 태그 개수 기준: 7+ 우수(녹색), 4+ 양호(앰버), 그 외(레드)
function scoreColor(tagCount: number) {
  if (tagCount >= 7) return "#22c55e";
  if (tagCount >= 4) return "#f5a524";
  return "#ef4444";
}

function pinHtml(cafe: CafeMarker, active: boolean) {
  const color = scoreColor(cafe.tags.length);
  return `
    <div
      id="overlay_${cafe.id}"
      style="
        display:inline-flex; align-items:center; position:relative;
        transform:translateX(-50%) translateY(-20px);
        cursor:pointer;
        padding:2px 12px 2px 4px;
        border-radius:999px;
        background-color:white;
        border:2px solid ${color};
        box-shadow:0 2px 7px rgba(0,0,0,0.2);
      "
    >
      <figure style="height:24px; width:0; overflow:hidden; transition:all 0.3s ease; margin:0;">
        <img
          style="height:24px; width:24px; object-fit:cover; border-radius:50%; pointer-events:none;"
          src="https://picsum.photos/id/103/300/300"
        />
      </figure>
      <p style="padding:0; margin:0; margin-left:12px; font-size:12px; font-weight:700; pointer-events:none; white-space:nowrap;">
        ${cafe.name}
      </p>
      <div style="position:absolute; left:50%; bottom:-1px; transform:translateX(-50%) translateY(50%); pointer-events:none;">
        <div style="border-radius:0 0 3px 0; width:8px; height:8px; transform:rotate(45deg); background-color:white; border-right:2px solid ${color}; border-bottom:2px solid ${color};"></div>
      </div>
    </div>
  `;
}

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
  onBoundsChange,
}: MapCanvasProps) {
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markers = useRef<Map<string, naver.maps.Marker>>(new Map());
  const initialized = useRef(false);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermission>("checking");
  const isLocationEnabled = locationPermission === "granted";

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
  }, [locationPermission]);

  useEffect(() => {
    function initMap() {
      if (initialized.current) return;
      initialized.current = true;

      const defaultCenter = new naver.maps.LatLng(37.5005, 127.038);
      mapInstance.current = new naver.maps.Map("naver-map", {
        center: defaultCenter,
        zoom: 15,
        minZoom: 12,
        maxZoom: 19,
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            mapInstance.current?.setCenter(
              new naver.maps.LatLng(coords.latitude, coords.longitude),
            );
            mapInstance.current?.setZoom(16);
          },
          () => {}, // 위치 거절 시 기본 중심 유지
          { enableHighAccuracy: false, maximumAge: 60_000, timeout: 5_000 },
        );
      }

      naver.maps.Event.addListener(mapInstance.current, "idle", () => {
        const b = (
          mapInstance.current as unknown as {
            getBounds(): naver.maps.LatLngBounds;
          }
        ).getBounds();
        onBoundsChange?.({ ne: b.getNE(), sw: b.getSW() });
      });

      cafes.forEach((cafe) => {
        if (cafe.lat == null || cafe.lng == null) return;

        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(cafe.lat, cafe.lng),
          map: mapInstance.current!,
          icon: {
            content: pinHtml(cafe, false),
            anchor: new naver.maps.Point(0, 14),
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
        anchor: new naver.maps.Point(0, 14),
      });
    });
  }, [selectedId, cafes]);

  return (
    <>
      <div id="naver-map" className="absolute inset-0 w-full h-full" />
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
          ? "bg-main text-white border-accent"
          : "bg-bg text-fg-2 border-border-subtle"
      }`}
    >
      <KGIcon name={icon} size={16} stroke={2} />
    </button>
  );
}
