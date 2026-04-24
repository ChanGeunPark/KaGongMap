import { FilterItem } from '@/types/cafe';
import KGIcon from '@/components/ui/KGIcon';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  activeFilters: Set<string>;
  toggle: (id: string) => void;
  filters: FilterItem[];
}

export default function FilterDrawer({
  open,
  onClose,
  activeFilters,
  toggle,
  filters,
}: FilterDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-bg mx-auto rounded-tl-3xl rounded-tr-3xl"
        style={{ maxWidth: 560, padding: '20px 24px 28px' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-border-medium mx-auto mb-5" />

        <h3 className="text-h3 font-semibold mb-1" style={{ letterSpacing: '-0.2px' }}>
          필터
        </h3>
        <p className="text-[13px] text-fg-3 mb-5">카공에 맞는 조건을 골라주세요</p>

        <div className="grid grid-cols-2 gap-2">
          {filters.map((f) => {
            const active = activeFilters.has(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className="flex items-center gap-2.5 rounded-xl cursor-pointer text-caption text-left border"
                style={{
                  padding: '12px 14px',
                  background: active ? 'var(--kg-amber-light)' : 'var(--bg)',
                  borderColor: active ? 'var(--kg-amber-soft)' : 'var(--border-subtle)',
                  color: active ? 'var(--kg-amber-deep)' : 'var(--fg-2)',
                  fontWeight: active ? 600 : 500,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <KGIcon name={f.icon} size={16} />
                {f.label}
                {active && <KGIcon name="check" size={14} stroke={2.4} />}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full border-none cursor-pointer text-btn font-semibold"
          style={{
            padding: '12px 0',
            background: 'var(--fg)',
            color: 'var(--bg)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          결과 보기
        </button>
      </div>
    </div>
  );
}
