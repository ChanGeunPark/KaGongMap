"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import KGIcon from "@/components/ui/KGIcon";

type Status = "checking" | "granted" | "prompt" | "denied" | "unsupported";

export default function LocationPermissionStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    if (!navigator.permissions?.query) {
      setStatus("prompt");
      return;
    }

    let permissionStatus: PermissionStatus | null = null;
    let cancelled = false;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((s) => {
        if (cancelled) return;
        permissionStatus = s;
        setStatus(s.state);
        s.onchange = () => setStatus(s.state);
      })
      .catch(() => {
        if (!cancelled) setStatus("prompt");
      });

    return () => {
      cancelled = true;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const requestPermission = () => {
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setStatus("granted");
        setBusy(false);
        toast.success("위치 권한이 허용되었어요.");
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setStatus(denied ? "denied" : "prompt");
        setBusy(false);
        if (denied) {
          toast.error(
            "권한이 거부되었어요. 브라우저 설정에서 직접 허용해주세요.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (status === "checking") return null;

  const isOn = status === "granted";

  return (
    <section className="mt-4 rounded-2xl border border-border-subtle bg-bg p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-main-light text-main-deep">
          <KGIcon name="pin" size={20} stroke={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-fg">
            위치 권한
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-fg-3">
            {status === "unsupported"
              ? "이 브라우저는 위치 서비스를 지원하지 않아요."
              : isOn
                ? "위치 권한이 허용되어 있어요. 내 주변 카페를 빠르게 찾을 수 있어요."
                : "지도에서 현재 위치를 보려면 권한 허용이 필요해요."}
          </p>
          {status === "denied" && (
            <p className="mt-2 text-mono leading-5 text-red-500">
              브라우저(또는 앱) 설정에서 위치 권한을 직접 허용해주세요.
            </p>
          )}
        </div>

        {isOn && (
          <span className="shrink-0 rounded-full bg-main-light px-3 py-1.5 text-[12.5px] font-semibold text-main-deep">
            허용됨
          </span>
        )}
        {status === "prompt" && (
          <button
            type="button"
            onClick={requestPermission}
            disabled={busy}
            className="shrink-0 rounded-full bg-fg px-4 py-2 text-[12.5px] font-semibold text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "요청 중..." : "켜기"}
          </button>
        )}
      </div>
    </section>
  );
}
