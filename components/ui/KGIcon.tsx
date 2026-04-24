import React from "react";

type IconName =
  | "plug"
  | "wifi"
  | "volume"
  | "layout"
  | "clock"
  | "check"
  | "laptop"
  | "coin"
  | "search"
  | "pin"
  | "star"
  | "starFill"
  | "heart"
  | "heartFill"
  | "chev"
  | "chevDown"
  | "chevLeft"
  | "close"
  | "arrow"
  | "plus"
  | "minus"
  | "sliders"
  | "locate"
  | "walk"
  | "users"
  | "bolt"
  | "ban"
  | "info"
  | "share"
  | "phone"
  | "camera"
  | "flag"
  | "sparkle"
  | "menu"
  | "list"
  | "bookmark"
  | "trending"
  | "mapIcon"
  | "bell"
  | "pen"
  | "edit"
  | "trash";

interface KGIconProps {
  name: IconName | string;
  size?: number;
  stroke?: number;
}

const PATHS: Record<string, React.ReactNode> = {
  plug: (
    <>
      <path d="M9 2v5M15 2v5" />
      <path d="M5 7h14v5a5 5 0 01-5 5h-4a5 5 0 01-5-5V7z" />
      <path d="M12 17v5" />
    </>
  ),
  wifi: (
    <>
      <path d="M5 12a10 10 0 0114 0" />
      <path d="M8.5 15.5a5 5 0 017 0" />
      <circle cx="12" cy="19" r="1.2" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M16 9a4 4 0 010 6" />
    </>
  ),
  layout: (
    <>
      <rect width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" />,
  laptop: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M2 20h20" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9h-3.5a1.5 1.5 0 000 3H14a1.5 1.5 0 010 3H10M12 7v10" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  star: (
    <path d="M12 3l2.7 6.2 6.3.6-4.8 4.5 1.4 6.7L12 17.8 6.4 21l1.4-6.7L3 9.8l6.3-.6z" />
  ),
  starFill: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 3l2.7 6.2 6.3.6-4.8 4.5 1.4 6.7L12 17.8 6.4 21l1.4-6.7L3 9.8l6.3-.6z"
    />
  ),
  heart: (
    <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
  ),
  heartFill: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"
    />
  ),
  chev: <path d="M9 6l6 6-6 6" />,
  chevDown: <path d="M6 9l6 6 6-6" />,
  chevLeft: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  arrow: <path d="M5 12h14M13 5l7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  sliders: (
    <>
      <path d="M4 6h10M20 6h0" />
      <path d="M4 12h4M14 12h6" />
      <path d="M4 18h12M20 18h0" />
      <circle cx="17" cy="6" r="2" />
      <circle cx="11" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4" r="2" />
      <path d="M8 21l2-5 3-3-1-4-3 2v3M13 13l3 2 1 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0113 0" />
      <path d="M16 8a3 3 0 010 6M22 20a5 5 0 00-3.5-4.8" />
    </>
  ),
  bolt: <path d="M13 2L3 14h7l-1 8 10-12h-7z" />,
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L7.9 9.8a16 16 0 006 6l1.4-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
  ),
  camera: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6l2-3h4l2 3" />
    </>
  ),
  flag: <path d="M5 22V3h12l-2 4 2 4H5" />,
  sparkle: <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  trending: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M21 7v5h-5" />
    </>
  ),
  mapIcon: (
    <>
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9z" />
      <path d="M10 21a2 2 0 004 0" />
    </>
  ),
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" />
    </>
  ),
};

export default function KGIcon({ name, size = 18, stroke = 1.8 }: KGIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {PATHS[name]}
    </svg>
  );
}
