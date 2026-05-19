import { RefObject } from "react";
import { useBrowserGeolocation } from "@/hooks/geolocation/useBrowserGeolocation";
import { useWebViewGeolocation } from "@/hooks/geolocation/useWebViewGeolocation";
import { useNativeStore, type NativeUserLocation } from "@/stores/nativeStore";

export type UserLocation = NativeUserLocation;

/**
 * 환경(브라우저 / Flutter WebView)을 가리는 facade.
 *
 * 두 환경의 추적 hook 을 **항상 모두 호출** 하되 (React hooks 규칙),
 * 활성 환경만 실제 listener/브릿지 송신을 수행한다. 비활성 환경은 noop.
 */
export function useMapGeolocation(mapRef: RefObject<naver.maps.Map | null>) {
  const isWebView = useNativeStore((s) => s.isWebView);
  const browser = useBrowserGeolocation(mapRef, !isWebView);
  const webview = useWebViewGeolocation(mapRef, isWebView);
  return isWebView ? webview : browser;
}
