import { Cafe } from "@/types/cafe";
import KGIcon from "@/components/ui/KGIcon";
import MonoLabel from "@/components/ui/MonoLabel";
import { cls } from "@/lib/utils";

function Pros({ cafe }: { cafe: Cafe }) {
  return (
    <div className="bg-kg-amber-light rounded-2xl p-5 border border-[rgba(245,165,36,0.3)]">
      <div className="inline-flex items-center gap-1.5 mb-3">
        <KGIcon name="sparkle" size={14} />
        <MonoLabel color="var(--kg-amber-deep)">카공족이 뽑은 좋은 점</MonoLabel>
      </div>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {cafe.pros.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm text-fg">
            <span className="text-kg-amber-deep shrink-0">
              <KGIcon name="check" size={14} stroke={2.4} />
            </span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cons({ cafe }: { cafe: Cafe }) {
  if (!cafe.cons.length && !cafe.limits.length) return null;
  return (
    <div className="rounded-2xl p-5 bg-[rgba(212,86,86,0.05)] border border-[rgba(212,86,86,0.12)]">
      <div className="inline-flex items-center gap-1.5 mb-3">
        <MonoLabel color="#b13f3f">알아두면 좋은 점</MonoLabel>
      </div>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {cafe.limits.map((l) => (
          <li key={l} className="flex items-center gap-2.5 text-sm text-fg">
            <span className="text-[#b13f3f] shrink-0">
              <KGIcon name="ban" size={14} stroke={2.2} />
            </span>
            <span className="font-semibold">{l}</span>
          </li>
        ))}
        {cafe.cons.map((c) => (
          <li key={c} className="flex items-center gap-2.5 text-sm text-fg-2">
            <span className="text-[#b13f3f] shrink-0">
              <KGIcon name="info" size={14} />
            </span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProsCons({ cafe }: { cafe: Cafe }) {
  const hasCons = cafe.cons.length > 0 || cafe.limits.length > 0;
  return (
    <div className={cls("grid gap-3 mb-9", hasCons ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
      <Pros cafe={cafe} />
      <Cons cafe={cafe} />
    </div>
  );
}
