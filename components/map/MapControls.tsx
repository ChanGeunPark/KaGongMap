"use client";

import { cls } from "@/lib/utils";
import { useAuthGateStore, useBookmarkModalStore } from "@/stores/modalStore";
import { useSession } from "next-auth/react";
import { TbBookmarkFilled } from "react-icons/tb";
import KGIcon from "../ui/KGIcon";

interface MapControlsProps {
  isLocationEnabled: boolean;
  locationTitle: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

export function MapControls({
  isLocationEnabled,
  locationTitle,
  onZoomIn,
  onZoomOut,
  onLocate,
}: MapControlsProps) {
  return (
    <div className="absolute top-5 right-5 flex flex-col gap-2 z-[120]">
      <MapCtrlBtn onClick={onZoomIn} icon="plus" />
      <MapCtrlBtn onClick={onZoomOut} icon="minus" />
      <div className="h-px bg-border-subtle" />
      <MapCtrlBtn
        onClick={onLocate}
        icon="locate"
        active={isLocationEnabled}
        title={locationTitle}
      />
      <BookmarkButton />
    </div>
  );
}

function BookmarkButton() {
  const { setShowBookmarkModal } = useBookmarkModalStore();
  const { openAuthGate } = useAuthGateStore();
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  return (
    <button
      type="button"
      onClick={() => {
        if (!isAuthed) {
          openAuthGate();
          return;
        }
        setShowBookmarkModal(true);
      }}
      className={cls(
        "size-8 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors",
        "bg-white border border-border-subtle text-fg-3 hover:bg-gray-100",
      )}
    >
      <TbBookmarkFilled size={20} />
    </button>
  );
}

function MapCtrlBtn({
  icon,
  onClick,
  active = false,
  title,
}: {
  icon: string;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-xl border inline-flex items-center justify-center cursor-pointer shadow-card ${
        active
          ? "bg-main text-white border-accent"
          : "bg-bg text-fg-2 border-border-subtle"
      }`}
    >
      <KGIcon name={icon} size={16} stroke={2} />
    </button>
  );
}
