import { Cafe, HeroKind } from "@/types/cafe";
import CafeHeroGlyph from "./CafeHeroGlyph";
import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";
import { CafeWithDetail } from "@/types/db";

const HERO_BG: Record<HeroKind, string> = {
  dark: "bg-[linear-gradient(135deg,#2a2220,#453530)]",
  cream: "bg-[linear-gradient(135deg,#f3e8d5,#ead9bc)]",
  paper: "bg-[linear-gradient(135deg,#eeeae2,#d9d3c4)]",
  warm: "bg-[linear-gradient(135deg,#f5d9b3,#e8b87a)]",
};

interface HeroGalleryProps {
  cafe: CafeWithDetail;
}

export default function HeroGallery({ cafe }: HeroGalleryProps) {
  const bg = HERO_BG[cafe.tags[0] as HeroKind];

  return (
    <>
      {/* 모바일: 단일 이미지 */}
      <div
        className={cls(
          "relative h-56 sm:h-72 rounded-2xl overflow-hidden mb-6 lg:hidden",
          bg,
        )}
      >
        <CafeHeroGlyph kind={cafe.tags[0] as HeroKind} />
        <button className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 text-white border-none text-xs font-medium cursor-pointer px-3 py-1.5">
          <KGIcon name="camera" size={12} /> 사진 28장
        </button>
      </div>

      {/* 데스크톱: 5분할 갤러리 그리드 */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-2 rounded-[20px] overflow-hidden mb-8 h-[400px]">
        <div className={cls("relative row-span-2", bg)}>
          <CafeHeroGlyph kind={cafe.tags[0] as HeroKind} />
        </div>
        <div className={cls("relative hue-rotate-[10deg] brightness-105", bg)}>
          <CafeHeroGlyph kind={cafe.tags[0] as HeroKind} />
        </div>
        <div className={cls("relative brightness-[0.92]", bg)}>
          <CafeHeroGlyph kind={cafe.tags[0] as HeroKind} />
        </div>
        <div className={cls("relative saturate-[0.7]", bg)}>
          <CafeHeroGlyph kind={cafe.tags[0] as HeroKind} />
        </div>
        <div className={cls("relative hue-rotate-[-15deg]", bg)}>
          <CafeHeroGlyph kind={cafe.tags[0] as HeroKind} />
          <button className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 text-white border-none text-xs font-medium cursor-pointer px-3 py-1.5">
            <KGIcon name="camera" size={12} /> 사진 28장
          </button>
        </div>
      </div>
    </>
  );
}
