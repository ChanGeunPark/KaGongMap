import { cls } from "@/lib/utils";
import React from "react";
import { TbHeart, TbHeartFilled } from "react-icons/tb";

interface LikeButtonProps {
  liked: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const LikeButton = ({ liked, onClick, disabled }: LikeButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cls(
        "size-[48px] rounded-full inline-flex items-center justify-center transition-colors",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        liked
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-50 text-fg-3 hover:bg-gray-100",
      )}
    >
      {liked ? (
        <TbHeartFilled size={20} />
      ) : (
        <TbHeart size={20} strokeWidth={2.2} />
      )}
    </button>
  );
};

export default LikeButton;
