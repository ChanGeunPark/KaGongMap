"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { track } from "@/lib/firebase/analytics";

function getSafeCallbackUrl(): string {
  if (typeof window === "undefined") return "/";

  const callbackUrl = new URLSearchParams(window.location.search).get(
    "callbackUrl",
  );

  if (
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  ) {
    return callbackUrl;
  }

  return "/";
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900">카공맵 로그인</h1>
      <p className="mt-2 text-sm text-gray-600">
        카카오 로그인을 먼저 지원합니다.
      </p>

      {isLoading && (
        <div className="mt-8 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm text-gray-600">
          로그인 상태를 확인하고 있어요...
        </div>
      )}

      {!isLoading && !isAuthenticated && (
        <>
          <button
            type="button"
            onClick={() => {
              track("login_attempt", { provider: "kakao" });
              signIn("kakao", { callbackUrl: getSafeCallbackUrl() });
            }}
            className="mt-8 w-full rounded-lg bg-yellow-300 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-400"
          >
            카카오로 시작하기
          </button>

          <button
            type="button"
            onClick={() => {
              track("login_attempt", { provider: "google" });
              signIn("google", { callbackUrl: "/" });
            }}
            className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            구글 로그인
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-gray-500">
            로그인하면 카공맵의{" "}
            <Link
              href="/privacy"
              className="font-medium text-gray-700 underline"
            >
              개인정보 처리방침
            </Link>
            을 확인한 것으로 간주됩니다.
          </p>
        </>
      )}

      {!isLoading && isAuthenticated && (
        <div className="mt-8 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p className="font-medium">로그인 완료</p>
          <p className="mt-1 break-all text-emerald-700">
            {session.user?.email ?? "카카오 계정으로 로그인됨"}
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/"
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-center font-semibold text-white transition hover:bg-emerald-700"
            >
              홈으로 이동
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-1 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-center font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
