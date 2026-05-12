"use client";

import { useEffect } from "react";
import { nativeBridge } from "@/lib/native/bridge";
import { useNativeStore } from "@/stores/nativeStore";
import { isWebView } from "@/lib/native/isWebView";

export default function NativeBridgeInit() {
  useEffect(() => {
    nativeBridge.init();

    const { setFcmToken, setIsWebView } = useNativeStore.getState();
    setIsWebView(isWebView());

    // 웹 마운트 완료를 Flutter 에 알려, 보류 중인 cold-start 메시지를
    // 흘릴 수 있도록 함. 외부(브라우저)에서는 send 가 false 를 반환하고 끝남.
    nativeBridge.send({ type: "READY" });

    const unsubscribers = [
      nativeBridge.on("FCM_TOKEN", (payload) => {
        setFcmToken(payload.token);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return null;
}
