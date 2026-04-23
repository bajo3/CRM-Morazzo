import type { ReactNode } from "react";

type TopHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function TopHeader({ title, description, action }: TopHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 px-6 py-5 shadow-[0_20px_45px_rgba(92,74,46,0.08)] backdrop-blur lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Operacion diaria</p>
        <h2 className="text-3xl font-semibold tracking-tight text-ink">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-stone-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
