"use client";

import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";
import KagongMapModal from "../modal/KagongMapModal";
import { useEffect, useRef, useState } from "react";
import CafeInfoForm from "../cafe/form/CafeInfoForm/CafeInfoForm";
import { signOut, useSession } from "next-auth/react";
import KaGongButton from "../button/KaGongButton";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import Image from "next/image";

interface TopNavProps {
  query: string;
  setQuery: (q: string) => void;
}

export default function TopNav({ query, setQuery }: TopNavProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-white/80 backdrop-blur-xl">
        <div className="px-4 h-14 md:h-16 flex items-center gap-3 md:gap-5">
          <Logo />

          <span
            aria-hidden
            className="hidden md:block w-px h-[22px] bg-border-subtle shrink-0"
          />

          <SearchBar
            query={query}
            setQuery={setQuery}
            className="hidden md:flex flex-1 max-w-[480px]"
            showShortcut
          />

          <div className="flex items-center gap-2 ml-auto">
            <ReportButton onClick={() => setShowModal(true)} />

            <AuthArea />
          </div>
        </div>

        {/* 모바일 검색 행 */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar query={query} setQuery={setQuery} className="flex" />
        </div>
      </header>

      <KagongMapModal
        title="제보하기"
        showModal={showModal}
        showModalToggler={setShowModal}
      >
        <CafeInfoForm onClose={() => setShowModal(false)} />
      </KagongMapModal>
    </>
  );
}

/* ---------- Logo ---------- */
function Logo() {
  return (
    <a
      href="#"
      className="flex items-center gap-2 text-fg font-semibold text-[19px] tracking-[-0.3px] shrink-0 transition-opacity hover:opacity-80"
    >
      <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-xl bg-fg text-kg-amber shadow-button">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.2" fill="currentColor" />
        </svg>
      </span>
      카공맵
    </a>
  );
}

/* ---------- SearchBar ---------- */
interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  className?: string;
  showShortcut?: boolean;
}
function SearchBar({
  query,
  setQuery,
  className,
  showShortcut,
}: SearchBarProps) {
  return (
    <div
      className={cls(
        "items-center gap-2.5 rounded-full border border-border-medium bg-bg-muted px-4 py-[9px] text-fg-3 transition-all duration-150",
        "focus-within:border-kg-amber/40 focus-within:bg-white focus-within:shadow-button focus-within:text-fg-2",
        className,
      )}
    >
      <KGIcon name="search" size={16} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="카페, 지역, 역 검색…"
        className="flex-1 bg-transparent border-none outline-none text-fg text-sm placeholder:text-fg-4"
      />
      {showShortcut && (
        <kbd className="hidden lg:block font-mono text-[10.5px] py-1 px-1.5 rounded border border-border-medium tracking-[0.5px] text-fg-3">
          ⌘K
        </kbd>
      )}
    </div>
  );
}

/* ---------- IconButton (모바일 검색/햄버거) ---------- */
interface IconButtonProps {
  icon: "search" | "menu";
  label: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}
function IconButton({
  icon,
  label,
  size = 16,
  className,
  onClick,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cls(
        "inline-flex w-9 h-9 items-center justify-center rounded-full border border-border-medium bg-bg-muted text-fg-2 transition-colors hover:bg-gray-100 active:scale-[0.96]",
        className,
      )}
    >
      <KGIcon name={icon} size={size} />
    </button>
  );
}

/* ---------- ReportButton (카페 제보 CTA) ---------- */
function ReportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px]",
        "text-base font-semibold border border-kg-amber/20 bg-kg-amber-light text-kg-amber-deep",
        "transition-all duration-150 hover:shadow-button hover:border-kg-amber/35 active:scale-[0.97]",
      )}
    >
      <KGIcon name="plus" size={16} stroke={3} />
      카페 제보
    </button>
  );
}

/* ---------- AuthArea (로그인 버튼 / 유저 드롭다운) ---------- */
function AuthArea() {
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
      >
        로그인
      </KaGongButton>
    );
  }

  const name = session.user?.name ?? "User";
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
            "absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden",
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

/* ---------- MenuItem ---------- */
function MenuItem({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cls(
        "w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        tone === "danger"
          ? "text-error hover:bg-red-50"
          : "text-fg-2 hover:bg-gray-50",
      )}
    >
      {children}
    </button>
  );
}
