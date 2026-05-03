"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { listenForegroundMessages } from "@/lib/firebase/fcm";

export default function ForegroundFcmListener() {
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    listenForegroundMessages((payload) => {
      const title = payload.notification?.title ?? "새 알림";
      const body = payload.notification?.body ?? "";
      const link =
        (payload.data?.link as string | undefined) ??
        (payload.fcmOptions?.link as string | undefined);

      toast.info(
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-fg">{title}</p>
          {body && <p className="text-mono leading-5 text-fg-3">{body}</p>}
          {link && (
            <p className="text-mono font-semibold text-main-deep">
              눌러서 보러가기 →
            </p>
          )}
        </div>,
        {
          autoClose: 6000,
          onClick: link ? () => router.push(link) : undefined,
        },
      );
    }).then((unsub) => {
      if (cancelled) {
        unsub?.();
        return;
      }
      unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router]);

  return null;
}
