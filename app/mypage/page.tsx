"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useUserStore } from "@/stores/userStore";
import { useUpdateNickname } from "@/lib/api/user";
import { cls } from "@/lib/utils";
import KGIcon from "@/components/ui/KGIcon";

export default function MyPage() {
  const { status } = useSession();
  const dbUser = useUserStore((s) => s.dbUser);
  const { mutate: updateNickname, isPending } = useUpdateNickname();

  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (dbUser?.nickname) setNickname(dbUser.nickname);
  }, [dbUser?.nickname]);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <KGIcon name="loader" size={28} stroke={1.5} />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="text-fg-3 text-mono">로그인이 필요합니다</span>
          <Link
            href="/login"
            className="px-4 py-2 rounded-full bg-fg text-bg text-[13px] font-semibold"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  const submit = () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      toast.error("닉네임은 2~20자여야 합니다.");
      return;
    }
    if (trimmed === dbUser?.nickname) {
      setEditing(false);
      return;
    }
    updateNickname(trimmed, {
      onSuccess: () => {
        toast.success("닉네임이 변경되었습니다.");
        setEditing(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[640px] mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-[24px] font-semibold tracking-[-0.4px]">
            마이페이지
          </h1>
          <Link href="/" className="text-fg-3 text-[13px] hover:text-fg">
            ← 지도로
          </Link>
        </div>

        <section className="rounded-2xl border border-border-subtle bg-bg p-5">
          <div className="text-[11px] font-mono uppercase text-fg-3 tracking-[0.5px] mb-2">
            닉네임
          </div>

          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="flex-1 px-3 py-2 rounded-lg border border-border-medium bg-bg text-[14px]"
                autoFocus
              />
              <button
                type="button"
                onClick={submit}
                disabled={isPending}
                className={cls(
                  "px-4 py-2 rounded-full text-[12.5px] font-semibold cursor-pointer",
                  "bg-fg text-bg disabled:opacity-50",
                )}
              >
                {isPending ? "저장 중…" : "저장"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNickname(dbUser?.nickname ?? "");
                  setEditing(false);
                }}
                className="px-4 py-2 rounded-full text-[12.5px] font-semibold cursor-pointer bg-gray-100 text-fg-2"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-semibold">
                {dbUser?.nickname ?? "—"}
              </span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer bg-gray-100 text-fg-2 hover:bg-gray-200"
              >
                변경
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
