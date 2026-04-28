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

const NAV_ITEMS = [
  { label: "지도", on: true },
  { label: "랭킹" },
  { label: "카공팁" },
  { label: "카페 등록" },
];

interface TopNavProps {
  query: string;
  setQuery: (q: string) => void;
}

export default function TopNav({ query, setQuery }: TopNavProps) {
  const [showModal, setShowModal] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session } = useSession();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { dbUser } = useUserStore();

  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleHideModal = () => {
    setShowModal(false);
  };
  return (
    <>
      <div
        className="sticky top-0 z-50 border-b border-border-subtle backdrop-blur-md"
        style={{ background: "rgba(255,255,255,0.92)" }}
      >
        {/* 메인 행 */}
        <div className="px-4 sm:px-6 h-14 md:h-16 flex items-center gap-3 md:gap-5">
          {/* 로고 */}
          <a
            href="#"
            className="flex items-center gap-2 no-underline text-fg font-semibold text-[19px] tracking-[-0.3px] shrink-0"
          >
            <span className="inline-flex items-center justify-center rounded-xl text-kg-amber w-[26px] h-[26px] bg-fg">
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

          {/* 구분선 — md+ */}
          <div className="hidden md:block w-px h-[22px] bg-border-subtle shrink-0" />

          {/* 검색 — md+ 인라인, 모바일은 하단 행으로 */}
          <div className="hidden md:flex flex-1 max-w-[480px] items-center gap-2.5 rounded-full border border-border-medium bg-bg text-fg-3 transition-colors duration-120 py-[9px] px-4">
            <KGIcon name="search" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="카페, 지역, 역 검색…"
              className="flex-1 bg-transparent border-none outline-none text-fg text-sm font-sans"
            />
            <span className="font-mono text-[10.5px] border border-border-medium rounded text-fg-3 py-1 px-1.5 tracking-[0.5px] hidden lg:block">
              ⌘K
            </span>
          </div>

          {/* 오른쪽 영역 */}
          <div className="flex items-center gap-2 ml-auto">
            {/* 모바일 검색 아이콘 — md 미만 */}
            <button className="md:hidden w-8 h-8 rounded-full bg-gray-50 border border-border-medium inline-flex items-center justify-center text-fg-2">
              <KGIcon name="search" size={16} />
            </button>

            {/* 네비 링크 — lg+ */}
            <nav className="hidden lg:flex gap-6 text-sm font-medium mr-2">
              {NAV_ITEMS.map((x) => (
                <a
                  key={x.label}
                  href="#"
                  className={cls(
                    "no-underline pb-1 border-b-2 transition-colors duration-120",
                    x.on
                      ? "text-fg border-kg-amber"
                      : "text-fg-3 border-transparent hover:text-fg",
                  )}
                >
                  {x.label}
                </a>
              ))}
            </nav>

            {/* CTA 버튼 — sm+ */}
            <button
              onClick={handleShowModal}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full cursor-pointer text-[13px] font-semibold border bg-kg-amber-light text-kg-amber-deep border-[rgba(180,111,5,0.15)] py-[7px] px-3.5"
            >
              <KGIcon name="plus" size={14} stroke={2.2} /> 카페 제보
            </button>

            {session ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="relative w-[40px] h-[40px] rounded-full bg-gray-100 inline-flex items-center justify-center text-[16px] font-semibold text-fg-2 shrink-0 cursor-pointer"
                >
                  {dbUser?.avatar_url ? (
                    <Image
                      src={dbUser.avatar_url}
                      alt={session?.user?.name ?? "User"}
                      width={40}
                      height={40}
                      objectFit="contain"
                      className="rounded-full object-cover absolute top-0 left-0 w-full h-full"
                    />
                  ) : (
                    (session?.user?.name?.charAt(0) ?? "U")
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[160px] rounded-xl border border-border-medium bg-white shadow-lg p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push("/mypage");
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-fg-2 hover:bg-gray-50 cursor-pointer"
                    >
                      나의 정보
                    </button>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <KaGongButton
                buttonStyle="OUTLINED"
                buttonSize="MEDIUM"
                onClick={() => router.push("/login")}
              >
                로그인
              </KaGongButton>
            )}
            {/* 햄버거 — lg 미만 */}
            <button className="lg:hidden w-8 h-8 rounded-full bg-gray-50 border border-border-medium inline-flex items-center justify-center text-fg-2">
              <KGIcon name="menu" size={18} />
            </button>
          </div>
        </div>

        {/* 모바일 검색 행 — md 미만 */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center gap-2.5 rounded-full border border-border-medium bg-bg text-fg-3 py-[9px] px-4">
            <KGIcon name="search" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="카페, 지역, 역 검색…"
              className="flex-1 bg-transparent border-none outline-none text-fg text-sm font-sans"
            />
          </div>
        </div>
      </div>
      <KagongMapModal
        title="제보하기"
        showModal={showModal}
        showModalToggler={setShowModal}
      >
        <CafeInfoForm onClose={handleHideModal} />
      </KagongMapModal>
    </>
  );
}
