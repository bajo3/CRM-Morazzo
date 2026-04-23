import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-stone-200 text-stone-700",
  info: "bg-sky-100 text-sky-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
};

type StatusBadgeProps = {
  children: ReactNode;
  tone?: Tone;
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

