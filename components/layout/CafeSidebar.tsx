"use client";

import { CafeMarker } from "@/types/db";
import CafeCard from "../cafe/card/CafeCard";
import { cls } from "@/lib/utils";
import { IoIosArrowBack } from "react-icons/io";
import { motion } from "framer-motion";
import { useCafeSelectionStore } from "@/stores/cafeSelectionStore";

interface CafeSidebarProps {
  cafes: CafeMarker[]; // 카페 목록
  hoveredId: string | null; // 호버된 카페 ID
  setHoveredId: (id: string) => void; // 호버된 카페 ID 설정
  cardDensity: "medium" | "low"; // 카드 밀도
  isOpen: boolean; // 사이드바 열림 여부
  setSidebarOpen: (open: boolean) => void; // 사이드바 열림 여부 설정
}

export default function CafeSidebar({
  cafes,
  setHoveredId,
  cardDensity,
  isOpen,
  setSidebarOpen,
}: CafeSidebarProps) {
  const selectedId = useCafeSelectionStore((state) => state.selectedId);
  const openCafePreview = useCafeSelectionStore(
    (state) => state.openCafePreview,
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? "100vw" : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cls(
        "z-[170] h-full absolute top-0 left-0 bottom-0 w-full max-w-[420px] bg-white",
      )}
    >
      {/* Sidebar toggle button */}
      <button
        className={cls(
          "absolute z-[171] top-4 h-8 rounded-md bg-white border border-zinc-100 flex items-center justify-center cursor-pointer",
          isOpen
            ? "rotate-0 right-4 w-8"
            : "left-[calc(100%+10px)] w-max gap-2 pl-4 pr-2",
        )}
        onClick={() => setSidebarOpen(!isOpen)}
      >
        {!isOpen && (
          <div className="text-btn font-semibold tracking-[-0.2px]">
            <span className="text-amber-700">근처</span> {cafes.length}개 발견
          </div>
        )}

        <IoIosArrowBack
          size={24}
          className={cls("text-zinc-500", isOpen ? "rotate-0" : "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="relative w-full h-full overflow-scroll">
          <div className="relative min-w-[300px] max-w-[420px] w-full mx-auto overflow-hidden border-r border-border-subtle flex flex-col shrink-0 bg-bg">
            <div className="border-b border-border-subtle flex items-center justify-between py-[14px] px-[20px]">
              <div>
                <div className="text-btn font-semibold tracking-[-0.2px]">
                  <span className="text-amber-700">근처</span> {cafes.length}개
                  발견
                </div>
                <div className="text-mono text-fg-3 mt-[3px]">
                  카공 적합도 순으로 정렬
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 kg-scroll p-5">
              {cafes.map((c) => (
                <CafeCard
                  key={c.id}
                  cafe={c}
                  compact={cardDensity === "low"}
                  selected={c.id === selectedId}
                  onHover={() => setHoveredId(c.id)}
                  onClick={() => openCafePreview(c.id)}
                />
              ))}
              <div className="py-5 text-center text-mono text-fg-4 font-mono uppercase tracking-[0.5px]">
                End of results · {cafes.length} cafes
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
