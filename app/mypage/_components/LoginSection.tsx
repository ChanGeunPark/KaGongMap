"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginSection() {
  return (
    <div>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-main-deep">
        Sign in
      </p>
      <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.3px] text-fg">
        로그인
      </h2>
      <p className="mt-2 text-[13px] leading-6 text-fg-3">
        카공맵 계정으로 즐겨찾기, 후기 작성, 카페 제보 활동을 이어서 관리할 수
        있어요.
      </p>

      <button
        type="button"
        onClick={() => signIn("kakao", { callbackUrl: "/mypage" })}
        className="mt-5 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-main px-5 text-[14px] font-bold text-gray-900 transition-colors hover:bg-main-deep"
      >
        카카오로 로그인
      </button>

      <p className="mt-4 text-[12px] leading-5 text-fg-4">
        로그인하면 카공맵의{" "}
        <Link href="/privacy" className="font-semibold text-fg-2 underline">
          개인정보 처리방침
        </Link>
        에 동의한 것으로 간주됩니다.
      </p>
    </div>
  );
}
