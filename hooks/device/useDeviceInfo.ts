"use client";

import { useSyncExternalStore } from "react";

export type DeviceInfo = {
  /** SSR/초기 렌더 가드. false면 아직 감지 전 */
  isReady: boolean;
  isMobile: boolean;
  isIos: boolean;
  isAndroid: boolean;
  /** 홈 화면에서 실행한 PWA 모드 */
  isStandalonePwa: boolean;
  /** iOS Safari/Chrome 등의 브라우저 탭(=PWA 미설치). 웹 푸시 미지원 */
  isIosBrowser: boolean;
};

const INITIAL: DeviceInfo = {
  isReady: false,
  isMobile: false,
  isIos: false,
  isAndroid: false,
  isStandalonePwa: false,
  isIosBrowser: false,
};

let cachedSnapshot: DeviceInfo | null = null;

function readDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return INITIAL;
  }

  if (cachedSnapshot) return cachedSnapshot;

  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIos || isAndroid || /Mobile/i.test(ua);
  const isStandalonePwa =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;

  cachedSnapshot = {
    isReady: true,
    isMobile,
    isIos,
    isAndroid,
    isStandalonePwa,
    isIosBrowser: isIos && !isStandalonePwa,
  };
  return cachedSnapshot;
}

function getServerSnapshot(): DeviceInfo {
  return INITIAL;
}

function subscribe(): () => void {
  return () => {};
}

export function useDeviceInfo(): DeviceInfo {
  return useSyncExternalStore(subscribe, readDeviceInfo, getServerSnapshot);
}
