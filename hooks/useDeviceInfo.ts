"use client";

import { useEffect, useState } from "react";

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

export function useDeviceInfo(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(INITIAL);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIos || isAndroid || /Mobile/i.test(ua);
    const isStandalonePwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    setInfo({
      isReady: true,
      isMobile,
      isIos,
      isAndroid,
      isStandalonePwa,
      isIosBrowser: isIos && !isStandalonePwa,
    });
  }, []);

  return info;
}
