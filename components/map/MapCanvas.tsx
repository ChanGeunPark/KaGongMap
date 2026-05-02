"use client";

import { CafeMarker } from "@/types/db";
import { useEffect, useRef, useState } from "react";
import { CafeMarkerClusterer } from "./CafeMarkerClusterer";
import { cafePinHtml, userPinHtml } from "./markerIcons";
import { TRANSITION, USER_MARKER_SIZE } from "./mapConfig";
import {
  MapWithBounds,
  MapWithMorph,
  MarkerWithMutableMeta,
} from "@/types/naverMap";
import { MapControls } from "./MapControls";
import { useMapGeolocation } from "@/hooks/useMapGeolocation";

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
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markers = useRef<Map<string, naver.maps.Marker>>(new Map());
  const clusterer = useRef<CafeMarkerClusterer | null>(null);
  const userMarker = useRef<naver.maps.Marker | null>(null);
  const userCircle = useRef<naver.maps.Circle | null>(null);
  const initialized = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const {
    isLocationEnabled,
    locationPermission,
    moveToCurrentLocation,
    setUserLocation,
    userLocation,
  } = useMapGeolocation(mapInstance);

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
          content: cafePinHtml(cafe, false),
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
        content: cafePinHtml(cafe, id === selectedId || id === hoveredId),
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
      <MapControls
        isLocationEnabled={isLocationEnabled}
        locationTitle={
          locationPermission === "denied"
            ? "위치 권한이 꺼져 있습니다"
            : "현재 위치로 이동"
        }
        onZoomIn={() => {
          const map = mapInstance.current as MapWithMorph | null;
          if (!map) return;
          map.morph(map.getCenter(), map.getZoom() + 1, TRANSITION);
        }}
        onZoomOut={() => {
          const map = mapInstance.current as MapWithMorph | null;
          if (!map) return;
          map.morph(map.getCenter(), map.getZoom() - 1, TRANSITION);
        }}
        onLocate={moveToCurrentLocation}
      />
    </>
  );
}
