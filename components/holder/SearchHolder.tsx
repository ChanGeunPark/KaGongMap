interface SearchHolderProps {
  id: string;
  name: string;
  address: string;
  onClick: (id: string) => void;
}

function SearchHolder({ id, name, address, onClick }: SearchHolderProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="block w-full text-left hover:bg-gray-50 transition-colors duration-150"
    >
      <div className="flex flex-col gap-0.5 px-4 py-3">
        <span className="text-sm font-semibold text-fg truncate">{name}</span>
        {address && (
          <span className="text-xs text-fg-3 truncate">{address}</span>
        )}
      </div>
    </button>
  );
}

export default SearchHolder;
