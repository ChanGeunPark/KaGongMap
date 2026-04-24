import KGIcon from "./KGIcon";

interface StarRatingProps {
  value: number;
  size?: number;
  showText?: boolean;
}

export default function StarRating({
  value,
  size = 13,
  showText = true,
}: StarRatingProps) {
  const full = Math.floor(value);
  const half = value - full >= 0.3 && value - full < 0.8;

  return (
    <span className="inline-flex items-center text-amber-500">
      {[0, 1, 2, 3, 4].map((i) => (
        <KGIcon
          key={i}
          name={
            i < full ? "starFill" : i === full && half ? "starFill" : "star"
          }
          size={size}
          stroke={1.5}
        />
      ))}
      {showText && (
        <span
          className="font-semibold text-[var(--fg)] ml-0.5"
          style={{ fontSize: size }}
        >
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
}
