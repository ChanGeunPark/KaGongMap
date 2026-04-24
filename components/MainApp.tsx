"use client";

import { cls } from "@/lib/utils";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Cafe,
  FilterVariant,
  LayoutVariant,
  MapTransform,
  SortBy,
} from "@/types/cafe";
import { KG_CAFES, KG_FILTERS } from "@/lib/data";
import TopNav from "@/components/layout/TopNav";
import FilterBar from "@/components/layout/FilterBar";
import FilterDrawer from "@/components/layout/FilterDrawer";
import BottomSheet from "@/components/layout/BottomSheet";
import { FloatingCard } from "@/components/cafe/CafePreviewCard";
import MapCanvas from "@/components/map/MapCanvas";
import MonoLabel from "@/components/ui/MonoLabel";
import CafeCard from "@/components/cafe/CafeCard";
import KGIcon from "@/components/ui/KGIcon";
import CafeSidebar from "./layout/CafeSidebar";

interface Tweaks {
  // 트윅 설정
  layoutVariant: LayoutVariant; // 레이아웃 변경
  filterVariant: FilterVariant; // 필터 변경
  cardDensity: "medium" | "low"; // 카드 밀도 변경
  pointColor: string; // 포인트 컬러 변경
}

const DEFAULT_TWEAKS: Tweaks = {
  layoutVariant: "sidebar",
  filterVariant: "chips",
  cardDensity: "medium",
  pointColor: "#F5A524",
};

const POINT_COLORS = ["#F5A524", "#E86A33", "#E33F5F", "#8B5CF6", "#18E299"];

function MapCtrlBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-xl bg-bg border border-border-subtle inline-flex items-center justify-center cursor-pointer text-fg-2 shadow-card"
    >
      <KGIcon name={icon} size={16} stroke={2} />
    </button>
  );
}

function TweaksPanel({
  tweaks,
  update,
}: {
  tweaks: Tweaks;
  update: (key: keyof Tweaks, value: string) => void;
}) {
  return (
    <div className="fixed right-5 bottom-5 z-500 w-[280px] bg-bg border border-border-medium rounded-2xl shadow-overlay p-5 font-sans">
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[13px] font-semibold tracking-[-0.2px]">
          Tweaks
        </div>
        <MonoLabel color="var(--kg-amber-deep)" bg="var(--kg-amber-light)">
          LIVE
        </MonoLabel>
      </div>

      <TweakRow label="레이아웃">
        <SegButtons
          value={tweaks.layoutVariant}
          onChange={(v) => update("layoutVariant", v)}
          options={[
            { v: "sidebar", l: "사이드" },
            { v: "sheet", l: "시트" },
            { v: "floating", l: "플로팅" },
          ]}
        />
      </TweakRow>

      <TweakRow label="필터 UI">
        <SegButtons
          value={tweaks.filterVariant}
          onChange={(v) => update("filterVariant", v)}
          options={[
            { v: "chips", l: "칩" },
            { v: "dropdowns", l: "드롭다운" },
            { v: "bottomSheet", l: "컴팩트" },
          ]}
        />
      </TweakRow>

      <TweakRow label="카드 밀도">
        <SegButtons
          value={tweaks.cardDensity}
          onChange={(v) => update("cardDensity", v)}
          options={[
            { v: "medium", l: "중간" },
            { v: "low", l: "낮음" },
          ]}
        />
      </TweakRow>

      <TweakRow label="포인트 컬러">
        <div className="flex gap-1.5">
          {POINT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => update("pointColor", c)}
              className={cls(
                "size-[28px] rounded-full cursor-pointer p-0",
                tweaks.pointColor === c
                  ? "border-2 border-fg"
                  : "border border-border-medium",
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </TweakRow>
    </div>
  );
}

function TweakRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-[11px] font-mono uppercase text-fg-3 mb-1.5 tracking-[0.5px]">
        {label}
      </div>
      {children}
    </div>
  );
}

function SegButtons({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
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

export default function MainApp() {
  const router = useRouter();
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksOn, setTweaksOn] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [transform, setTransform] = useState<MapTransform>({
    x: -180,
    y: -140,
    s: 0.62,
    animated: false,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    tx: number;
    ty: number;
  } | null>(null);

  // Edit mode postMessage protocol
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === "__activate_edit_mode") setTweaksOn(true);
      if (e.data.type === "__deactivate_edit_mode") setTweaksOn(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const updateTweak = (key: keyof Tweaks, value: string) => {
    setTweaks((t) => {
      const next = { ...t, [key]: value };
      window.parent.postMessage(
        { type: "__edit_mode_set_keys", edits: { [key]: value } },
        "*",
      );
      return next;
    });
  };

  // Apply point color CSS var
  useEffect(() => {
    document.documentElement.style.setProperty("--kg-amber", tweaks.pointColor);
  }, [tweaks.pointColor]);

  const toggleFilter = (id: string) => {
    setActiveFilters((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  // Filter + sort
  const cafes = useMemo<Cafe[]>(() => {
    let list = [...KG_CAFES];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          c.neigh.includes(query) ||
          c.tags.some((t) => t.includes(query)),
      );
    }
    for (const f of activeFilters) {
      if (f === "power") list = list.filter((c) => c.levels.power >= 3);
      if (f === "wifi") list = list.filter((c) => c.levels.wifi >= 3);
      if (f === "quiet") list = list.filter((c) => c.levels.quiet >= 3);
      if (f === "space") list = list.filter((c) => c.levels.space >= 3);
      if (f === "open24")
        list = list.filter((c) => c.tags.some((t) => t.includes("24시간")));
      if (f === "noLimit") list = list.filter((c) => c.limits.length === 0);
      if (f === "notebook")
        list = list.filter((c) => !c.limits.some((l) => l.includes("노트북")));
      if (f === "cheap") list = list.filter((c) => c.priceLevel <= 1);
    }
    const cmp: Record<string, (a: Cafe, b: Cafe) => number> = {
      stars: (a, b) => b.stars - a.stars,
      reviews: (a, b) => b.reviewCount - a.reviewCount,
    };
    list.sort(cmp[sortBy]);
    return list;
  }, [query, activeFilters, sortBy]);

  const selectCafe = (id: string) => {
    setSelectedId(id);
    setPreviewId(id);
    const c = KG_CAFES.find((x) => x.id === id);
    if (c && tweaks.layoutVariant === "sidebar") {
      const rect = document
        .getElementById("kg-map-area")
        ?.getBoundingClientRect();
      if (rect) {
        const s = 0.82;
        setTransform({
          x: rect.width / 2 - c.x * s,
          y: rect.height / 2 - c.y * s,
          s,
          animated: true,
        });
        setTimeout(() => setTransform((t) => ({ ...t, animated: false })), 400);
      }
    }
  };

  const openDetail = (id?: string) => {
    router.push(`/cafes/${id ?? selectedId}`);
  };

  // Map drag
  const onMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).closest("button")
    )
      return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setTransform((t) => ({
      ...t,
      x: dragRef.current!.tx + e.clientX - dragRef.current!.x,
      y: dragRef.current!.ty + e.clientY - dragRef.current!.y,
      animated: false,
    }));
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  const zoom = (dir: number) => {
    setTransform((t) => ({
      ...t,
      s: Math.max(0.4, Math.min(1.6, t.s + dir * 0.15)),
      animated: true,
    }));
    setTimeout(() => setTransform((t) => ({ ...t, animated: false })), 400);
  };

  const preview = previewId
    ? (KG_CAFES.find((c) => c.id === previewId) ?? null)
    : null;
  const useSidebar = tweaks.layoutVariant === "sidebar";
  const useFloating = tweaks.layoutVariant === "floating";
  const useSheet = tweaks.layoutVariant === "sheet";

  return (
    <div className="h-screen flex flex-col bg-bg">
      <TopNav query={query} setQuery={setQuery} />
      <FilterBar
        variant={tweaks.filterVariant}
        activeFilters={activeFilters}
        toggle={toggleFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        openDrawer={() => setDrawerOpen(true)}
        matchCount={cafes.length}
      />

      <div className="relative flex-1 flex min-h-0">
        {/* Sidebar */}

        <CafeSidebar
          cafes={cafes}
          selectedId={selectedId}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          selectCafe={selectCafe}
          cardDensity={tweaks.cardDensity}
          isOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        {/* Map area */}
        <div
          id="kg-map-area"
          ref={mapRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="flex-1 relative min-h-0 select-none"
        >
          <MapCanvas
            cafes={cafes}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={selectCafe}
            onHover={setHoveredId}
            transform={transform}
          />

          {/* Zoom controls */}
          <div className="absolute top-5 right-5 flex flex-col gap-2 z-20">
            <MapCtrlBtn onClick={() => zoom(1)} icon="plus" />
            <MapCtrlBtn onClick={() => zoom(-1)} icon="minus" />
            <div className="h-px bg-border-subtle" />
            <MapCtrlBtn
              onClick={() =>
                setTransform({ x: 180, y: 80, s: 0.62, animated: true })
              }
              icon="locate"
            />
          </div>

          {/* Legend */}
          <div
            className={cls(
              "absolute z-20 left-[20px] rounded-xl border border-border-subtle",
              "py-[10px] px-[14px] bg-white/95 backdrop-blur-sm shadow-card",
              useSheet ? "top-[20px] bottom-auto" : "bottom-[20px] top-auto",
            )}
          >
            <div className="font-mono text-[10px] font-semibold uppercase text-fg-3 mb-2 tracking-[0.5px]">
              카공 적합도
            </div>
            <div className="flex gap-3 text-[11.5px] text-fg-2">
              {[
                { colorClass: "bg-score-good", label: "85+ 우수" },
                { colorClass: "bg-kg-amber", label: "65-84 양호" },
                { colorClass: "bg-score-low", label: "<65" },
              ].map(({ colorClass, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-[5px]"
                >
                  <span
                    className={cls("size-[10px] rounded-full", colorClass)}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Floating preview */}
          {preview && (
            <FloatingCard
              cafe={preview}
              onClose={() => {
                setPreviewId(null);
                setSelectedId(null);
              }}
              onOpenDetail={() => openDetail(preview.id)}
            />
          )}

          {/* Bottom sheet */}
          {useSheet && (
            <BottomSheet
              cafes={cafes}
              selectedId={selectedId}
              setSelectedId={selectCafe}
              matchCount={cafes.length}
              onOpenDetail={openDetail}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          )}
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeFilters={activeFilters}
        toggle={toggleFilter}
        filters={KG_FILTERS}
      />

      {tweaksOn && <TweaksPanel tweaks={tweaks} update={updateTweak} />}
    </div>
  );
}
