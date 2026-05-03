import { cls } from "@/lib/utils";

interface MenuItemProps {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}

export default function MenuItem({
  children,
  onClick,
  tone = "default",
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cls(
        "w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        tone === "danger"
          ? "text-error hover:bg-red-50"
          : "text-fg-2 hover:bg-gray-50",
      )}
    >
      {children}
    </button>
  );
}
