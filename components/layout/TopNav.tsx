import KGIcon from '@/components/ui/KGIcon';

const NAV_ITEMS = [
  { label: '지도', on: true },
  { label: '랭킹' },
  { label: '카공팁' },
  { label: '카페 등록' },
];

interface TopNavProps {
  query: string;
  setQuery: (q: string) => void;
}

export default function TopNav({ query, setQuery }: TopNavProps) {
  return (
    <div
      className="sticky top-0 z-50 border-b border-border-subtle px-6 h-16 flex items-center gap-5 backdrop-blur-md"
      style={{ background: 'rgba(255,255,255,0.92)' }}
    >
      {/* Logo */}
      <a
        href="#"
        className="flex items-center gap-2 no-underline text-fg font-semibold text-[19px]"
        style={{ letterSpacing: '-0.3px' }}
      >
        <span
          className="inline-flex items-center justify-center rounded-xl text-kg-amber"
          style={{
            width: 26,
            height: 26,
            background: 'var(--fg)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z" />
            <circle cx="12" cy="9" r="2.2" fill="currentColor" />
          </svg>
        </span>
        카공맵
      </a>

      <div className="w-px h-[22px] bg-border-subtle mx-1" />

      {/* Search */}
      <div
        className="flex-1 max-w-[480px] flex items-center gap-2.5 rounded-full border border-border-medium bg-bg text-fg-3 transition-colors duration-120"
        style={{ padding: '9px 16px' }}
      >
        <KGIcon name="search" size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="카페, 지역, 역 검색…"
          className="flex-1 bg-transparent border-none outline-none text-fg text-caption"
          style={{ fontFamily: 'var(--font-sans)' }}
        />
        <span
          className="font-mono text-[10.5px] border border-border-medium rounded text-fg-3"
          style={{ padding: '2px 6px', letterSpacing: 0.5 }}
        >
          ⌘K
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex gap-6 text-caption font-medium ml-auto">
        {NAV_ITEMS.map((x) => (
          <a
            key={x.label}
            href="#"
            className="no-underline pb-1"
            style={{
              color: x.on ? 'var(--fg)' : 'var(--fg-3)',
              borderBottom: x.on ? '2px solid var(--kg-amber)' : '2px solid transparent',
            }}
          >
            {x.label}
          </a>
        ))}
      </nav>

      {/* CTA */}
      <button
        className="inline-flex items-center gap-1.5 rounded-full cursor-pointer text-[13px] font-semibold border"
        style={{
          padding: '7px 14px',
          background: 'var(--kg-amber-light)',
          color: 'var(--kg-amber-deep)',
          borderColor: 'rgba(180,111,5,0.15)',
        }}
      >
        <KGIcon name="plus" size={14} stroke={2.2} /> 카페 제보
      </button>

      {/* Avatar */}
      <div
        className="inline-flex items-center justify-center rounded-full text-[13px] font-semibold text-fg-2"
        style={{ width: 32, height: 32, background: 'var(--gray-100)' }}
      >
        Y
      </div>
    </div>
  );
}
