"use client";

import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";
import KagongMapModal from "../modal/KagongMapModal";
import { useEffect, useMemo, useRef, useState } from "react";
import CafeInfoForm from "../cafe/form/CafeInfoForm/CafeInfoForm";
import { signOut, useSession } from "next-auth/react";
import KaGongButton from "../button/KaGongButton";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import Image from "next/image";
import DropDownItem from "../holder/DropdownHolder";
import { useCafeMarkers } from "@/lib/api/cafes";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface TopNavProps {
  onSelectCafe?: (id: string) => void;
}

interface AdminStatusResponse {
  isAdmin: boolean;
}

async function fetchAdminStatus(): Promise<AdminStatusResponse> {
  const res = await fetch("/api/admin/me", { cache: "no-store" });

  if (!res.ok) {
    return { isAdmin: false };
  }

  return (await res.json()) as AdminStatusResponse;
}

export default function TopNav({ onSelectCafe }: TopNavProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { data: allCafes = [] } = useCafeMarkers();

  const filteredCafes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allCafes
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [allCafes, query]);

  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (desktopSearchRef.current?.contains(target)) return;
      if (mobileSearchRef.current?.contains(target)) return;
      setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  const handleSelectCafe = (id: string) => {
    setSearchOpen(false);
    setQuery("");
    if (onSelectCafe) {
      onSelectCafe(id);
    } else {
      router.push(`/cafes/${id}`);
    }
  };

  const showDropdown = searchOpen && query.trim().length > 0;

  return (
    <>
      <header className="sticky top-0 z-[140] border-b border-border-subtle bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center gap-3 md:gap-5">
          <Logo />

          <span
            aria-hidden
            className="hidden md:block w-px h-[22px] bg-border-subtle shrink-0"
          />

          <div
            ref={desktopSearchRef}
            className="relative hidden md:flex flex-1 max-w-[480px]"
          >
            <SearchBar
              query={query}
              setQuery={setQuery}
              className="flex w-full"
              onFocus={() => setSearchOpen(true)}
            />
            {showDropdown && (
              <DropDownItem cafes={filteredCafes} onSelect={handleSelectCafe} />
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ReportButton onClick={() => setShowModal(true)} />

            <AdminButton />
            <AuthArea />
          </div>
        </div>
        {/* 모바일 검색 행 */}
        <div ref={mobileSearchRef} className="md:hidden px-4 pb-3 relative">
          <SearchBar
            query={query}
            setQuery={setQuery}
            className="flex"
            onFocus={() => setSearchOpen(true)}
          />
          {showDropdown && (
            <DropDownItem cafes={filteredCafes} onSelect={handleSelectCafe} />
          )}
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
    <Link
      href="/"
      className="flex items-center gap-2 text-fg font-semibold text-[19px] tracking-[-0.3px] shrink-0 transition-opacity hover:opacity-80"
    >
      <Image
        src="/images/logo.png"
        alt="카공맵"
        width={120}
        height={50}
        className="object-cover"
      />
    </Link>
  );
}

/* ---------- SearchBar ---------- */
interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  className?: string;
  onFocus?: () => void;
}
function SearchBar({ query, setQuery, className, onFocus }: SearchBarProps) {
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
        onFocus={onFocus}
        placeholder="카페 검색…"
        className="flex-1 bg-transparent border-none outline-none text-fg text-sm placeholder:text-fg-4"
      />
    </div>
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
        style={{
          width: "40px",
          height: "40px",
        }}
      >
        <KGIcon name="users" size={20} stroke={2} />
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

function AdminButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: fetchAdminStatus,
    enabled: Boolean(session),
    staleTime: 60_000,
  });

  if (!session || !data?.isAdmin) {
    return null;
  }

  return (
    <KaGongButton
      buttonStyle="OUTLINED"
      buttonSize="MEDIUM"
      onClick={() => router.push("/admin")}
    >
      A
    </KaGongButton>
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
