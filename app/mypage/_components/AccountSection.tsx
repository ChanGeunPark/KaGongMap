"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";
import { useUserStore } from "@/stores/userStore";
import { useUpdateNickname } from "@/lib/api/user";

export default function AccountSection() {
  const dbUser = useUserStore((s) => s.dbUser);
  const dbNickname = dbUser?.nickname ?? "";
  const { mutate: updateNickname, isPending } = useUpdateNickname();

  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");

  const submit = () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      toast.error("닉네임은 2~20자여야 합니다.");
      return;
    }
    if (trimmed === dbNickname) {
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
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-main-deep">
            Profile
          </p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.3px] text-fg">
            프로필
          </h2>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full bg-gray-100 px-4 py-2 text-[12.5px] font-semibold text-fg-2 transition-colors hover:bg-gray-200"
        >
          로그아웃
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[13px] font-semibold text-fg-2">닉네임</div>
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="min-w-0 flex-1 rounded-xl border border-border-medium bg-bg px-4 py-3 text-[14px]"
              autoFocus
            />
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="rounded-full bg-fg px-4 py-2 text-[12.5px] font-semibold text-bg disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNickname(dbNickname);
                setEditing(false);
              }}
              className="rounded-full bg-gray-100 px-4 py-2 text-[12.5px] font-semibold text-fg-2"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-muted px-4 py-3">
            <span className="min-w-0 truncate text-[15px] font-semibold text-fg">
              {dbNickname || "닉네임 없음"}
            </span>
            <button
              type="button"
              onClick={() => {
                setNickname(dbNickname);
                setEditing(true);
              }}
              className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-fg-2 hover:bg-gray-200"
            >
              변경
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
