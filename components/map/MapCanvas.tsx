"use client";

import { CafeMarker } from "@/types/db";
import { useCallback, useEffect, useRef, useState } from "react";
import KGIcon from "../ui/KGIcon";
import { toast } from "react-toastify";
import { cls } from "@/lib/utils";
import { TbBookmarkFilled } from "react-icons/tb";
import { useAuthGateStore, useBookmarkModalStore } from "@/stores/modalStore";
import { useSession } from "next-auth/react";

const MAX_VISIBLE_CAFE_MARKERS = 30;
const MARKER_CLUSTER_MAX_ZOOM = 16;
const MARKER_CLUSTER_GRID_SIZE = 96;
const USER_MARKER_SIZE = 48;

// 태그 개수 기준: 7+ 우수(녹색), 4+ 양호(앰버), 그 외(레드)
function scoreColor(tagCount: number) {
  if (tagCount >= 7) return "#22c55e";
  if (tagCount >= 4) return "#f5a524";
  return "#ef4444";
}

// naver.maps 타입 정의에 빠진 애니메이션 메서드 보강
type MapWithMorph = naver.maps.Map & {
  morph(
    latlng: naver.maps.Coord,
    zoom?: number,
    options?: { duration: number; easing?: string },
  ): void;
  getMaxZoom(): number;
};
const TRANSITION = { duration: 100, easing: "easeOutCubic" };

type MapWithBounds = naver.maps.Map & {
  getBounds(): naver.maps.LatLngBounds;
  getProjection(): naver.maps.MapSystemProjection;
};

type EventWithRemove = typeof naver.maps.Event & {
  removeListener(listener: naver.maps.MapEventListener): void;
};

type ClusterIcon = {
  content: string;
  anchor: naver.maps.Point;
};

type Cluster = {
  center: naver.maps.LatLng;
  bounds: naver.maps.LatLngBounds;
  markers: naver.maps.Marker[];
};

type ProjectedPoint = naver.maps.Point & {
  x: number;
  y: number;
};

type MarkerWithMutableMeta = naver.maps.Marker & {
  setPosition(position: naver.maps.Coord | naver.maps.CoordLiteral): void;
  setTitle(title: string): void;
};

function userPinHtml() {
  return `
    <div class="kg-user-marker" aria-hidden="true">
      <div class="kg-user-marker__pulse"></div>
      <img
        class="kg-user-marker__cat"
        src="/images/marks/markDefaultCat.png"
        alt=""
      />
    </div>
  `;
}

function clusterHtml(count: number) {
  const size = count >= 20 ? 56 : count >= 10 ? 50 : 44;
  const bg = count >= 20 ? "#166534" : count >= 10 ? "#0f766e" : "#16a34a";
  return `
    <div
      style="
        width:${size}px; height:${size}px; border-radius:999px;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer;
        color:white; font-size:13px; font-weight:800;
        background:${bg};
        border:3px solid rgba(255,255,255,0.92);
        box-shadow:0 8px 20px rgba(15,23,42,0.25);
      "
    >
      ${count}
    </div>
  `;
}

function clusterIcon(count: number): ClusterIcon {
  const size = count >= 20 ? 56 : count >= 10 ? 50 : 44;
  return {
    content: clusterHtml(count),
    anchor: new naver.maps.Point(size / 2, size / 2),
  };
}

function pinHtml(cafe: CafeMarker, active: boolean) {
  const color = scoreColor(cafe.tags.length);
  const borderWidth = active ? 3 : 2;
  const shadow = active
    ? "0 6px 16px rgba(0,0,0,0.28)"
    : "0 2px 7px rgba(0,0,0,0.2)";
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
        border:${borderWidth}px solid ${color};
        box-shadow:${shadow};
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
      <div style="position:absolute; left:50%; bottom:-${borderWidth - 1}px; transform:translateX(-50%) translateY(50%); pointer-events:none;">
        <div style="border-radius:0 0 3px 0; width:8px; height:8px; transform:rotate(45deg); background-color:white; border-right:${borderWidth}px solid ${color}; border-bottom:${borderWidth}px solid ${color};"></div>
      </div>
    </div>
  `;
}

class CafeMarkerClusterer {
  private map: MapWithBounds;
  private markers: naver.maps.Marker[] = [];
  private clusterMarkers: naver.maps.Marker[] = [];
  private idleListener: naver.maps.MapEventListener | null = null;

  constructor(map: naver.maps.Map) {
    this.map = map as MapWithBounds;
    this.idleListener = naver.maps.Event.addListener(map, "idle", () => {
      this.redraw();
    });
  }

  setMarkers(markers: naver.maps.Marker[]) {
    this.markers = markers;
    this.redraw();
  }

  redraw() {
    this.clearClusterMarkers();

    const map = this.map;
    const bounds = map.getBounds();
    const visibleMarkers = this.markers.filter((marker) =>
      bounds.hasLatLng(marker.getPosition()),
    );
    const hiddenMarkers = this.markers.filter(
      (marker) => !bounds.hasLatLng(marker.getPosition()),
    );

    hiddenMarkers.forEach((marker) => marker.setMap(null));

    if (map.getZoom() >= MARKER_CLUSTER_MAX_ZOOM) {
      this.showLimitedMarkers(visibleMarkers);
      return;
    }

    const clusters = this.createClusters(visibleMarkers);
    let shownCafeMarkers = 0;

    clusters.forEach((cluster) => {
      if (cluster.markers.length < 2) {
        if (shownCafeMarkers < MAX_VISIBLE_CAFE_MARKERS) {
          cluster.markers[0]?.setMap(map);
          shownCafeMarkers += 1;
        } else {
          cluster.markers[0]?.setMap(null);
        }
        return;
      }

      cluster.markers.forEach((marker) => marker.setMap(null));
      this.addClusterMarker(cluster);
    });
  }

  destroy() {
    this.clearClusterMarkers();
    this.markers.forEach((marker) => marker.setMap(null));
    if (this.idleListener) {
      (naver.maps.Event as EventWithRemove).removeListener(this.idleListener);
      this.idleListener = null;
    }
  }

  private createClusters(markers: naver.maps.Marker[]) {
    const clusters: Cluster[] = [];

    markers.forEach((marker) => {
      const position = marker.getPosition() as naver.maps.LatLng;
      let closestIndex = -1;
      let closestDistance = Infinity;

      for (let index = 0; index < clusters.length; index += 1) {
        const cluster = clusters[index];
        if (!cluster) continue;
        if (!cluster.bounds.hasLatLng(position)) continue;

        const distance = this.map
          .getProjection()
          .getDistance(cluster.center, position);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      }

      if (closestIndex >= 0) {
        clusters[closestIndex]?.markers.push(marker);
        return;
      }

      clusters.push({
        center: position,
        bounds: this.createClusterBounds(position),
        markers: [marker],
      });
    });

    return clusters;
  }

  private createClusterBounds(position: naver.maps.LatLng) {
    const projection = this.map.getProjection();
    const point = projection.fromCoordToOffset(position) as ProjectedPoint;
    const halfGrid = MARKER_CLUSTER_GRID_SIZE / 2;
    const sw = projection.fromOffsetToCoord(
      new naver.maps.Point(point.x - halfGrid, point.y + halfGrid),
    ) as naver.maps.LatLng;
    const ne = projection.fromOffsetToCoord(
      new naver.maps.Point(point.x + halfGrid, point.y - halfGrid),
    ) as naver.maps.LatLng;

    return new naver.maps.LatLngBounds(sw, ne);
  }

  private addClusterMarker(cluster: Cluster) {
    const marker = new naver.maps.Marker({
      position: cluster.center,
      map: this.map,
      icon: clusterIcon(cluster.markers.length),
      title: `${cluster.markers.length}개 카페`,
    });

    naver.maps.Event.addListener(marker, "click", () => {
      const map = this.map as unknown as MapWithMorph;
      map.morph(cluster.center, Math.min(map.getZoom() + 1, map.getMaxZoom()), {
        duration: 250,
        easing: "easeOutCubic",
      });
    });

    this.clusterMarkers.push(marker);
  }

  private showLimitedMarkers(markers: naver.maps.Marker[]) {
    markers.forEach((marker, index) => {
      marker.setMap(index < MAX_VISIBLE_CAFE_MARKERS ? this.map : null);
    });
  }

  private clearClusterMarkers() {
    this.clusterMarkers.forEach((marker) => marker.setMap(null));
    this.clusterMarkers = [];
  }
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
  hoveredId,
  onSelect,
  onHover,
  onBoundsChange,
}: MapCanvasProps) {
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markers = useRef<Map<string, naver.maps.Marker>>(new Map());
  const clusterer = useRef<CafeMarkerClusterer | null>(null);
  const userMarker = useRef<naver.maps.Marker | null>(null);
  const userCircle = useRef<naver.maps.Circle | null>(null);
  const initialized = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermission>("checking");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
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

  // 권한 허용 시 위치를 실시간으로 추적해 마커만 갱신 (카메라는 그대로)
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
      () => {}, // 단발 실패는 무시 — 다음 틱에 복구되면 됨
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
        (mapInstance.current as MapWithMorph | null)?.morph(
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
        logoControl: true,
        logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        mapDataControl: true,
        mapDataControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        scaleControl: true,
        scaleControlOptions: { position: naver.maps.Position.BOTTOM_RIGHT },
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            setUserLocation({
              lat: coords.latitude,
              lng: coords.longitude,
              accuracy: coords.accuracy,
            });
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
        const b = (mapInstance.current as MapWithBounds).getBounds();
        onBoundsChange?.({ ne: b.getNE(), sw: b.getSW() });
      });

      clusterer.current = new CafeMarkerClusterer(mapInstance.current);
      setMapReady(true);
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    const markerStore = markers.current;

    if (
      typeof window !== "undefined" &&
      (window as Window & { naver?: typeof naver }).naver?.maps
    ) {
      initMap();
    } else {
      interval = setInterval(() => {
        if ((window as Window & { naver?: typeof naver }).naver?.maps) {
          if (interval) clearInterval(interval);
          interval = null;
          initMap();
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
      clusterer.current?.destroy();
      clusterer.current = null;
      markerStore.clear();
      initialized.current = false;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady || !clusterer.current) return;

    const nextCafeIds = new Set(cafes.map((cafe) => cafe.id));

    markers.current.forEach((marker, id) => {
      if (nextCafeIds.has(id)) return;
      marker.setMap(null);
      markers.current.delete(id);
    });

    cafes.forEach((cafe) => {
      if (cafe.lat == null || cafe.lng == null) return;

      const marker = markers.current.get(cafe.id);
      if (marker) {
        const mutableMarker = marker as MarkerWithMutableMeta;
        mutableMarker.setPosition(new naver.maps.LatLng(cafe.lat, cafe.lng));
        mutableMarker.setTitle(cafe.name);
        return;
      }

      const nextMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cafe.lat, cafe.lng),
        map: null,
        icon: {
          content: pinHtml(cafe, false),
          anchor: new naver.maps.Point(0, 14),
        },
        title: cafe.name,
      });

      naver.maps.Event.addListener(nextMarker, "click", () =>
        onSelect(cafe.id),
      );
      naver.maps.Event.addListener(nextMarker, "mouseover", () =>
        onHover(cafe.id),
      );
      naver.maps.Event.addListener(nextMarker, "mouseout", () => onHover(null));
      markers.current.set(cafe.id, nextMarker);
    });

    const orderedMarkers = cafes
      .map((cafe) => markers.current.get(cafe.id))
      .filter((marker): marker is naver.maps.Marker => Boolean(marker));

    clusterer.current.setMarkers(orderedMarkers);
  }, [mapReady, cafes, onHover, onSelect]);

  useEffect(() => {
    if (!mapReady || !clusterer.current) return;
    markers.current.forEach((marker, id) => {
      const cafe = cafes.find((c) => c.id === id);
      if (!cafe) return;
      marker.setIcon({
        content: pinHtml(cafe, id === selectedId || id === hoveredId),
        anchor: new naver.maps.Point(0, 14),
      });
    });
    const orderedMarkers = cafes
      .map((cafe) => markers.current.get(cafe.id))
      .filter((marker): marker is naver.maps.Marker => Boolean(marker))
      .sort((a, b) => {
        const aId = [...markers.current.entries()].find(
          ([, marker]) => marker === a,
        )?.[0];
        const bId = [...markers.current.entries()].find(
          ([, marker]) => marker === b,
        )?.[0];
        const aActive = aId === selectedId || aId === hoveredId;
        const bActive = bId === selectedId || bId === hoveredId;
        if (aActive === bActive) return 0;
        return aActive ? -1 : 1;
      });

    clusterer.current.setMarkers(orderedMarkers);
  }, [mapReady, selectedId, hoveredId, cafes]);

  // 선택된 카페로 카메라 부드럽게 이동 (지도 밖에서 검색 선택 시에도 동작)
  useEffect(() => {
    if (!initialized.current || !mapInstance.current || !selectedId) return;
    const cafe = cafes.find((c) => c.id === selectedId);
    if (!cafe || cafe.lat == null || cafe.lng == null) return;

    const map = mapInstance.current as MapWithMorph;
    map.morph(
      new naver.maps.LatLng(cafe.lat, cafe.lng),
      Math.max(map.getZoom(), 16),
      {
        duration: 500,
        easing: "easeOutCubic",
      },
    );
  }, [selectedId, cafes]);

  useEffect(() => {
    if (!initialized.current || !mapInstance.current || !userLocation) return;

    const position = new naver.maps.LatLng(userLocation.lat, userLocation.lng);

    if (userMarker.current) {
      (
        userMarker.current as unknown as {
          setPosition(p: naver.maps.LatLng): void;
        }
      ).setPosition(position);
    } else {
      userMarker.current = new naver.maps.Marker({
        position,
        map: mapInstance.current,
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

    if (userCircle.current) {
      userCircle.current.setCenter(position);
      userCircle.current.setRadius(userLocation.accuracy);
    } else {
      userCircle.current = new naver.maps.Circle({
        map: mapInstance.current,
        center: position,
        radius: userLocation.accuracy,
        fillColor: "#3772cf",
        fillOpacity: 0.1,
        strokeColor: "#3772cf",
        strokeOpacity: 0.35,
        strokeWeight: 1,
      });
    }
  }, [userLocation]);

  return (
    <>
      <div id="naver-map" className="absolute inset-0 w-full h-full" />
      {/* Zoom controls */}
      <div className="absolute top-5 right-5 flex flex-col gap-2 z-20">
        <MapCtrlBtn
          onClick={() => {
            const map = mapInstance.current as MapWithMorph | null;
            if (!map) return;
            map.morph(map.getCenter(), map.getZoom() + 1, TRANSITION);
          }}
          icon="plus"
        />
        <MapCtrlBtn
          onClick={() => {
            const map = mapInstance.current as MapWithMorph | null;
            if (!map) return;
            map.morph(map.getCenter(), map.getZoom() - 1, TRANSITION);
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
        <BookmarkButton />
      </div>
    </>
  );
}

function BookmarkButton() {
  const { setShowBookmarkModal } = useBookmarkModalStore();
  const { openAuthGate } = useAuthGateStore();
  // 로그인이 되어있는지 확인
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  return (
    <button
      type="button"
      onClick={() => {
        if (!isAuthed) {
          openAuthGate();
          return;
        }
        setShowBookmarkModal(true);
      }}
      className={cls(
        "size-8 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors",
        "bg-white border border-border-subtle text-fg-3 hover:bg-gray-100",
      )}
    >
      <TbBookmarkFilled size={20} />
    </button>
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
