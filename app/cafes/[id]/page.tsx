"use client";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KG_CAFES, getReviewsForCafe } from "@/lib/data";
import KGIcon from "@/components/ui/KGIcon";
import MonoLabel from "@/components/ui/MonoLabel";
import StarRating from "@/components/ui/StarRating";
import ScoreDiscDark from "@/components/ui/ScoreDiscDark";
import HeroGallery from "@/components/cafe/HeroGallery";
import CafeEnvironmentSection from "@/components/cafe/CafeEnvironmentSection";
import ProsCons from "@/components/cafe/ProsCons";
import CrowdChart from "@/components/cafe/CrowdChart";
import CafeReviews from "@/components/cafe/CafeReviews";
import CafeInfoSidebar from "@/components/cafe/CafeInfoSidebar";
import TopNav from "@/components/layout/TopNav";
import { useCafeDetail } from "@/hooks/useCafeDetail";

export default function CafeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // const cafe = KG_CAFES.find((c) => c.id === id);
  // if (!cafe) notFound();

  const { data: cafe, isLoading } = useCafeDetail(id);

  // const reviews = getReviewsForCafe(cafe);

  // const scoreLabel =
  //   cafe.score >= 90
  //     ? "카공하기에 최적의 장소예요"
  //     : cafe.score >= 75
  //       ? "카공하기 좋은 편이에요"
  //       : cafe.score >= 60
  //         ? "카공 가능하지만 조건을 확인하세요"
  //         : "카공에는 적합하지 않을 수 있어요";

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3 text-fg-3">
          <KGIcon name="loader" size={28} stroke={1.5} />
          <span className="text-mono text-sm">카페 정보를 불러오는 중…</span>
        </div>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3 text-fg-3">
          <KGIcon name="loader" size={28} stroke={1.5} />
          <span className="text-mono text-sm">
            카페 정보를 찾을 수 없습니다.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* 네비게이션 */}
      <TopNav query="카페 상세" setQuery={() => {}} />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-1.5 text-[13px] text-fg-3 mb-5 flex-wrap">
          <Link href="/" className="text-fg-3 no-underline hover:text-fg">
            지도
          </Link>
          <KGIcon name="chev" size={12} />
          <span>{cafe?.address}</span>
          <KGIcon name="chev" size={12} />
          <span className="text-fg font-medium">{cafe?.name}</span>
        </div>

        <HeroGallery cafe={cafe!} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-8 lg:gap-10">
          {/* 왼쪽 컬럼 */}
          <div>
            {/* 제목 블록 */}
            <div className="mb-7">
              <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.8px] leading-[1.1] mb-3">
                {cafe?.name}
              </h1>
              <div className="flex items-center gap-3.5 text-sm text-fg-3 flex-wrap">
                <StarRating value={cafe?.avg_rating ?? 0} size={14} />
                <span>후기 {cafe?.review_count ?? 0}개</span>
                <span className="w-[3px] h-[3px] rounded-full bg-fg-4" />
                <span className="hidden sm:inline">{cafe?.address}</span>
              </div>
            </div>

            {/* 스코어 요약 */}
            <div className="flex items-center gap-5 p-6 rounded-[20px] bg-fg text-white mb-7">
              <ScoreDiscDark value={cafe?.avg_rating ?? 0} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] font-semibold tracking-[0.6px] uppercase text-kg-amber mb-1.5">
                  카공 적합도 스코어
                </div>
                <div className="text-[18px] sm:text-[22px] font-semibold tracking-[-0.3px] mb-1">
                  {cafe?.avg_rating ?? 0}
                </div>
                <div
                  className="text-[13px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  콘센트 · 와이파이 · 조용함 · 공간여유 · 이용시간 · 혼잡도를
                  종합한 점수. 카공족 {cafe?.review_count ?? 0}명의 후기 기반.
                </div>
              </div>
            </div>

            <CafeEnvironmentSection cafe={cafe!} />
            {/* <ProsCons cafe={cafe} /> */}
            {/* {cafe?.crowd !== undefined && (
              <CrowdChart peakHours={cafe?.peakHours ?? []} crowd={cafe?.crowd ?? 0} />
            )} */}
            {/* <CafeReviews cafe={cafe!} reviews={[]} /> */}
          </div>

          {/* 오른쪽 사이드바 */}
          <aside>
            <CafeInfoSidebar cafe={cafe!} />
          </aside>
        </div>
      </div>
    </div>
  );
}
