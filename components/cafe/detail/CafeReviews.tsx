import { Cafe, Review } from "@/types/cafe";
import StarRating from "@/components/ui/StarRating";
import MonoLabel from "@/components/ui/MonoLabel";
import KGIcon from "@/components/ui/KGIcon";

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="py-5 border-t border-border-subtle">
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
          style={{ background: review.avatarBg }}
        >
          {review.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{review.name}</span>
            {review.badge && (
              <MonoLabel color="var(--kg-amber-deep)" bg="var(--kg-amber-light)">
                {review.badge}
              </MonoLabel>
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-[3px] text-xs text-fg-3 flex-wrap">
            <StarRating value={review.stars} size={11} showText={false} />
            <span>·</span>
            <span>{review.date}</span>
            <span>·</span>
            <span>{review.visits}번 방문</span>
          </div>
        </div>
      </div>
      <p className="text-[14.5px] leading-relaxed text-fg-2 mb-2.5">{review.text}</p>
      <div className="flex gap-1.5 flex-wrap">
        {review.tags.map((t) => (
          <span
            key={t}
            className="text-[11.5px] px-2 py-[3px] rounded-full bg-gray-100 text-fg-2 font-medium"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

interface CafeReviewsProps {
  cafe: Cafe;
  reviews: Review[];
}

export default function CafeReviews({ cafe, reviews }: CafeReviewsProps) {
  const tagSummary = [
    { t: "콘센트 많음", n: Math.round(cafe.reviewCount * 0.62) },
    { t: "와이파이 빠름", n: Math.round(cafe.reviewCount * 0.48) },
    { t: "조용함", n: Math.round(cafe.reviewCount * 0.41) },
    { t: "장기체류 OK", n: Math.round(cafe.reviewCount * 0.38) },
    { t: "가성비", n: Math.round(cafe.reviewCount * 0.22) },
  ];

  return (
    <section>
      <div className="flex items-end justify-between mb-3.5">
        <h2 className="text-[22px] font-semibold tracking-[-0.24px]">
          카공족 후기 {cafe.reviewCount}개
        </h2>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-fg text-bg border-none cursor-pointer text-[13px] font-semibold">
          <KGIcon name="plus" size={14} stroke={2.2} /> 후기 작성
        </button>
      </div>

      {/* 태그 요약 */}
      <div className="flex gap-1.5 flex-wrap py-3.5 mb-2 border-t border-border-subtle">
        {tagSummary.map((x) => (
          <span
            key={x.t}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-[5px] rounded-full bg-gray-50 text-fg-2 font-medium border border-border-subtle"
          >
            {x.t}
            <span className="font-mono text-[11px] text-fg-3">{x.n}</span>
          </span>
        ))}
      </div>

      {reviews.map((r, i) => (
        <ReviewCard key={i} review={r} />
      ))}
    </section>
  );
}
