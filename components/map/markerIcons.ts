import { CafeMarker } from "@/types/db";
import { getScore, getScoreTier } from "@/lib/scoring";

type ClusterIcon = {
  content: string;
  anchor: naver.maps.Point;
};

const TIER_COLOR: Record<"high" | "mid" | "low", string> = {
  high: "#22c55e",
  mid: "#f5a524",
  low: "#ef4444",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const USER_MARKER_HEADING_ID = "kg-user-marker-heading";

export function userPinHtml(heading?: number | null) {
  const headingStyle =
    heading == null
      ? "display:none;"
      : `transform: translate(-50%, -50%) rotate(${heading}deg);`;
  return `
    <div class="kg-user-marker" aria-hidden="true">
      <div
        id="${USER_MARKER_HEADING_ID}"
        class="kg-user-marker__heading"
        style="${headingStyle}"
      ></div>
      <div class="kg-user-marker__pulse"></div>
      <img
        class="kg-user-marker__cat"
        src="/images/marks/markDefaultCat.png"
        alt=""
      />
    </div>
  `;
}

function clusterHtml(count: number) {
  const size = count >= 20 ? 56 : count >= 10 ? 50 : 44;
  const bg = count >= 20 ? "#166534" : count >= 10 ? "#0f766e" : "#16a34a";
  return `
    <div
      style="
        width:${size}px; height:${size}px; border-radius:999px;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer;
        color:white; font-size:13px; font-weight:800;
        background:${bg};
        border:3px solid rgba(255,255,255,0.92);
        box-shadow:0 8px 20px rgba(15,23,42,0.25);
      "
    >
      ${count}
    </div>
  `;
}

export function clusterIcon(count: number): ClusterIcon {
  const size = count >= 20 ? 56 : count >= 10 ? 50 : 44;
  return {
    content: clusterHtml(count),
    anchor: new naver.maps.Point(size / 2, size / 2),
  };
}

export function cafePinHtml(cafe: CafeMarker, active: boolean) {
  const color = TIER_COLOR[getScoreTier(getScore(cafe.tags, "kagong"), "kagong")];
  const borderWidth = active ? 3 : 2;
  const shadow = active
    ? "0 6px 16px rgba(0,0,0,0.28)"
    : "0 2px 7px rgba(0,0,0,0.2)";

  return `
    <div
      id="overlay_${escapeHtml(cafe.id)}"
      style="
        display:inline-flex; align-items:center; position:relative;
        transform:translateX(-50%) translateY(-20px);
        cursor:pointer;
        padding:2px 12px 2px 4px;
        border-radius:999px;
        background-color:white;
        border:${borderWidth}px solid ${color};
        box-shadow:${shadow};
      "
    >
      <figure style="height:24px; width:0; overflow:hidden; transition:all 0.3s ease; margin:0;">
        <img
          style="height:24px; width:24px; object-fit:cover; border-radius:50%; pointer-events:none;"
          src="https://picsum.photos/id/103/300/300"
          alt=""
        />
      </figure>
      <p style="padding:0; margin:0; margin-left:12px; font-size:12px; font-weight:700; pointer-events:none; white-space:nowrap;">
        ${escapeHtml(cafe.name)}
      </p>
      <div style="position:absolute; left:50%; bottom:-${borderWidth - 1}px; transform:translateX(-50%) translateY(50%); pointer-events:none;">
        <div style="border-radius:0 0 3px 0; width:8px; height:8px; transform:rotate(45deg); background-color:white; border-right:${borderWidth}px solid ${color}; border-bottom:${borderWidth}px solid ${color};"></div>
      </div>
    </div>
  `;
}
