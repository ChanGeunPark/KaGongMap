"use client";

import { useState } from "react";
import { TbSearch, TbCheck, TbSparkles } from "react-icons/tb";
import { toast } from "react-toastify";
import type { ApiResponse } from "@/types/api";
import type { PlaceSearchResult } from "@/types/kakao";

interface KakaoSearchPanelProps {
  onPick: (place: PlaceSearchResult) => void | Promise<void>;
  disabled?: boolean;
}

export default function KakaoSearchPanel({
  onPick,
  disabled,
}: KakaoSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [selected, setSelected] = useState<PlaceSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("카페명 또는 키워드를 입력해주세요.");
      return;
    }
    try {
      setIsSearching(true);
      const res = await fetch(
        `/api/kakao/address?query=${encodeURIComponent(query.trim())}`,
      );
      const data = (await res.json()) as ApiResponse<PlaceSearchResult[]>;
      if (data.ok) {
        setResults(data.data);
        setSelected(null);
        if (data.data.length === 0) toast.info("검색 결과가 없습니다.");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleStart = async () => {
    if (!selected) return;
    setIsStarting(true);
    try {
      await onPick(selected);
      setSelected(null);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">카카오에서 카페 검색</h2>
        <p className="text-xs text-gray-500 mt-1">
          결과에서 한 곳을 선택하고 <strong>AI 조사 시작</strong>을 누르면 큐에
          추가됩니다.
        </p>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            type="text"
            placeholder="예) 강남 스타벅스, 망원동 카페"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <TbSearch size={16} />
            {isSearching ? "검색 중…" : "검색"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-1.5">
            {results.map((place) => {
              const address = place.roadAddress || place.address;
              const isSelected = selected?.id === place.id;
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => setSelected(place)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-amber-50 border-amber-300"
                      : "border-transparent hover:bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isSelected ? "text-amber-700" : "text-gray-900"
                      }`}
                    >
                      {place.name}
                    </span>
                    <span className="text-[11px] text-gray-500 truncate">
                      {address}
                    </span>
                  </div>
                  {isSelected && (
                    <TbCheck
                      size={16}
                      strokeWidth={2.5}
                      className="shrink-0 text-amber-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-gray-500 truncate">
            {selected ? (
              <>
                선택됨:{" "}
                <strong className="text-gray-900">{selected.name}</strong> ·{" "}
                {selected.roadAddress || selected.address}
              </>
            ) : (
              <span className="text-gray-400">선택된 카페가 없습니다.</span>
            )}
          </p>
          <button
            type="button"
            onClick={handleStart}
            disabled={!selected || disabled || isStarting}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <TbSparkles size={16} />
            {isStarting ? "추가 중…" : "AI 조사 시작"}
          </button>
        </div>
      </div>
    </section>
  );
}
