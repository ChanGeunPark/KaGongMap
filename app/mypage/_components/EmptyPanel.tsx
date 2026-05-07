import KGIcon from "@/components/ui/KGIcon";

type EmptyPanelProps = {
  icon: string;
  title: string;
  description: string;
};

export default function EmptyPanel({
  icon,
  title,
  description,
}: EmptyPanelProps) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg p-8 text-center shadow-card">
      <div className="mx-auto mb-3 flex size-8 items-center justify-center rounded-lg bg-gray-100 text-fg-3">
        <KGIcon name={icon} size={18} stroke={2} />
      </div>
      <p className="text-[15px] font-semibold text-fg">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-fg-3">{description}</p>
    </div>
  );
}
