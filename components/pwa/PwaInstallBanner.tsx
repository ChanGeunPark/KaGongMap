"use client";

import { useEffect, useState } from "react";
import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallBanner() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
  };

  if (!installEvent) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle bg-bg shadow-card">
      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-main-light/80 via-main-light/25 to-transparent"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-main/15 p-1.5 text-main-deep ring-1 ring-main/20">
              <KGIcon name="download" size={19} stroke={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-btn font-semibold tracking-[-0.2px] text-fg">
                홈 화면에 카공맵 추가
              </p>
              <p className="mt-1 text-[13px] leading-5 text-fg-3">
                앱처럼 빠르게 열고, 오프라인에서도 기본 화면을 볼 수 있어요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className={cls(
              "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
              "text-caption font-semibold tracking-[-0.1px] text-white",
              "bg-main-deep shadow-button transition-[transform,box-shadow,background-color]",
              "hover:bg-main active:scale-[0.98]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main",
            )}
          >
            앱으로 설치하기
            <KGIcon name="arrow" size={16} stroke={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}
