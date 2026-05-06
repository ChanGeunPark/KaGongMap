"use client";

export type BridgeStatus = "connecting" | "connected" | "disconnected";

const STYLE: Record<BridgeStatus, { dot: string; text: string; label: string }> = {
  connecting: {
    dot: "bg-amber-400 animate-pulse",
    text: "text-amber-700",
    label: "연결 중…",
  },
  connected: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    label: "브릿지 연결됨",
  },
  disconnected: {
    dot: "bg-rose-500",
    text: "text-rose-700",
    label: "연결 끊김",
  },
};

export default function BridgeStatusBadge({
  status,
  message,
}: {
  status: BridgeStatus;
  message: string | null;
}) {
  const style = STYLE[status];
  return (
    <div
      title={message ?? undefined}
      className={`shrink-0 flex items-center gap-1.5 text-xs font-medium ${style.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {style.label}
    </div>
  );
}
