"use client";

import { useState } from "react";
import { TbSearch, TbCheck } from "react-icons/tb";
import { cls } from "@/lib/utils";
import { toast } from "react-toastify";
import type { PlaceSearchResult } from "@/types/kakao";
import type { ApiResponse } from "@/types/api";

interface AddressSearchProps {
  value: PlaceSearchResult | null;
  onChange: (place: PlaceSearchResult) => void;
  error?: string;
}

export default function AddressSearch({
  value,
  onChange,
  error,
}: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/kakao/address?query=${encodeURIComponent(query.trim())}`,
      );
      const data = (await response.json()) as ApiResponse<PlaceSearchResult[]>;

      if (data.ok) {
        setResults(data.data);
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

  return (
    <div className="flex flex-col gap-2">
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
          placeholder="카페명을 검색하세요"
          className={cls(
            "flex-1 rounded-xl border px-3.5 py-2.5 text-body bg-bg text-fg",
            "placeholder:text-fg-4 focus:outline-none transition-colors",
            error
              ? "border-error/70 focus:border-error"
              : "border-border-medium focus:border-kg-amber",
          )}
        />
        <button
          type="button"
          disabled={isSearching || !query.trim()}
          onClick={handleSearch}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-border-medium bg-bg px-3.5 py-2.5 text-small font-medium text-fg-2 hover:bg-gray-50 hover:border-border-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TbSearch size={14} strokeWidth={2} />
          {isSearching ? "검색 중…" : "검색"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto rounded-xl border border-border-medium bg-bg p-1.5">
          {results.map((place) => {
            const address = place.roadAddress || place.address;
            const isSelected = value?.id === place.id;
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => onChange(place)}
                className={cls(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  isSelected
                    ? "bg-kg-amber-light border-kg-amber"
                    : "border-transparent hover:bg-gray-50",
                )}
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span
                    className={cls(
                      "text-small font-semibold",
                      isSelected ? "text-kg-amber-deep" : "text-fg",
                    )}
                  >
                    {place.name}
                  </span>
                  <span className="text-[11px] text-fg-4 truncate">
                    {address}
                  </span>
                </div>
                {isSelected && (
                  <TbCheck
                    size={15}
                    strokeWidth={2.5}
                    className="shrink-0 text-kg-amber-deep"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
