"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FilterItem } from "@/types/cafe";
import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  activeFilters: Set<string>;
  toggle: (id: string) => void;
  filters: FilterItem[];
  onReset?: () => void;
}

export default function FilterDrawer({
  open,
  onClose,
  activeFilters,
  toggle,
  filters,
  onReset,
}: FilterDrawerProps) {
  const activeCount = activeFilters.size;

  const handleReset = () => {
    if (onReset) {
      onReset();
      return;
    }
    activeFilters.forEach((id) => toggle(id));
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[220]">
          <motion.div
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="필터"
            className="absolute bottom-0 left-0 right-0 mx-auto max-w-[560px] rounded-t-3xl bg-bg px-6 pt-5 pb-7"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border-medium" />

            <header className="mb-5 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-h3 font-semibold tracking-[-0.2px]">
                    필터
                  </h3>
                  {activeCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-kg-amber-light px-1.5 text-[11px] font-semibold text-kg-amber-deep">
                      {activeCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-fg-3">
                  카공에 맞는 조건을 골라주세요
                </p>
              </div>

              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[12.5px] font-medium text-fg-3 underline-offset-2 hover:text-fg hover:underline"
                >
                  초기화
                </button>
              )}
            </header>

            <div className="grid grid-cols-2 gap-2">
              {filters.map((f) => {
                const active = activeFilters.has(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggle(f.id)}
                    aria-pressed={active}
                    className={cls(
                      "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-caption transition-colors",
                      active
                        ? "border-kg-amber-soft bg-kg-amber-light text-kg-amber-deep font-semibold"
                        : "border-border-subtle bg-bg text-fg-2 font-medium hover:bg-gray-50",
                    )}
                  >
                    <KGIcon name={f.icon} size={16} />
                    <span className="flex-1 truncate">{f.label}</span>
                    {active && <KGIcon name="check" size={14} stroke={2.4} />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full cursor-pointer rounded-full bg-fg py-3 text-btn font-semibold text-bg"
            >
              {activeCount > 0
                ? `${activeCount}개 조건으로 결과 보기`
                : "결과 보기"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
