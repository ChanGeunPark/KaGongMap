"use client";

import { cls } from "@/lib/utils";
import { useState, useEffect, useMemo, useRef } from "react";
import { FilterVariant, LayoutVariant, SortBy } from "@/types/cafe";
import { CafeMarker } from "@/types/db";
import { KG_FILTERS, FILTER_TAG_MAP } from "@/lib/data";
import { useCafeDetail, useCafeMarkers } from "@/lib/api/cafes";
import TopNav from "@/components/layout/TopNav";
import FilterBar from "@/components/layout/FilterBar";
import FilterDrawer from "@/components/layout/FilterDrawer";
import BottomSheet from "@/components/layout/BottomSheet";
import MapCanvas from "@/components/map/MapCanvas";
import MonoLabel from "@/components/ui/MonoLabel";
import KGIcon from "@/components/ui/KGIcon";
import CafeSidebar from "./layout/CafeSidebar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCreateUser, useUser } from "@/lib/api/user";
import { useUserStore } from "@/stores/userStore";
import BottomSheetModal from "./modal/BottomSheetModal";
import { CafeModalDetail } from "./cafe/detail/CafeModalDetail";

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
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksOn, setTweaksOn] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bounds, setBounds] = useState<{
    ne: naver.maps.LatLng;
    sw: naver.maps.LatLng;
  } | null>(null);

  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const {
    data: dbUser,
    isLoading: isUserLoading,
    isSuccess: isUserFetchSuccess,
    isError: isUserFetchError,
  } = useUser(userId);
  const { mutate: createUser } = useCreateUser();
  const setDbUser = useUserStore((state) => state.setDbUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const createUserRef = useRef(createUser);
  const createAttemptedForUserId = useRef<string | null>(null);
  const prevUserIdForBootstrap = useRef<string | null>(null);

  const profileImage = session?.user?.image ?? null;

  useEffect(() => {
    createUserRef.current = createUser;
  }, [createUser]);

  useEffect(() => {
    if (prevUserIdForBootstrap.current === userId) return;
    createAttemptedForUserId.current = null;
    prevUserIdForBootstrap.current = userId;
  }, [userId]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      clearUser();
    }
  }, [status, userId, clearUser]);

  useEffect(() => {
    setDbUser(dbUser ?? null);
  }, [dbUser, setDbUser]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    if (isUserLoading || !isUserFetchSuccess) return;
    if (isUserFetchError) return;
    if (dbUser !== null) return;

    if (createAttemptedForUserId.current === userId) return;
    createAttemptedForUserId.current = userId;

    createUserRef.current({
      userId,
      avatar_url: profileImage,
    });
  }, [
    status,
    userId,
    dbUser,
    isUserLoading,
    isUserFetchSuccess,
    isUserFetchError,
    profileImage,
  ]);

  const mapRef = useRef<HTMLDivElement>(null);

  // Tier 1: 지도 전체 마커 로딩
  const { data: allCafes = [], isLoading } = useCafeMarkers();

  // Tier 2: 선택된 카페 상세 (핀 클릭 시 1건만 온디맨드)
  const { data: selectedDetail, isLoading: detailLoading } =
    useCafeDetail(selectedId);

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

  // 필터 + 검색 + 정렬
  const cafes = useMemo<CafeMarker[]>(() => {
    let list = [...allCafes];

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tags.some((tag) => tag.includes(query)),
      );
    }

    for (const filterId of activeFilters) {
      const tag = FILTER_TAG_MAP[filterId];
      if (tag) list = list.filter((c) => c.tags.includes(tag));
    }

    if (sortBy === "score" || sortBy === "stars") {
      // 1순위: 좋아요 수, 2순위: 태그 개수
      list.sort((a, b) => {
        const likeDiff = b.like_count - a.like_count;
        if (likeDiff !== 0) return likeDiff;
        return b.tags.length - a.tags.length;
      });
    }

    return list;
  }, [allCafes, query, activeFilters, sortBy]);

  // bounds 필터: 현재 지도 화면에 보이는 카페만
  const visibleCafes = useMemo<CafeMarker[]>(() => {
    if (!bounds) return cafes;
    return cafes.filter(
      (c) =>
        c.lat >= bounds.sw.lat() &&
        c.lat <= bounds.ne.lat() &&
        c.lng >= bounds.sw.lng() &&
        c.lng <= bounds.ne.lng(),
    );
  }, [cafes, bounds]);

  const selectCafe = (id: string) => {
    setSelectedId(id);
    setPreviewId(id);
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
    <div className="h-screen flex flex-col bg-bg">
      <TopNav query={query} setQuery={setQuery} />
      <FilterBar
        variant={tweaks.filterVariant}
        activeFilters={activeFilters}
        toggle={toggleFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        openDrawer={() => setDrawerOpen(true)}
        matchCount={visibleCafes.length}
      />

      <div className="relative flex-1 flex min-h-0">
        {/* Sidebar */}

        <CafeSidebar
          cafes={visibleCafes}
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
          className="flex-1 relative min-h-0 select-none"
        >
          <MapCanvas
            cafes={cafes}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={selectCafe}
            onBoundsChange={setBounds}
          />

          {/* Legend */}
          <div
            className={cls(
              "absolute z-20 right-[20px] rounded-xl border border-border-subtle",
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
            showModalToggler={(next) => {
              setPreviewId(null);
              setSelectedId(null);
            }}
          >
            {previewMarker && (
              <CafeModalDetail
                cafe={previewMarker}
                detail={selectedDetail ?? null}
                detailLoading={detailLoading}
                onOpenDetail={() => {
                  router.push(`/cafes/${previewMarker.id}`);
                }}
                onClose={() => {
                  setPreviewId(null);
                  setSelectedId(null);
                }}
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
