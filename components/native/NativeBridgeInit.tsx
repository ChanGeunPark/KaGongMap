"use client";

import { useEffect } from "react";
import { nativeBridge } from "@/lib/native/bridge";
import { useNativeStore } from "@/stores/nativeStore";
import { isWebView } from "@/lib/native/isWebView";
import { pushHeading } from "@/hooks/useUserHeading";

export default function NativeBridgeInit() {
  useEffect(() => {
    nativeBridge.init();

    const inWebView = isWebView();
    const {
      setFcmToken,
      setIsWebView,
      setNativeLocationPermission,
      setNativeLocation,
    } = useNativeStore.getState();
    setIsWebView(inWebView);

    // 웹 마운트 완료를 Flutter 에 알려, 보류 중인 cold-start 메시지를
    // 흘릴 수 있도록 함. 외부(브라우저)에서는 send 가 false 를 반환하고 끝남.
    nativeBridge.send({ type: "READY" });

    const unsubscribers = [
      nativeBridge.on("FCM_TOKEN", (payload) => {
        setFcmToken(payload.token);
      }),
      nativeBridge.on("LOCATION_PERMISSION_STATUS", (payload) => {
        setNativeLocationPermission(payload.status);
      }),
      // REQUEST_LOCATION 응답 — 권한 + (옵션) 1회 좌표
      nativeBridge.on("LOCATION_RESPONSE", (payload) => {
        setNativeLocationPermission(payload.status);
        if (payload.coords) {
          setNativeLocation({
            lat: payload.coords.lat,
            lng: payload.coords.lng,
            accuracy: payload.coords.accuracy ?? 0,
          });
        }
      }),
      // 실시간 좌표 — 동일 좌표 연속 수신 시 store update skip (불필요 re-render 방지)
      nativeBridge.on("LOCATION_UPDATE", (payload) => {
        const accuracy = payload.accuracy ?? 0;
        const prev = useNativeStore.getState().nativeLocation;
        if (
          prev &&
          prev.lat === payload.lat &&
          prev.lng === payload.lng &&
          prev.accuracy === accuracy
        ) {
          return;
        }
        setNativeLocation({
          lat: payload.lat,
          lng: payload.lng,
          accuracy,
        });
      }),
      // 컴퍼스 방위각 — 2° 미만 변화는 pushHeading 내부에서 skip
      nativeBridge.on("HEADING_UPDATE", (payload) => {
        pushHeading(payload.heading);
      }),
    ];

    // 부팅 직후 권한 상태만 조용히 조회 (다이얼로그 X)
    if (inWebView) {
      nativeBridge.send({ type: "CHECK_LOCATION_PERMISSION" });
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return null;
}
