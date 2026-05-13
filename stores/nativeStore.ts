import { create } from "zustand";
import type { NativeLocationPermissionStatus } from "@/lib/native/messages";

export interface NativeUserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

interface NativeStoreState {
  isWebView: boolean;
  fcmToken: string | null;
  /** WebView 환경에서 Flutter가 회신한 위치 권한 상태. 브라우저에서는 항상 null */
  nativeLocationPermission: NativeLocationPermissionStatus | null;
  /** WebView 환경에서 Flutter가 푸시한 최신 좌표. 브라우저에서는 항상 null */
  nativeLocation: NativeUserLocation | null;
  setIsWebView: (isWebView: boolean) => void;
  setFcmToken: (fcmToken: string) => void;
  setNativeLocationPermission: (
    status: NativeLocationPermissionStatus | null,
  ) => void;
  setNativeLocation: (location: NativeUserLocation | null) => void;
}

export const useNativeStore = create<NativeStoreState>((set) => ({
  isWebView: false,
  fcmToken: null,
  nativeLocationPermission: null,
  nativeLocation: null,
  setIsWebView: (isWebView) => set({ isWebView }),
  setFcmToken: (fcmToken) => set({ fcmToken }),
  setNativeLocationPermission: (nativeLocationPermission) =>
    set({ nativeLocationPermission }),
  setNativeLocation: (nativeLocation) => set({ nativeLocation }),
}));
