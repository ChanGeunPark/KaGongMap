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

export default async function CafeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cafe = KG_CAFES.find((c) => c.id === id);
  if (!cafe) notFound();

  const reviews = getReviewsForCafe(cafe);

  const scoreLabel =
    cafe.score >= 90
      ? "카공하기에 최적의 장소예요"
      : cafe.score >= 75
        ? "카공하기 좋은 편이에요"
        : cafe.score >= 60
          ? "카공 가능하지만 조건을 확인하세요"
          : "카공에는 적합하지 않을 수 있어요";

  return (
    <div className="min-h-screen bg-bg">
      {/* 네비게이션 */}
      <header className="sticky top-0 z-50 border-b border-border-subtle px-6 h-16 flex items-center gap-5 backdrop-blur-md bg-white/92">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-fg-2 no-underline text-sm font-medium"
        >
          <KGIcon name="chevLeft" size={16} /> 지도로 돌아가기
        </Link>
        <div className="w-px h-[22px] bg-border-subtle" />
        {/* 로고 */}
        <a href="/" className="flex items-center gap-2 no-underline text-fg font-semibold text-[19px] tracking-[-0.3px]">
          <span className="inline-flex items-center justify-center rounded-xl text-kg-amber w-[26px] h-[26px] bg-fg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z" />
              <circle cx="12" cy="9" r="2.2" fill="currentColor" />
            </svg>
          </span>
          카공맵
        </a>
        <nav className="hidden md:flex gap-6 text-sm font-medium ml-auto text-fg-3">
          {["지도", "랭킹", "카공팁", "카페 등록"].map((label) => (
            <a key={label} href="#" className="no-underline text-fg-3 hover:text-fg">
              {label}
            </a>
          ))}
        </nav>
        <button className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-kg-amber-light text-kg-amber-deep border border-[rgba(180,111,5,0.15)] cursor-pointer text-[13px] font-semibold px-3.5 py-[7px]">
          <KGIcon name="plus" size={14} stroke={2.2} /> 카페 제보
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-100 inline-flex items-center justify-center text-[13px] font-semibold text-fg-2">
          Y
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-1.5 text-[13px] text-fg-3 mb-5 flex-wrap">
          <Link href="/" className="text-fg-3 no-underline hover:text-fg">
            지도
          </Link>
          <KGIcon name="chev" size={12} />
          <span>{cafe.neigh}</span>
          <KGIcon name="chev" size={12} />
          <span className="text-fg font-medium">{cafe.name}</span>
        </div>

        <HeroGallery cafe={cafe} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-8 lg:gap-10">
          {/* 왼쪽 컬럼 */}
          <div>
            {/* 제목 블록 */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                {cafe.verified && (
                  <MonoLabel color="var(--color-brand-deep)" bg="var(--color-brand-light)">
                    <KGIcon name="check" size={10} stroke={3} /> 카공맵 인증
                  </MonoLabel>
                )}
                {cafe.trending && (
                  <MonoLabel color="var(--kg-amber-deep)" bg="var(--kg-amber-light)">
                    <KGIcon name="trending" size={10} stroke={2.5} /> {cafe.trending} 이번 주
                  </MonoLabel>
                )}
                {cafe.openNow && (
                  <MonoLabel color="var(--color-brand-deep)">
                    <span className="w-1.5 h-1.5 rounded-full bg-score-good" /> 영업중
                  </MonoLabel>
                )}
              </div>
              <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.8px] leading-[1.1] mb-3">
                {cafe.name}
              </h1>
              <div className="flex items-center gap-3.5 text-sm text-fg-3 flex-wrap">
                <StarRating value={cafe.stars} size={14} />
                <span>후기 {cafe.reviewCount}개</span>
                <span className="w-[3px] h-[3px] rounded-full bg-fg-4" />
                {cafe.distance !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <KGIcon name="walk" size={13} />
                    {cafe.distance}km · 도보 {Math.round(cafe.distance * 12)}분
                  </span>
                )}
                <span className="w-[3px] h-[3px] rounded-full bg-fg-4" />
                <span className="hidden sm:inline">{cafe.addr}</span>
              </div>
            </div>

            {/* 스코어 요약 */}
            <div className="flex items-center gap-5 p-6 rounded-[20px] bg-fg text-white mb-7">
              <ScoreDiscDark value={cafe.score} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] font-semibold tracking-[0.6px] uppercase text-kg-amber mb-1.5">
                  카공 적합도 스코어
                </div>
                <div className="text-[18px] sm:text-[22px] font-semibold tracking-[-0.3px] mb-1">
                  {scoreLabel}
                </div>
                <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                  콘센트 · 와이파이 · 조용함 · 공간여유 · 이용시간 · 혼잡도를 종합한 점수.
                  카공족 {cafe.reviewCount}명의 후기 기반.
                </div>
              </div>
            </div>

            <CafeEnvironmentSection cafe={cafe} />
            <ProsCons cafe={cafe} />
            {cafe.crowd !== undefined && (
              <CrowdChart peakHours={cafe.peakHours} crowd={cafe.crowd} />
            )}
            <CafeReviews cafe={cafe} reviews={reviews} />
          </div>

          {/* 오른쪽 사이드바 */}
          <aside>
            <CafeInfoSidebar cafe={cafe} />
          </aside>
        </div>
      </div>
    </div>
  );
}
