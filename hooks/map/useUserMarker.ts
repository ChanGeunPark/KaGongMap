import { RefObject, useEffect, useRef } from "react";
import { USER_MARKER_SIZE } from "@/components/map/mapConfig";
import {
  USER_MARKER_HEADING_ID,
  userPinHtml,
} from "@/components/map/markerIcons";
import type { UserLocation } from "@/hooks/geolocation/useMapGeolocation";

const ACCURACY_CIRCLE_STYLE = {
  fillColor: "#3772cf",
  fillOpacity: 0.1,
  strokeColor: "#3772cf",
  strokeOpacity: 0.35,
  strokeWeight: 1,
} as const;

interface UseUserMarkerOptions {
  mapRef: RefObject<naver.maps.Map | null>;
  /** `useNaverMap` 의 ready — Map 인스턴스가 생성된 후에만 마커를 만든다. */
  ready: boolean;
  userLocation: UserLocation | null;
  /** 진북 기준 시계방향 0~360. null 이면 방향 표시 비활성 */
  heading: number | null;
}

/**
 * 누적 회전값을 ref 로 유지해 CSS transition 의 wrap-around 비주얼 버그를 회피.
 *
 * 0~360 으로 normalize 된 값을 그대로 rotate() 에 박으면, 358° → 2° 같은 정상
 * 시계방향 변화가 CSS 입장에서는 -356° (반시계 한 바퀴) 로 해석되어 마커가
 * 빙글 돈다. 대신 직전 적용 회전값에서 **최단 각거리(shortest signed delta)**
 * 를 더해 누적시키면, CSS 는 항상 짧은 쪽으로 도는 자연스러운 애니메이션이 됨.
 */
function applyHeading(
  heading: number | null,
  rotationRef: { current: number },
) {
  const el = document.getElementById(USER_MARKER_HEADING_ID);
  if (!el) return;
  if (heading == null) {
    el.style.display = "none";
    return;
  }
  el.style.display = "";
  const current = rotationRef.current;
  const targetMod = ((heading % 360) + 360) % 360;
  const currentMod = ((current % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  rotationRef.current = current + delta;
  el.style.transform = `translate(-50%, -50%) rotate(${rotationRef.current}deg)`;
}

export function useUserMarker({
  mapRef,
  ready,
  userLocation,
  heading,
}: UseUserMarkerOptions) {
  const markerRef = useRef<naver.maps.Marker | null>(null);
  const circleRef = useRef<naver.maps.Circle | null>(null);
  // CSS rotate() 에 박는 누적 회전값. 0~360 으로 묶지 않아 CSS transition 이
  // 항상 최단 경로로 돌게 한다. 마커 재생성 시 0 으로 reset.
  const appliedRotationRef = useRef(0);

  useEffect(() => {
    if (!ready || !mapRef.current || !userLocation) return;

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
          content: userPinHtml(heading),
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
  }, [ready, userLocation, mapRef, heading]);

  // 부모 Map 인스턴스가 사라질 때(라우트 떠날 때 useNaverMap 이 ready=false 로 reset)
  // 이전 마커/원 ref 를 비워, 다음 라우트 진입 시 새 Map 위에 깨끗하게 다시 생성되게 함.
  useEffect(() => {
    if (ready) return;
    markerRef.current?.setMap(null);
    markerRef.current = null;
    circleRef.current?.setMap(null);
    circleRef.current = null;
    // 마커 DOM 이 사라졌으니 누적 회전도 0 으로 reset.
    appliedRotationRef.current = 0;
  }, [ready]);

  // heading 변경 시 마커 재생성 없이 DOM transform 만 갱신.
  // 마커가 아직 mount 전이면 다음 tick 에 한 번 더 시도.
  useEffect(() => {
    if (!markerRef.current) return;
    applyHeading(heading, appliedRotationRef);
    const raf = requestAnimationFrame(() =>
      applyHeading(heading, appliedRotationRef),
    );
    return () => cancelAnimationFrame(raf);
  }, [heading, userLocation]);
}
