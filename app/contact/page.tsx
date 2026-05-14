"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import KGIcon from "@/components/ui/KGIcon";
import { useCreateContactInquiry } from "@/lib/api/contactInquiries";
import { cls } from "@/lib/utils";
import type { ContactInquiryCategory } from "@/types/db";

const CATEGORY_OPTIONS: {
  value: ContactInquiryCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "service",
    label: "서비스 이용",
    description: "사용법, 오류, 개선 의견",
  },
  {
    value: "report",
    label: "신고/콘텐츠",
    description: "카페 정보, 후기, 사진 관련",
  },
  {
    value: "account",
    label: "계정/탈퇴",
    description: "로그인, 계정 삭제, 활동 내역",
  },
  {
    value: "privacy",
    label: "개인정보",
    description: "개인정보 열람, 정정, 삭제 요청",
  },
  {
    value: "other",
    label: "기타",
    description: "그 외 문의",
  },
];

const CONTENT_MIN = 10;
const CONTENT_MAX = 2000;

export default function ContactPage() {
  const { data: session } = useSession();
  const defaultEmail = useMemo(() => session?.user?.email ?? "", [session]);
  const [category, setCategory] =
    useState<ContactInquiryCategory>("service");
  const [email, setEmail] = useState(defaultEmail);
  const [content, setContent] = useState("");
  const createMut = useCreateContactInquiry();

  const submit = () => {
    const trimmedEmail = email.trim();
    const trimmedContent = content.trim();

    if (!trimmedEmail) {
      toast.error("답변 받을 이메일을 입력해주세요.");
      return;
    }
    if (
      trimmedContent.length < CONTENT_MIN ||
      trimmedContent.length > CONTENT_MAX
    ) {
      toast.error(`문의 내용은 ${CONTENT_MIN}~${CONTENT_MAX}자여야 합니다.`);
      return;
    }

    createMut.mutate(
      { category, email: trimmedEmail, content: trimmedContent },
      {
        onSuccess: () => {
          toast.success("문의가 접수되었습니다.");
          setContent("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border-subtle bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[760px] items-center justify-between px-5">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 text-sm font-semibold text-fg transition-opacity hover:opacity-80"
          >
            <KGIcon name="chev" size={14} />
            마이페이지
          </Link>
          <span className="rounded-full border border-border-medium bg-bg-muted px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-fg-3">
            Contact
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[760px] px-5 py-8">
        <section className="rounded-2xl border border-border-subtle bg-white p-6 shadow-card sm:p-7">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-kg-amber-deep">
            Help
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.5px] text-fg">
            문의하기
          </h1>
          <p className="mt-3 text-sm leading-7 text-fg-3">
            서비스 이용, 신고, 계정, 개인정보 관련 문의를 남겨주세요. 답변이
            필요한 경우 입력한 이메일로 연락드릴 수 있습니다.
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-border-subtle bg-bg p-5 shadow-card sm:p-6">
          <div>
            <label className="text-[13px] font-semibold text-fg-2">
              문의 유형
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={cls(
                    "rounded-xl border px-4 py-3 text-left transition-colors",
                    category === option.value
                      ? "border-kg-amber-soft bg-kg-amber-light text-kg-amber-deep"
                      : "border-border-subtle bg-bg text-fg-2 hover:bg-gray-50",
                  )}
                >
                  <span className="block text-[13px] font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-mono text-fg-3">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="contact-email"
              className="text-[13px] font-semibold text-fg-2"
            >
              답변 받을 이메일
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-border-medium bg-bg px-4 py-3 text-caption"
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="contact-content"
              className="text-[13px] font-semibold text-fg-2"
            >
              문의 내용
            </label>
            <textarea
              id="contact-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              maxLength={CONTENT_MAX}
              placeholder="문의 내용을 자세히 적어주세요."
              className="mt-2 w-full resize-none rounded-xl border border-border-medium bg-bg px-4 py-3 text-caption leading-6"
            />
            <div className="mt-1 text-right text-mono text-fg-4">
              {content.length}/{CONTENT_MAX}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={createMut.isPending}
              className="rounded-full bg-fg px-5 py-2.5 text-caption font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMut.isPending ? "접수 중..." : "문의 접수"}
            </button>
          </div>
        </section>

        <p className="mt-4 rounded-xl border border-border-subtle bg-bg-muted px-4 py-3 text-mono leading-6 text-fg-3">
          문의는 앱 내부에 접수되며, 운영자가 확인 여부와 처리 상태를 관리할 수
          있습니다.
        </p>
      </div>
    </main>
  );
}
