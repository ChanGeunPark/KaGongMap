"use client";

import { useRef, useState, useEffect } from "react";
import { FilterItem, FilterVariant, SortBy } from "@/types/cafe";
import { KG_FILTERS } from "@/lib/data";
import KGIcon from "@/components/ui/KGIcon";
import Chip from "@/components/ui/Chip";
import { cls } from "@/lib/utils";

interface FilterBarProps {
  variant: FilterVariant;
  activeFilters: Set<string>;
  toggle: (id: string) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  openDrawer: () => void;
  matchCount: number;
}

export default function FilterBar(props: FilterBarProps) {
  if (props.variant === "dropdowns") return <FilterDropdowns {...props} />;
  if (props.variant === "bottomSheet") return <FilterCompact {...props} />;
  return <FilterChips {...props} />;
}

function FilterChips({
  activeFilters,
  toggle,
  sortBy,
  setSortBy,
}: FilterBarProps) {
  return (
    <div className="w-full border-b border-border-subtle">
      <div
        className={cls(
          "container mx-auto px-4 flex items-center gap-2 bg-bg overflow-x-auto whitespace-nowrap scrollbar-hide",
          "py-3",
        )}
      >
        <div className="flex items-center gap-1.5 mr-0.5">
          <KGIcon name={"sliders"} size={14} stroke={2} />
          <span className="ext-sm font-semibold text-zinc-500">필터</span>
        </div>
        <div className="w-px h-5 border-l border-border-subtle mx-1" />
        {KG_FILTERS.map((f) => (
          <Chip
            key={f.id}
            active={activeFilters.has(f.id)}
            onClick={() => toggle(f.id)}
            icon={f.icon}
          >
            {f.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function FilterDropdowns({
  activeFilters,
  toggle,
  sortBy,
  setSortBy,
}: FilterBarProps) {
  const GROUPS = [
    { label: "시설", ids: ["power", "wifi", "notebook"] },
    { label: "분위기", ids: ["quiet", "space"] },
    { label: "운영", ids: ["open24", "noLimit", "cheap"] },
  ];

  return (
    <div
      className="flex items-center gap-2.5 px-6 border-b border-border-subtle bg-bg"
      style={{ paddingTop: 14, paddingBottom: 14 }}
    >
      {GROUPS.map((g) => {
        const items = g.ids.map((id) => KG_FILTERS.find((f) => f.id === id)!);
        const count = g.ids.filter((id) => activeFilters.has(id)).length;
        return (
          <DropdownButton
            key={g.label}
            label={g.label}
            count={count}
            items={items}
            activeFilters={activeFilters}
            toggle={toggle}
          />
        );
      })}
      <div className="ml-auto flex items-center gap-1.5">
        <span
          className="text-mono text-fg-3 font-mono uppercase"
          style={{ letterSpacing: 0.5 }}
        >
          정렬
        </span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="text-[13px] font-medium rounded-full border border-border-medium bg-bg text-fg cursor-pointer"
          style={{ padding: "6px 10px", fontFamily: "var(--font-sans)" }}
        >
          <option value="score">카공 적합도순</option>
          <option value="distance">가까운 순</option>
          <option value="stars">별점순</option>
        </select>
      </div>
    </div>
  );
}

interface DropdownButtonProps {
  label: string;
  count: number;
  items: FilterItem[];
  activeFilters: Set<string>;
  toggle: (id: string) => void;
}

function DropdownButton({
  label,
  count,
  items,
  activeFilters,
  toggle,
}: DropdownButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full cursor-pointer text-[13px] font-medium border"
        style={{
          padding: "7px 12px 7px 14px",
          background: count ? "var(--fg)" : "var(--bg)",
          color: count ? "var(--bg)" : "var(--fg-2)",
          borderColor: count ? "var(--fg)" : "var(--border-medium)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
        {count > 0 && (
          <span
            className="font-mono text-[10.5px] font-bold rounded-full"
            style={{
              padding: "1px 6px",
              background: "var(--kg-amber)",
              color: "var(--fg)",
            }}
          >
            {count}
          </span>
        )}
        <KGIcon name="chevDown" size={12} stroke={2.2} />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 min-w-[180px] bg-bg border border-border-medium rounded-xl z-[150]"
          style={{
            boxShadow: "var(--shadow-overlay)",
            padding: 6,
          }}
        >
          {items.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-2.5 rounded-lg cursor-pointer text-[13px]"
              style={{
                padding: "8px 10px",
                background: activeFilters.has(f.id)
                  ? "var(--gray-100)"
                  : "transparent",
              }}
            >
              <input
                type="checkbox"
                checked={activeFilters.has(f.id)}
                onChange={() => toggle(f.id)}
                style={{ accentColor: "var(--kg-amber)" }}
              />
              <KGIcon name={f.icon} size={14} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterCompact({
  openDrawer,
  activeFilters,
  matchCount,
}: FilterBarProps) {
  return (
    <div
      className="flex items-center gap-3 px-6 border-b border-border-subtle bg-bg"
      style={{ paddingTop: 14, paddingBottom: 14 }}
    >
      <button
        onClick={openDrawer}
        className="inline-flex items-center gap-2 rounded-full cursor-pointer text-[13px] font-semibold border"
        style={{
          padding: "9px 18px",
          background: "var(--fg)",
          color: "var(--bg)",
          borderColor: "var(--fg)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <KGIcon name="sliders" size={14} stroke={2.2} />
        필터
        {activeFilters.size > 0 && (
          <span
            className="font-mono text-[10.5px] font-bold rounded-full"
            style={{
              padding: "1px 6px",
              background: "var(--kg-amber)",
              color: "var(--fg)",
            }}
          >
            {activeFilters.size}
          </span>
        )}
      </button>
      <div className="flex gap-2">
        {["콘센트", "조용함", "24시간"].map((q) => (
          <Chip key={q}>{q}</Chip>
        ))}
      </div>
      <div className="ml-auto text-[13px] text-fg-3">
        <span className="text-fg font-semibold">{matchCount}개</span> 카페
      </div>
    </div>
  );
}
