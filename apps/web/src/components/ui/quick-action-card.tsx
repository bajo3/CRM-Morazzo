import type { ReactNode } from "react";

type QuickActionCardProps = {
  title: string;
  description: string;
  action: ReactNode;
};

export function QuickActionCard({ title, description, action }: QuickActionCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="text-sm leading-6 text-stone-600">{description}</p>
      </div>
      <div className="mt-4">{action}</div>
    </div>
  );
}

