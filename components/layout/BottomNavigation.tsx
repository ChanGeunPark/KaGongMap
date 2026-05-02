"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";

interface NavigationItem {
  id: "home" | "community" | "settings";
  name: string;
  link: string;
  icon: string;
  upcoming?: boolean;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "home",
    name: "Home",
    link: "/",
    icon: "mapIcon",
  },
  {
    id: "community",
    name: "커뮤니티",
    link: "/community",
    icon: "messages",
    upcoming: true,
  },
  {
    id: "settings",
    name: "세팅",
    link: "/mypage",
    icon: "sliders",
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <nav
        aria-label="하단 네비게이션"
        className={cls(
          "fixed inset-x-0 bottom-0 z-60 border-t border-border-subtle bg-white/92 backdrop-blur-xl",
          "pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.05)]",
        )}
      >
        <div className="mx-auto grid h-[60px] max-w-[520px] grid-cols-3 px-3">
          {NAVIGATION_ITEMS.map((item) => (
            <BottomNavigationItem
              key={item.id}
              item={item}
              active={isActiveNavigation(pathname, item)}
            />
          ))}
        </div>
      </nav>
      <div className="h-[60px] shrink-0" aria-hidden="true" />
    </>
  );
}

function isActiveNavigation(pathname: string, item: NavigationItem) {
  if (item.id === "home") return pathname === "/";
  if (item.id === "settings") return pathname.startsWith("/mypage");
  return pathname.startsWith(item.link);
}

function BottomNavigationItem({
  item,
  active,
}: {
  item: NavigationItem;
  active: boolean;
}) {
  const content = (
    <>
      <span
        className={cls(
          "relative inline-flex size-8 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-main-light text-main-deep"
            : "bg-transparent text-fg-4 group-hover:bg-gray-100 group-hover:text-fg-2",
          item.upcoming && "text-fg-4 group-hover:bg-transparent",
        )}
      >
        <KGIcon name={item.icon} size={20} stroke={active ? 2.2 : 1.9} />
        {item.upcoming && (
          <span className="absolute -right-2 -top-1 rounded-full bg-kg-amber px-1.5 py-[1px] text-[9px] font-bold leading-4 text-fg">
            예정
          </span>
        )}
      </span>
      {/* <span
        className={cls(
          "mt-1 text-[11px] font-bold leading-none transition-colors",
          active ? "text-main-deep" : "text-fg-4 group-hover:text-fg-2",
          item.upcoming && "text-fg-4",
        )}
      >
        {item.name}
      </span> */}
    </>
  );

  if (item.upcoming) {
    return (
      <button
        type="button"
        disabled
        aria-label={`${item.name} 오픈예정`}
        className="group flex h-full cursor-default flex-col items-center justify-center"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.link}
      aria-current={active ? "page" : undefined}
      className="group flex h-full flex-col items-center justify-center"
    >
      {content}
    </Link>
  );
}
