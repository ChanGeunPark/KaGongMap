interface TweakRowProps {
  label: string;
  children: React.ReactNode;
}

export default function TweakRow({ label, children }: TweakRowProps) {
  return (
    <div className="mb-3">
      <div className="text-[11px] font-mono uppercase text-fg-3 mb-1.5 tracking-[0.5px]">
        {label}
      </div>
      {children}
    </div>
  );
}
