"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import KGIcon from "@/components/ui/KGIcon";
import KaGongButton from "@/components/button/KaGongButton";
import { useUserStore } from "@/stores/userStore";
import { cls } from "@/lib/utils";
import MenuItem from "./MenuItem";

export default function AuthArea() {
  const { data: session } = useSession();
  const { dbUser } = useUserStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!session) {
    return (
      <KaGongButton
        buttonStyle="OUTLINED"
        buttonSize="MEDIUM"
        onClick={() => router.push("/login")}
        style={{
          width: "40px",
          height: "40px",
        }}
      >
        <KGIcon name="users" size={20} stroke={2} />
      </KaGongButton>
    );
  }

  const name = dbUser?.nickname ?? "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="사용자 메뉴"
        aria-expanded={open}
        className={cls(
          "relative w-[40px] h-[40px] overflow-hidden rounded-full inline-flex items-center justify-center shrink-0",
          "bg-gray-100 text-base font-semibold text-fg-2 ring-1 ring-border-medium",
          "transition-all duration-150 hover:ring-kg-amber/40 hover:shadow-button",
          open && "ring-kg-amber/50 shadow-button",
        )}
      >
        {dbUser?.avatar_url ? (
          <Image
            src={dbUser.avatar_url}
            alt={name}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cls(
            "absolute right-0 top-[calc(100%+8px)] z-[150] min-w-[200px] overflow-hidden",
            "rounded-sm border border-border-medium bg-white shadow-overlay",
          )}
        >
          {/* 헤더 */}
          <div className="px-3 py-2.5 border-b border-border-subtle">
            <div className="text-[11px] font-medium uppercase tracking-wide text-fg-4">
              로그인됨
            </div>
            <div className="text-sm font-semibold text-fg truncate mt-0.5">
              {name}
            </div>
          </div>

          {/* 메뉴 */}
          <div className="p-1.5">
            <MenuItem
              onClick={() => {
                setOpen(false);
                router.push("/mypage");
              }}
            >
              나의 정보
            </MenuItem>
            <MenuItem
              tone="danger"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              로그아웃
            </MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}
