import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  className?: string;
  onFocus?: () => void;
}

export default function SearchBar({
  query,
  setQuery,
  className,
  onFocus,
}: SearchBarProps) {
  return (
    <div
      className={cls(
        "items-center gap-2.5 rounded-full border border-border-medium bg-bg-muted px-4 py-[9px] text-fg-3 transition-all duration-150",
        "focus-within:border-kg-amber/40 focus-within:bg-white focus-within:shadow-button focus-within:text-fg-2",
        className,
      )}
    >
      <KGIcon name="search" size={16} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={onFocus}
        placeholder="카페 검색…"
        className="flex-1 bg-transparent border-none outline-none text-fg text-sm placeholder:text-fg-4"
      />
    </div>
  );
}
