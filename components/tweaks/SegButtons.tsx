import { cls } from "@/lib/utils";

interface SegButtonsProps {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}

export default function SegButtons({
  value,
  onChange,
  options,
}: SegButtonsProps) {
  return (
    <div className="flex p-[3px] rounded-full gap-0.5 bg-gray-100">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cls(
            "flex-1 rounded-full border-none cursor-pointer text-mono py-[6px] px-3 font-sans",
            value === o.v
              ? "bg-bg text-fg font-semibold shadow-button"
              : "bg-transparent text-fg-3 font-medium shadow-none",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
