import { HeroKind } from '@/types/cafe';

interface CafeHeroGlyphProps {
  kind: HeroKind;
}

export default function CafeHeroGlyph({ kind }: CafeHeroGlyphProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity: 0.22, color: kind === 'dark' ? '#fff' : '#3a2a16' }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8h13v6a5 5 0 01-5 5H8a5 5 0 01-5-5V8z" />
        <path d="M16 10h2a3 3 0 010 6h-2" />
        <path d="M7 2v3M11 2v3" />
      </svg>
    </div>
  );
}
