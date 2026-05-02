import type { IconType } from "react-icons";
import {
  TbAdjustmentsHorizontal,
  TbArrowRight,
  TbBan,
  TbBell,
  TbBolt,
  TbBookmark,
  TbCamera,
  TbCheck,
  TbChevronDown,
  TbChevronLeft,
  TbChevronRight,
  TbCircle,
  TbClock,
  TbCoin,
  TbCurrentLocation,
  TbDeviceLaptop,
  TbFlag,
  TbHeart,
  TbHeartFilled,
  TbHome2,
  TbInfoCircle,
  TbLayoutGrid,
  TbList,
  TbLoader2,
  TbMap2,
  TbMapPin,
  TbMenu2,
  TbMinus,
  TbPencil,
  TbPhone,
  TbPlug,
  TbPlus,
  TbSearch,
  TbSettings,
  TbShare3,
  TbSparkles,
  TbStar,
  TbStarFilled,
  TbTrash,
  TbTrendingUp,
  TbUsers,
  TbVolume,
  TbWalk,
  TbWifi,
  TbX,
} from "react-icons/tb";

type IconName =
  | "home"
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
  | "trash"
  | "settings"
  | "loader";

interface KGIconProps {
  name: IconName | string;
  size?: number;
  stroke?: number;
}

const ICONS: Record<string, IconType> = {
  home: TbHome2,
  plug: TbPlug,
  wifi: TbWifi,
  volume: TbVolume,
  layout: TbLayoutGrid,
  clock: TbClock,
  check: TbCheck,
  laptop: TbDeviceLaptop,
  coin: TbCoin,
  search: TbSearch,
  pin: TbMapPin,
  star: TbStar,
  starFill: TbStarFilled,
  heart: TbHeart,
  heartFill: TbHeartFilled,
  chev: TbChevronRight,
  chevDown: TbChevronDown,
  chevLeft: TbChevronLeft,
  close: TbX,
  arrow: TbArrowRight,
  plus: TbPlus,
  minus: TbMinus,
  sliders: TbAdjustmentsHorizontal,
  locate: TbCurrentLocation,
  walk: TbWalk,
  users: TbUsers,
  bolt: TbBolt,
  ban: TbBan,
  info: TbInfoCircle,
  share: TbShare3,
  phone: TbPhone,
  camera: TbCamera,
  flag: TbFlag,
  sparkle: TbSparkles,
  menu: TbMenu2,
  list: TbList,
  bookmark: TbBookmark,
  trending: TbTrendingUp,
  mapIcon: TbMap2,
  bell: TbBell,
  pen: TbPencil,
  edit: TbPencil,
  trash: TbTrash,
  settings: TbSettings,
  loader: TbLoader2,
};

export default function KGIcon({ name, size = 18, stroke = 1.8 }: KGIconProps) {
  const Icon = ICONS[name] ?? TbCircle;

  return (
    <Icon
      size={size}
      strokeWidth={stroke}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    />
  );
}
