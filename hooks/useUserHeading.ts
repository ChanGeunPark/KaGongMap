import { useEffect } from "react";
import { create } from "zustand";
import { nativeBridge } from "@/lib/native/bridge";
import { useNativeStore } from "@/stores/nativeStore";

interface HeadingStore {
  heading: number | null;
  set: (heading: number | null) => void;
}

const useHeadingStore = create<HeadingStore>((set) => ({
  heading: null,
  set: (heading) => set({ heading }),
}));

const HEADING_THRESHOLD_DEG = 2;

function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360;
}

function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * heading 갱신 게이트. 2° 미만 변화는 무시 → 마커 회전 DOM 비용 감소.
 * 외부(NativeBridgeInit, deviceorientation 핸들러) 모두 이 함수 사용.
 */
export function pushHeading(rawHeading: number | null) {
  if (rawHeading == null || Number.isNaN(rawHeading)) {
    useHeadingStore.getState().set(null);
    return;
  }
  const next = normalizeHeading(rawHeading);
  const prev = useHeadingStore.getState().heading;
  if (prev != null && angularDistance(prev, next) < HEADING_THRESHOLD_DEG) {
    return;
  }
  useHeadingStore.getState().set(next);
}

interface DeviceOrientationEventWithCompass extends DeviceOrientationEvent {
  /** iOS Safari */
  webkitCompassHeading?: number;
}

/**
 * 사용자 디바이스의 방위각(0~360, 진북 기준 시계방향)을 구독한다.
 *
 * - WebView: `START_HEADING_UPDATES` 송신 → Flutter(`flutter_compass`)가
 *   `HEADING_UPDATE` push. cleanup 시 STOP 송신 → 센서 OFF.
 * - 브라우저: `deviceorientationabsolute` + `webkitCompassHeading` 시도.
 *   iOS Safari 의 `DeviceOrientationEvent.requestPermission()` 호출은
 *   사용자 제스처 컨텍스트가 필요해 별도 UI 에서 처리 (현재 미구현).
 *
 * @param enabled false 면 구독을 즉시 종료하고 null 반환
 */
export function useUserHeading(enabled: boolean): number | null {
  const isWebView = useNativeStore((s) => s.isWebView);
  const heading = useHeadingStore((s) => s.heading);

  useEffect(() => {
    if (!enabled) return;

    if (isWebView) {
      const sent = nativeBridge.send({ type: "START_HEADING_UPDATES" });
      if (!sent) return;
      return () => {
        nativeBridge.send({ type: "STOP_HEADING_UPDATES" });
        pushHeading(null);
      };
    }

    if (typeof window === "undefined") return;

    const handler = (event: DeviceOrientationEventWithCompass) => {
      // iOS Safari — 진북 기준 시계방향
      if (typeof event.webkitCompassHeading === "number") {
        pushHeading(event.webkitCompassHeading);
        return;
      }
      // 그 외 — alpha 는 z축 회전. absolute=true (또는 deviceorientationabsolute) 일 때만 진북 기준
      if (!event.absolute) return;
      if (typeof event.alpha !== "number") return;
      // alpha 는 반시계 방향 → 시계 방향으로 보정
      pushHeading(360 - event.alpha);
    };

    window.addEventListener(
      "deviceorientationabsolute",
      handler as EventListener,
      true,
    );
    window.addEventListener(
      "deviceorientation",
      handler as EventListener,
      true,
    );
    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handler as EventListener,
        true,
      );
      window.removeEventListener(
        "deviceorientation",
        handler as EventListener,
        true,
      );
      pushHeading(null);
    };
  }, [enabled, isWebView]);

  return heading;
}
