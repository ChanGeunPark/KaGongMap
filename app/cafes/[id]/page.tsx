"use client";
import { use } from "react";
import Link from "next/link";
import KGIcon from "@/components/ui/KGIcon";
import HeroGallery from "@/components/cafe/detail/HeroGallery";
import CafeEnvironmentSection from "@/components/cafe/detail/CafeEnvironmentSection";
import CafeInfoSidebar from "@/components/cafe/detail/CafeInfoSidebar";
import TopNav from "@/components/layout/TopNav";
import { useCafeDetail } from "@/lib/api/cafes";
import { TbHeart, TbHeartFilled } from "react-icons/tb";
import { useLikes } from "@/hooks/useLikes";

export default function CafeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // const cafe = KG_CAFES.find((c) => c.id === id);
  // if (!cafe) notFound();

  const { data: cafe, isLoading } = useCafeDetail(id);
  const { isLiked, toggle } = useLikes();
  const liked = cafe ? isLiked(cafe.id) : false;

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
                <button
                  type="button"
                  onClick={() => cafe && toggle(cafe.id)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors cursor-pointer " +
                    (liked
                      ? "bg-red-50 text-red-500 hover:bg-red-100"
                      : "bg-gray-50 text-fg-2 hover:bg-gray-100")
                  }
                >
                  {liked ? (
                    <TbHeartFilled size={14} />
                  ) : (
                    <TbHeart size={14} strokeWidth={2.2} />
                  )}
                  <span className="font-semibold">{cafe?.like_count ?? 0}</span>
                </button>
                <span className="w-[3px] h-[3px] rounded-full bg-fg-4" />
                <span className="hidden sm:inline">{cafe?.address}</span>
              </div>
            </div>

            {/* 카공 적합도 요약 (태그 개수 기반) */}
            <div className="flex items-center gap-5 p-6 rounded-[20px] bg-fg text-white mb-7">
              <div className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-kg-amber text-fg shrink-0">
                <span className="text-[26px] font-extrabold leading-none">
                  {cafe?.tags.length ?? 0}
                </span>
                <span className="text-[10px] font-semibold mt-1 tracking-[0.4px] uppercase">
                  Tags
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] font-semibold tracking-[0.6px] uppercase text-kg-amber mb-1.5">
                  카공 적합도
                </div>
                <div className="text-[18px] sm:text-[22px] font-semibold tracking-[-0.3px] mb-1">
                  {(cafe?.tags.length ?? 0) >= 7
                    ? "우수"
                    : (cafe?.tags.length ?? 0) >= 4
                      ? "양호"
                      : "정보 부족"}
                </div>
                <div
                  className="text-[13px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  콘센트 · 와이파이 · 조용함 등 카공 친화 태그 개수 기준. 7개
                  이상 우수, 4개 이상 양호.
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
