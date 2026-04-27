'use client';

import { useState } from 'react';
import { CafeMarker } from '@/types/db';
import { SortBy } from '@/types/cafe';
import CafeCard from '@/components/cafe/CafeCard';

interface BottomSheetProps {
  cafes: CafeMarker[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  matchCount: number;
  onOpenDetail: (id?: string) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
}

export default function BottomSheet({
  cafes,
  selectedId,
  setSelectedId,
  matchCount,
  onOpenDetail,
  sortBy,
  setSortBy,
}: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const selected = cafes.find((c) => c.id === selectedId);

  return (
    <div
      className="absolute left-0 right-0 bottom-0 z-40 bg-bg rounded-tl-3xl rounded-tr-3xl border border-border-subtle border-b-0 flex flex-col overflow-hidden"
      style={{
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        maxHeight: expanded ? '70%' : selected ? 260 : 180,
        transition: 'max-height 300ms var(--ease-out)',
      }}
    >
      {/* Drag handle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-3 bg-transparent border-none cursor-pointer w-full"
        style={{ padding: '12px 20px' }}
      >
        <div className="w-10 h-1 rounded-full bg-border-medium mx-auto" />
      </button>

      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '0 20px 14px' }}
      >
        <div>
          <div className="text-body font-semibold" style={{ letterSpacing: '-0.2px' }}>
            카공 카페 {matchCount}개
          </div>
          <div className="text-mono text-fg-3 mt-0.5">이 지역에서 찾은 결과</div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="text-mono font-medium rounded-full border border-border-medium bg-bg text-fg cursor-pointer"
          style={{ padding: '5px 8px', fontFamily: 'var(--font-sans)' }}
        >
          <option value="score">적합도순</option>
          <option value="distance">거리순</option>
          <option value="stars">별점순</option>
        </select>
      </div>

      {/* List */}
      <div
        className="overflow-y-auto flex flex-col gap-2.5 kg-scroll"
        style={{ padding: '0 20px 20px' }}
      >
        {cafes.map((c) => (
          <CafeCard
            key={c.id}
            cafe={c}
            compact
            selected={c.id === selectedId}
            onHover={() => setSelectedId(c.id)}
            onClick={() => onOpenDetail(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
