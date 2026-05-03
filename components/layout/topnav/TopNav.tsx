"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import KagongMapModal from "@/components/modal/KagongMapModal";
import CafeInfoForm from "@/components/cafe/form/CafeInfoForm/CafeInfoForm";
import DropDownItem from "@/components/holder/DropdownHolder";
import { useCafeMarkers } from "@/lib/api/cafes";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import ReportButton from "./ReportButton";
import AuthArea from "./AuthArea";
import AdminButton from "./AdminButton";

interface TopNavProps {
  onSelectCafe?: (id: string) => void;
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
