"use client";

import { cls } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { SortBy } from "@/types/cafe";
import { KG_FILTERS } from "@/lib/data";
import { useCafeDetail, useCafeMarkers } from "@/lib/api/cafes";
import TopNav from "@/components/layout/topnav";
import FilterBar from "@/components/layout/FilterBar";
import FilterDrawer from "@/components/layout/FilterDrawer";
import BottomSheet from "@/components/layout/BottomSheet";
import MapCanvas from "@/components/map/MapCanvas";
import KGIcon from "@/components/ui/KGIcon";
import CafeSidebar from "./layout/CafeSidebar";
import { useRouter } from "next/navigation";
import BottomSheetModal from "./modal/BottomSheetModal";
import { CafeModalDetail } from "./cafe/detail/CafeModalDetail";
import { useCafeSelectionStore } from "@/stores/cafeSelectionStore";
import { DEFAULT_TWEAKS, Tweaks, TweaksPanel } from "@/components/tweaks";
import { useEditModeBridge } from "@/hooks/useEditModeBridge";
import { useFilteredCafes } from "@/hooks/useFilteredCafes";
import { track } from "@/lib/firebase/analytics";

export default function MainApp() {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bounds, setBounds] = useState<{
    ne: naver.maps.LatLng;
    sw: naver.maps.LatLng;
  } | null>(null);
  const { selectedId, previewId, openCafePreview, closeCafePreview } =
    useCafeSelectionStore();

  const { tweaksOn, postTweakEdit } = useEditModeBridge();

  const mapRef = useRef<HTMLDivElement>(null);

  // Tier 1: 지도 전체 마커 로딩
  const { data: allCafes = [], isLoading } = useCafeMarkers();

  // Tier 2: 선택된 카페 상세 (핀 클릭 시 1건만 온디맨드)
  const { data: selectedDetail, isLoading: detailLoading } =
    useCafeDetail(selectedId);

  const updateTweak = (key: keyof Tweaks, value: string) => {
    setTweaks((t) => ({ ...t, [key]: value }));
    postTweakEdit(key, value);
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--kg-amber", tweaks.pointColor);
  }, [tweaks.pointColor]);

  const toggleFilter = (id: string) => {
    setActiveFilters((s) => {
      const n = new Set(s);
      const wasActive = n.has(id);
      if (wasActive) {
        n.delete(id);
      } else {
        n.add(id);
      }
      track("filter_apply", {
        filter_id: id,
        action: wasActive ? "remove" : "add",
        active_filters: Array.from(n),
        active_count: n.size,
      });
      return n;
    });
  };

  const { cafes, visibleCafes } = useFilteredCafes(
    allCafes,
    activeFilters,
    sortBy,
    bounds,
  );

  const selectCafe = (id: string) => {
    openCafePreview(id);
  };

  const handleMarkerClick = (id: string) => {
    const c = allCafes.find((x) => x.id === id);
    track("cafe_marker_click", {
      cafe_id: id,
      cafe_name: c?.name,
      tag_count: c?.tags.length ?? 0,
    });
    openCafePreview(id);
  };

  const handleSearchSelect = (id: string) => {
    const c = allCafes.find((x) => x.id === id);
    track("cafe_search_select", { cafe_id: id, cafe_name: c?.name });
    openCafePreview(id);
  };

  // FloatingCard는 Tier 1 데이터로 즉시 표시, 상세 로딩 후 교체
  const previewMarker = previewId
    ? (allCafes.find((c) => c.id === previewId) ?? null)
    : null;

  const useSheet = tweaks.layoutVariant === "sheet";
  const router = useRouter();

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

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col">
      <TopNav onSelectCafe={handleSearchSelect} />

      <div className="relative flex-1 flex min-h-0">
        <FilterBar
          variant={tweaks.filterVariant}
          activeFilters={activeFilters}
          toggle={toggleFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          openDrawer={() => setDrawerOpen(true)}
          matchCount={visibleCafes.length}
        />

        {/* Sidebar */}
        <CafeSidebar
          cafes={visibleCafes}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          cardDensity={tweaks.cardDensity}
          isOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        {/* Map area */}
        <div
          id="kg-map-area"
          ref={mapRef}
          className="flex-1 relative min-h-0 select-none"
        >
          <MapCanvas
            cafes={cafes}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={handleMarkerClick}
            onBoundsChange={setBounds}
          />

          {/* Legend */}
          <div
            className={cls(
              "absolute z-[110] right-[20px] rounded-lg border border-border-subtle",
              "py-[10px] px-[14px] bg-white/95 backdrop-blur-sm shadow-card",
              useSheet ? "top-[20px] bottom-auto" : "bottom-[20px] top-auto",
            )}
          >
            <div className="font-mono text-[10px] font-semibold uppercase text-fg-3 mb-2 tracking-[0.5px]">
              카공 적합도
            </div>
            <div className="flex gap-3 text-[11.5px] text-fg-2">
              {[
                { colorClass: "bg-score-good", label: "태그 7+ 우수" },
                { colorClass: "bg-kg-amber", label: "태그 4+ 양호" },
                { colorClass: "bg-score-low", label: "태그 3개 이하" },
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

          {/* Floating preview — Tier 1로 즉시 표시, Tier 2 로딩 완료 시 상세 반영 */}

          <BottomSheetModal
            content={{
              title: "카페 정보",
              content: "카페 정보를 확인해주세요.",
              actions: [{ label: "확인", onClick: () => {} }],
            }}
            widthThreshold={2000}
            showModal={previewMarker !== null}
            showModalToggler={closeCafePreview}
          >
            {previewMarker && (
              <CafeModalDetail
                cafe={previewMarker}
                detail={selectedDetail ?? null}
                detailLoading={detailLoading}
                onOpenDetail={() => {
                  router.push(`/cafes/${previewMarker.id}`);
                }}
                onClose={closeCafePreview}
              />
            )}
          </BottomSheetModal>

          {/* Bottom sheet */}
          {useSheet && (
            <BottomSheet
              cafes={cafes}
              selectedId={selectedId}
              setSelectedId={selectCafe}
              matchCount={visibleCafes.length}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onOpenDetail={() => {}}
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
        onReset={() => setActiveFilters(new Set())}
      />

      {tweaksOn && <TweaksPanel tweaks={tweaks} update={updateTweak} />}
    </div>
  );
}
