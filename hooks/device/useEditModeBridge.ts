"use client";

import { useCallback, useEffect, useState } from "react";

// 부모 프레임(에디터)과의 postMessage 브릿지.
// - tweaksOn: 부모가 활성화/비활성화 메시지를 보내면 토글된다.
// - postTweakEdit: 키/값 변경을 부모에 통지한다.
export function useEditModeBridge() {
  const [tweaksOn, setTweaksOn] = useState(false);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === "__activate_edit_mode") setTweaksOn(true);
      if (e.data.type === "__deactivate_edit_mode") setTweaksOn(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const postTweakEdit = useCallback((key: string, value: string) => {
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { [key]: value } },
      "*",
    );
  }, []);

  return { tweaksOn, postTweakEdit };
}
