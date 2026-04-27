"use client";

import { cls } from "@/lib/utils";
import { Cafe } from "@/types/cafe";
import StarRating from "@/components/ui/StarRating";
import LevelBar from "@/components/ui/LevelBar";
import MonoLabel from "@/components/ui/MonoLabel";
import CafeHeroGlyph from "./CafeHeroGlyph";
import {
  TbX,
  TbPlug,
  TbWifi,
  TbVolume,
  TbLayoutGrid,
  TbBan,
  TbArrowRight,
  TbBookmark,
  TbClock,
} from "react-icons/tb";
import { motion } from "framer-motion";

const HERO_BG: Record<string, string> = {
  dark: "linear-gradient(135deg, #2a2220, #453530)",
  cream: "linear-gradient(135deg, #f3e8d5, #ead9bc)",
  paper: "linear-gradient(135deg, #eeeae2, #d9d3c4)",
  warm: "linear-gradient(135deg, #f5d9b3, #e8b87a)",
};

const LEVEL_ITEMS = [
  { Icon: TbPlug, label: "콘센트", key: "power" },
  { Icon: TbWifi, label: "와이파이", key: "wifi" },
  { Icon: TbVolume, label: "조용함", key: "quiet" },
  { Icon: TbLayoutGrid, label: "공간", key: "space" },
] as const;

interface CafePreviewInnerProps {
  cafe: Cafe;
  onClose: () => void;
  onOpenDetail: () => void;
}

function CafePreviewInner({
  cafe,
  onClose,
  onOpenDetail,
}: CafePreviewInnerProps) {
  const isOpen = cafe.peakHours.includes(new Date().getHours());

  return (
    <div className="flex flex-col gap-0">
      {/* ── Header ── */}
      <div className="flex gap-4">
        {/* Thumbnail — gradient must stay inline */}
        <div
          className="size-[88px] rounded-lg shrink-0 relative overflow-hidden"
          style={{ background: HERO_BG[cafe.hero] }}
        >
          <CafeHeroGlyph kind={cafe.hero} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Name + open badge */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <h4 className="text-btn font-semibold tracking-[-0.3px] text-fg m-0 truncate leading-snug">
                  {cafe.name}
                </h4>
                {isOpen && <MonoLabel>영업중</MonoLabel>}
              </div>

              {/* Neighborhood · price */}
              <p className="text-mono text-fg-3 m-0 leading-normal">
                {cafe.neigh}
                <span className="mx-1 text-fg-4">·</span>
                {cafe.avgPrice}
              </p>

              {/* Stars + hours */}
              <div className="mt-1.5 flex items-center gap-2.5">
                <StarRating value={cafe.stars} size={12} />
                <span className="text-[11px] text-fg-4">
                  후기 {cafe.reviewCount}
                </span>
                <span className="inline-flex items-center gap-[3px] text-[11px] text-fg-4">
                  <TbClock size={11} strokeWidth={2} />
                  {cafe.hours}
                </span>
              </div>
            </div>

            {/* Score */}
            {/* <ScoreDisc value={cafe.score} size={50} thickness={4} /> */}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {cafe.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[10.5px] font-medium text-fg-3 bg-gray-100 rounded-full px-2 py-px"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="shrink-0 size-7 rounded-full bg-gray-100 hover:bg-gray-200 inline-flex items-center justify-center cursor-pointer border-none text-fg-3 transition-colors -mt-0.5 -mr-0.5"
        >
          <TbX size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border-subtle my-4" />

      {/* ── Facility levels ── */}
      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        {LEVEL_ITEMS.map(({ Icon, label, key }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-2 text-[10.5px] text-fg-3 font-medium">
              <Icon size={11} strokeWidth={2} />
              {label}
              <LevelBar value={cafe.levels[key]} />
            </span>
          </div>
        ))}
      </div>

      {/* ── Limits ── */}
      {cafe.limits.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3.5 py-2.5 px-3.5 rounded-xl bg-error/8 text-error text-mono font-medium">
          <TbBan size={13} strokeWidth={2.2} className="shrink-0" />
          <span>제한: {cafe.limits.join(" · ")}</span>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={onOpenDetail}
          className={cls(
            "flex-1 inline-flex items-center justify-center gap-1.5",
            "py-[10px] px-[18px] rounded-full border-none cursor-pointer",
            "font-semibold text-[13.5px] bg-fg text-bg",
            "hover:opacity-90 transition-opacity",
          )}
        >
          상세 보기
          <TbArrowRight size={15} strokeWidth={2.2} />
        </button>
        <button
          className={cls(
            "inline-flex items-center gap-1.5",
            "py-[10px] px-4 rounded-full cursor-pointer border border-border-medium",
            "font-medium text-[13.5px] bg-bg text-fg-2",
            "hover:bg-gray-50 transition-colors",
          )}
        >
          <TbBookmark size={15} strokeWidth={2} />
          저장
        </button>
      </div>
    </div>
  );
}

interface FloatingCardProps {
  cafe: Cafe;
  onClose: () => void;
  onOpenDetail: () => void;
}

export function FloatingCard({ cafe, onClose }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeInOut" },
      }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cls(
        "absolute left-1/2 -translate-x-1/2 z-40",
        "bottom-[28px] min-w-[300px] w-[min(580px,calc(100%-40px))]",
        "bg-bg rounded-2xl border border-border-subtle shadow-overlay",
        "p-5",
      )}
    >
      <CafePreviewInner cafe={cafe} onClose={onClose} onOpenDetail={() => {}} />
    </motion.div>
  );
}
