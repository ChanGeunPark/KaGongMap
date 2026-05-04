"use client";

import { useState } from "react";
import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";
import { CafeWithDetail } from "@/types/db";

function SidebarMap({ cafe }: { cafe: CafeWithDetail }) {
  return (
    <div className="h-[220px] rounded-2xl overflow-hidden border border-border-subtle relative bg-[var(--map-bg)]">
      <svg width="100%" height="100%" viewBox="0 0 400 220">
        <rect width="400" height="220" fill="var(--map-bg)" />
        <g stroke="var(--map-road)" strokeWidth="16" fill="none">
          <path d="M 0 110 L 400 110" />
          <path d="M 200 0 L 200 220" />
        </g>
        <g stroke="var(--map-road-edge)" strokeWidth="0.6" opacity="0.6">
          {[40, 80, 140, 180].map((y) => (
            <path key={y} d={`M 0 ${y} L 400 ${y}`} />
          ))}
          {[60, 100, 140, 260, 300, 340].map((x) => (
            <path key={x} d={`M ${x} 0 L ${x} 220`} />
          ))}
        </g>
        <text
          x="200"
          y="100"
          textAnchor="middle"
          fontSize="9"
          fill="#5C6270"
          fontWeight="500"
        >
          테헤란로
        </text>
        <text
          x="210"
          y="60"
          fontSize="9"
          fill="#5C6270"
          fontWeight="500"
          transform="rotate(90 210 60)"
        >
          강남대로
        </text>
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1.5 bg-fg text-kg-amber px-3 py-[5px] rounded-full border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.2)] text-xs font-bold">
        <span className="w-5 h-5 rounded-full bg-kg-amber text-fg inline-flex items-center justify-center text-[10px] font-extrabold">
          {cafe.tags.length}
        </span>
        {cafe.name}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="text-fg-3 pt-0.5 shrink-0">
        <KGIcon name={icon} size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[11px] text-fg-3 uppercase tracking-[0.5px] mb-[3px]">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CafeInfoSidebar({ cafe }: { cafe: CafeWithDetail }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="lg:sticky lg:top-[88px]">
      <div className="bg-bg border border-border-subtle rounded-[20px] p-6 shadow-[var(--shadow-card)] mb-4">
        {/* 액션 버튼 */}
        <div className="flex gap-2 mb-3.5">
          <button className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-full bg-fg text-bg border-none cursor-pointer text-sm font-semibold">
            <KGIcon name="pin" size={14} stroke={2.2} /> 길찾기
          </button>
          <button
            onClick={() => setSaved((s) => !s)}
            className={cls(
              "w-11 h-11 rounded-full border cursor-pointer inline-flex items-center justify-center transition-colors duration-150",
              saved
                ? "bg-kg-amber-light text-kg-amber-deep border-[rgba(245,165,36,0.3)]"
                : "bg-bg text-fg-2 border-border-medium",
            )}
          >
            <KGIcon name={saved ? "heartFill" : "heart"} size={16} />
          </button>
          <button className="w-11 h-11 rounded-full bg-bg text-fg-2 border border-border-medium cursor-pointer inline-flex items-center justify-center">
            <KGIcon name="share" size={16} />
          </button>
        </div>

        <SidebarMap cafe={cafe} />

        {/* 정보 항목 */}
        <div className="flex flex-col gap-3.5 mt-4.5 text-[13.5px]">
          <InfoRow icon="clock" label="영업시간">
            <div className="text-fg font-medium whitespace-pre-line">
              {cafe.hours}
            </div>
            {cafe.hours && (
              <div className="text-xs text-score-good mt-0.5 whitespace-pre-line">
                ● 영업시간 {cafe.hours}
              </div>
            )}
          </InfoRow>
          <InfoRow icon="pin" label="주소">
            <div className="text-fg font-medium">{cafe.address}</div>
          </InfoRow>
          <InfoRow icon="coin" label="최소 주문 금액">
            <div className="text-fg font-medium">
              {cafe.min_order_amount != null
                ? `${cafe.min_order_amount.toLocaleString("ko-KR")}원`
                : "정보 없음"}
            </div>
          </InfoRow>
          <InfoRow icon="users" label="좌석 수">
            <div className="text-fg font-medium">0</div>
          </InfoRow>
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-[5px] mt-4.5 pt-4.5 border-t border-border-subtle">
          {cafe.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-fg-2 font-medium"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

      <button className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-bg text-fg-2 border border-border-medium cursor-pointer text-[13px] font-medium">
        <KGIcon name="flag" size={13} /> 잘못된 정보 제보
      </button>
    </div>
  );
}
