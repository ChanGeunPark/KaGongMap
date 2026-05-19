import { useEffect } from "react";
import { create } from "zustand";
import {
  LocationPermission,
  watchLocationPermissionStatus,
} from "@/lib/locationPermission";
import { useNativeStore } from "@/stores/nativeStore";

interface BrowserPermissionStore {
  permission: LocationPermission;
  set: (permission: LocationPermission) => void;
}

const useBrowserPermissionStore = create<BrowserPermissionStore>((set) => ({
  permission: "checking",
  set: (permission) => set({ permission }),
}));

let browserWatcherStarted = false;

function ensureBrowserPermissionWatcher() {
  if (browserWatcherStarted) return;
  browserWatcherStarted = true;
  watchLocationPermissionStatus(({ status }) => {
    useBrowserPermissionStore.getState().set(status);
  });
}

/**
 * 브라우저 환경에서 권한 상태를 외부에서 강제 동기.
 * `getCurrentPosition` 성공/실패 직후 호출 — `navigator.permissions.query` 미지원 환경 대비.
 */
export function setBrowserLocationPermission(status: LocationPermission) {
  useBrowserPermissionStore.getState().set(status);
}

/**
 * 환경(브라우저 / Flutter WebView)을 가리지 않고 위치 권한 상태를 반환한다.
 *
 * - 브라우저: 모듈 단위 watcher (`navigator.permissions.query` 구독) — 단일 source
 * - WebView: `nativeStore.nativeLocationPermission` 구독
 *   (NativeBridgeInit 이 LOCATION_PERMISSION_STATUS / LOCATION_RESPONSE 응답을 박아둠)
 */
export function useLocationPermission(): LocationPermission {
  const isWebView = useNativeStore((s) => s.isWebView);
  const nativePermission = useNativeStore((s) => s.nativeLocationPermission);
  const browserPermission = useBrowserPermissionStore((s) => s.permission);

  useEffect(() => {
    if (!isWebView) ensureBrowserPermissionWatcher();
  }, [isWebView]);

  if (isWebView) return nativePermission ?? "checking";
  return browserPermission;
}
