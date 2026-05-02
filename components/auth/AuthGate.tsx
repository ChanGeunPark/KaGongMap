"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import KaGongButton from "@/components/button/KaGongButton";
import KGIcon from "@/components/ui/KGIcon";
import { useAuthGateStore } from "@/stores/modalStore";

export default function AuthGate() {
  const { showAuthGate, message, closeAuthGate } = useAuthGateStore();

  useEffect(() => {
    if (!showAuthGate) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAuthGate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeAuthGate, showAuthGate]);

  const handleLogin = () => {
    void signIn("kakao", { callbackUrl: "/" });
  };

  return (
    <AnimatePresence>
      {showAuthGate && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center px-5 py-6">
          <motion.button
            type="button"
            aria-label="로그인 안내 닫기"
            className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
            onClick={closeAuthGate}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-gate-title"
            aria-describedby="auth-gate-description"
            className="relative w-full max-w-[420px] overflow-hidden rounded-lg border border-border-subtle bg-bg shadow-overlay"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <button
              type="button"
              aria-label="닫기"
              className="absolute right-4 top-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg bg-gray-100 text-fg-3 transition-colors hover:bg-gray-200 hover:text-fg"
              onClick={closeAuthGate}
            >
              <KGIcon name="close" size={17} stroke={2} />
            </button>

            <div className="border-b border-border-subtle bg-bg-muted px-6 pb-5 pt-6">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-main-light text-main-deep">
                <KGIcon name="bookmark" size={24} stroke={1.9} />
              </div>
              <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-fg-4">
                KagongMap
              </p>
              <h2
                id="auth-gate-title"
                className="text-[21px] font-bold leading-tight tracking-[-0.3px] text-fg"
              >
                로그인이 필요해요
              </h2>
              <p
                id="auth-gate-description"
                className="mt-2 pr-6 text-[14px] leading-6 text-fg-3"
              >
                {message ?? "로그인 후 사용할 수 있는 기능이에요."}
              </p>
            </div>

            <div className="px-6 pb-6 pt-5">
              <div className="mb-5 rounded-lg border border-border-subtle bg-bg-muted px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-kg-amber-light text-kg-amber-deep">
                    <KGIcon name="sparkle" size={15} stroke={2} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-fg-2">
                      참여 기능은 로그인 후 바로 이어서 사용할 수 있어요.
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-fg-3">
                      즐겨찾기, 후기 작성, 카페 정보 제안이 내 계정에 안전하게
                      저장됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <KaGongButton
                  buttonStyle="OUTLINED"
                  buttonSize="MEDIUM"
                  className="!w-full sm:!w-fit"
                  onClick={closeAuthGate}
                >
                  나중에
                </KaGongButton>
                <KaGongButton
                  buttonStyle="PRIMARY"
                  buttonSize="MEDIUM"
                  className="!w-full sm:!w-fit"
                  icon={<KGIcon name="arrow" size={16} stroke={2} />}
                  onClick={handleLogin}
                >
                  카카오로 로그인
                </KaGongButton>
              </div>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
