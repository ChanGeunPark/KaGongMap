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
import { useEditModeBridge } from "@/hooks/device/useEditModeBridge";
import { useFilteredCafes } from "@/hooks/map/useFilteredCafes";
import { track } from "@/lib/firebase/analytics";
import { nativeBridge } from "@/lib/native/bridge";
import {
  setBrowserLocationPermission,
  useLocationPermission,
} from "@/hooks/geolocation/useLocationPermission";
import { useNativeStore } from "@/stores/nativeStore";
import { toast } from "react-toastify";

const LOCATION_PERMISSION_REQUEST_TIMEOUT_MS = 10_000;

export default function MainApp() {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const locationPermission = useLocationPermission();
  const [locationPermissionBusy, setLocationPermissionBusy] = useState(false);
  const [bounds, setBounds] = useState<{
    ne: naver.maps.LatLng;
    sw: naver.maps.LatLng;
  } | null>(null);
  const isWebView = useNativeStore((s) => s.isWebView);
  const { selectedId, previewId, openCafePreview, closeCafePreview } =
    useCafeSelectionStore();

  const { tweaksOn, postTweakEdit } = useEditModeBridge();

  const mapRef = useRef<HTMLDivElement>(null);
  const locationPermissionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

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

  // LOCATION_RESPONSE 의 권한/좌표 store 반영은 NativeBridgeInit 이 담당.
  // 여기선 사용자 클릭 → REQUEST_LOCATION 의 라이프사이클(busy/timeout/toast)만 처리.
  useEffect(() => {
    if (!isWebView) return;

    return nativeBridge.on("LOCATION_RESPONSE", (payload) => {
      if (!locationPermissionTimeoutRef.current) return; // 우리가 띄운 요청이 아니면 무시
      clearTimeout(locationPermissionTimeoutRef.current);
      locationPermissionTimeoutRef.current = null;
      setLocationPermissionBusy(false);

      if (payload.status === "granted") {
        toast.success("위치 권한이 허용되었어요.");
        return;
      }

      if (payload.status === "denied") {
        toast.error("앱 설정에서 위치 권한을 허용해주세요.");
        return;
      }

      if (payload.status === "unsupported") {
        toast.error("앱에서 위치 서비스를 사용할 수 없어요.");
      }
    });
  }, [isWebView]);

  useEffect(
    () => () => {
      if (locationPermissionTimeoutRef.current) {
        clearTimeout(locationPermissionTimeoutRef.current);
      }
    },
    [],
  );

  const requestLocationPermission = () => {
    if (isWebView) {
      if (locationPermissionTimeoutRef.current) {
        clearTimeout(locationPermissionTimeoutRef.current);
        locationPermissionTimeoutRef.current = null;
      }

      setLocationPermissionBusy(true);
      const sent = nativeBridge.send({
        type: "REQUEST_LOCATION",
        payload: { highAccuracy: true },
      });

      if (!sent) {
        setLocationPermissionBusy(false);
        toast.error("앱 연결이 끊어졌어요. 잠시 후 다시 시도해주세요.");
        return;
      }

      locationPermissionTimeoutRef.current = setTimeout(() => {
        setLocationPermissionBusy(false);
        useNativeStore.getState().setNativeLocationPermission("unknown");
        toast.error("위치 권한 응답이 없어요. 앱 설정을 확인해주세요.");
        locationPermissionTimeoutRef.current = null;
      }, LOCATION_PERMISSION_REQUEST_TIMEOUT_MS);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setBrowserLocationPermission("unsupported");
      toast.error("브라우저가 위치 권한을 지원하지 않습니다.");
      return;
    }

    setLocationPermissionBusy(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setBrowserLocationPermission("granted");
        setLocationPermissionBusy(false);
        toast.success("위치 권한이 허용되었어요.");
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        setBrowserLocationPermission(denied ? "denied" : "prompt");
        setLocationPermissionBusy(false);
        toast.error(
          denied
            ? "브라우저 설정에서 위치 권한을 허용해주세요."
            : "위치 권한을 허용해주세요.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  };

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

          {locationPermission !== "checking" &&
            locationPermission !== "granted" && (
              <button
                className={cls(
                  "absolute z-110 right-[20px] rounded-lg border border-border-subtle",
                  "py-[10px] px-[14px] bg-white/80 backdrop-blur-sm shadow-card",
                  "bottom-[80px] top-auto cursor-pointer disabled:cursor-wait disabled:opacity-70",
                )}
                onClick={requestLocationPermission}
                disabled={locationPermissionBusy}
              >
                <div className="font-mono text-[10px] font-semibold uppercase text-fg-3 tracking-[0.5px] text-red-700">
                  {locationPermissionBusy
                    ? "위치 권한을 요청하는 중입니다"
                    : "!! 위치 정보 권한이 켜져 있지 않습니다"}
                </div>
              </button>
            )}

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
                { colorClass: "bg-score-good", label: "점수 10+ 우수" },
                { colorClass: "bg-kg-amber", label: "점수 5+ 양호" },
                { colorClass: "bg-score-low", label: "점수 4 이하" },
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
