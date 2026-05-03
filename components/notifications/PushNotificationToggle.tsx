"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  isFcmSupported,
  registerFcmToken,
  unregisterFcmToken,
} from "@/lib/firebase/fcm";
import { track } from "@/lib/firebase/analytics";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { cls } from "@/lib/utils";
import KGIcon from "@/components/ui/KGIcon";

const TOKEN_STORAGE_KEY = "kagongmap_fcm_token";

type Status = "loading" | "unsupported" | "ready";

export default function PushNotificationToggle() {
  const device = useDeviceInfo();
  const [status, setStatus] = useState<Status>("loading");
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isFcmSupported().then((ok) => {
      if (cancelled) return;
      if (!ok) {
        setStatus("unsupported");
        return;
      }
      setStatus("ready");
      setPermission(Notification.permission);
      setEnabled(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const token = await registerFcmToken();
      const nextPermission =
        typeof Notification !== "undefined" ? Notification.permission : null;
      setPermission(nextPermission);

      track("notification_permission", {
        result: nextPermission ?? "unknown",
        registered: !!token,
      });

      if (!token) {
        if (nextPermission === "denied") {
          toast.error(
            "브라우저에서 알림이 차단되어 있어요. 사이트 설정에서 허용해주세요.",
          );
        } else {
          toast.error("알림 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
        }
        return;
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setEnabled(true);
      toast.success("푸시 알림이 켜졌어요.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const ok = await unregisterFcmToken(stored);
        if (!ok) {
          toast.error("알림 해제에 실패했어요. 잠시 후 다시 시도해주세요.");
          return;
        }
      }
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setEnabled(false);
      toast.success("푸시 알림이 꺼졌어요.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || !device.isReady) return null;

  const unsupportedMessage = device.isIosBrowser
    ? "iOS는 홈 화면에 카공맵을 추가한 뒤 앱으로 열어야 알림을 받을 수 있어요."
    : "이 브라우저는 푸시 알림을 지원하지 않아요.";

  return (
    <section className="mt-4 rounded-2xl border border-border-subtle bg-bg p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-main-light text-main-deep">
          <KGIcon name="bell" size={20} stroke={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-fg">
            푸시 알림
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-fg-3">
            {status === "unsupported"
              ? unsupportedMessage
              : enabled
                ? "이 기기에서 푸시 알림을 받고 있어요."
                : "새 카페 승인, 후기 알림 등을 푸시로 받아보세요."}
          </p>
          {status === "ready" && permission === "denied" && !enabled && (
            <p className="mt-2 text-mono leading-5 text-red-500">
              브라우저에서 알림이 차단된 상태예요. 사이트 설정에서 허용해주세요.
            </p>
          )}
        </div>

        {status === "ready" && (
          <button
            type="button"
            onClick={enabled ? handleDisable : handleEnable}
            disabled={busy || (permission === "denied" && !enabled)}
            className={cls(
              "shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              enabled
                ? "bg-gray-100 text-fg-2 hover:bg-gray-200"
                : "bg-fg text-bg hover:opacity-90",
            )}
          >
            {busy ? "처리 중..." : enabled ? "끄기" : "켜기"}
          </button>
        )}
      </div>
    </section>
  );
}
