"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/firebase/analytics";

export default function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const search = searchParams?.toString();
    const fullPath = search ? `${pathname}?${search}` : pathname;
    track("page_view", {
      page_path: fullPath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
