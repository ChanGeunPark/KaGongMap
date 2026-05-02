import React from "react";
import KGIcon from "../ui/KGIcon";

interface EmptyHolderProps {
  icon: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}
function EmptyHolder(props: EmptyHolderProps) {
  const { icon, title, description, children } = props;
  return (
    <div className="rounded-2xl border border-border-subtle bg-white p-8 text-center shadow-card">
      <div className="mx-auto mb-5 flex size-8 items-center justify-center rounded-lg bg-gray-100 text-fg-3">
        <KGIcon name={icon} size={18} stroke={2} />
      </div>
      <p className="text-[15px] font-semibold text-fg">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-fg-3">{description}</p>
      {children}
    </div>
  );
}

export default EmptyHolder;
