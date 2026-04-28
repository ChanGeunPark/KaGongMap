import { cls } from "@/lib/utils";
import { TbCheck } from "react-icons/tb";

interface StepIndicatorProps {
  steps: readonly string[];
  current: number;
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cls(
                "size-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold transition-all duration-200",
                i < current
                  ? "bg-kg-amber text-white"
                  : i === current
                    ? "bg-kg-amber text-white ring-4 ring-kg-amber/20"
                    : "bg-gray-100 text-fg-4",
              )}
            >
              {i < current ? <TbCheck size={12} strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={cls(
                "text-small font-medium transition-colors",
                i === current
                  ? "text-fg"
                  : i < current
                    ? "text-fg-3"
                    : "text-fg-4",
              )}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cls(
                "mx-3 h-px w-8 transition-all duration-300",
                i < current ? "bg-kg-amber" : "bg-border-medium",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
