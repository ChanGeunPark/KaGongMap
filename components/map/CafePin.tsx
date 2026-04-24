import { cls } from "@/lib/utils";
import { Cafe } from "@/types/cafe";

interface CafePinProps {
  cafe: Cafe;
  prominent: boolean;
  selected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function CafePin({
  cafe,
  prominent,
  selected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: CafePinProps) {
  const score = cafe.score;
  const tone =
    score >= 85
      ? { bg: "bg-score-good", fg: "text-white", border: "border-score-good" }
      : score >= 65
        ? { bg: "bg-kg-amber", fg: "text-white", border: "border-kg-amber" }
        : { bg: "bg-white", fg: "text-fg-2", border: "border-white" };
  const dim = score < 60;

  // Only truly runtime-dynamic values (JS expressions) stay inline
  const buttonStyle: React.CSSProperties = {
    left: cafe.x,
    top: cafe.y,
    transform: `translate(-50%, -100%) scale(${prominent ? 1.15 : 1})`,
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cls(
        "absolute bg-transparent border-none cursor-pointer p-0",
        "origin-bottom transition-transform duration-200 ease-out",
        selected ? "z-30" : prominent ? "z-20" : "z-10",
        dim && !prominent && "opacity-[0.65]",
      )}
      style={buttonStyle}
      type="button"
    >
      {/* Pin body */}
      <div
        className={cls(
          "flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap",
          "text-mono tracking-[-0.2px]",
          "border-2 border-solid py-1 pr-[10px] pl-1.5",
          prominent
            ? "shadow-[0_6px_20px_rgba(0,0,0,0.18),0_2px_4px_rgba(0,0,0,0.1)]"
            : "shadow-[0_2px_6px_rgba(0,0,0,0.15)]",
          selected
            ? "bg-fg text-kg-amber border-fg"
            : cls(tone.bg, tone.fg, "border-white"),
        )}
      >
        <span
          className={cls(
            "inline-flex items-center justify-center rounded-full text-[11px] font-extrabold",
            "size-[22px]",
            selected ? "bg-kg-amber text-fg" : "bg-white/22 text-inherit",
          )}
        >
          {score}
        </span>
        {prominent ? (
          <span>{cafe.shortName}</span>
        ) : (
          <span className="text-[11px] font-semibold opacity-95">
            {cafe.shortName}
          </span>
        )}
      </div>
      {/* Pin tail */}
      <div
        className={cls(
          "rotate-45 mx-auto size-[10px] mt-[-6px]",
          "border-2 border-solid border-t-0 border-l-0",
          selected ? "bg-fg border-fg" : cls(tone.bg, "border-white"),
        )}
      />
    </button>
  );
}
