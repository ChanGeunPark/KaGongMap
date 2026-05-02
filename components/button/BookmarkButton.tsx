"use client";

import { TbBookmark, TbBookmarkFilled } from "react-icons/tb";
import { cls } from "@/lib/utils";

interface BookmarkButtonProps {
  bookmarked: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function BookmarkButton({
  bookmarked,
  onClick,
  disabled,
}: BookmarkButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={bookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      className={cls(
        "size-[48px] rounded-full inline-flex items-center justify-center cursor-pointer transition-colors",
        "disabled:cursor-default disabled:opacity-60",
        bookmarked
          ? "bg-kg-amber-light text-kg-amber-deep hover:bg-kg-amber-light/80"
          : "bg-gray-50 text-fg-3 hover:bg-gray-100",
      )}
    >
      {bookmarked ? (
        <TbBookmarkFilled size={20} />
      ) : (
        <TbBookmark size={20} strokeWidth={2.2} />
      )}
    </button>
  );
}
