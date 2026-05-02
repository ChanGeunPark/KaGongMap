import { CafeMarker } from "@/types/db";
import SearchHolder from "./SearchHolder";

interface DropDownItemProps {
  cafes: CafeMarker[];
  onSelect: (id: string) => void;
}

function DropDownItem({ cafes, onSelect }: DropDownItemProps) {
  return (
    <div className="absolute w-[calc(100%-24px)] mx-auto left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[60vh] overflow-y-auto kg-scroll rounded-md border border-border-medium bg-white shadow-overlay">
      {cafes.length === 0 ? (
        <div className="px-4 py-4 text-sm text-fg-3">검색 결과가 없습니다</div>
      ) : (
        <menu className="py-1">
          {cafes.map((cafe) => (
            <li key={cafe.id}>
              <SearchHolder
                id={cafe.id}
                name={cafe.name}
                address={cafe.address}
                onClick={onSelect}
              />
            </li>
          ))}
        </menu>
      )}
    </div>
  );
}

export default DropDownItem;
