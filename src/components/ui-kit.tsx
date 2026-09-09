import { AlertTriangle, Clock } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  title,
  hint,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  hint?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            {title && <h2 className="font-display text-sm font-semibold">{title}</h2>}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "deep" | "alert" | "outline";
  className?: string;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    blue: "bg-primary-soft text-primary-deep",
    deep: "bg-primary text-primary-foreground",
    alert: "bg-alert-soft text-alert",
    outline: "border border-border-strong text-muted-foreground",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SlaBadge({ horas }: { horas: number }) {
  const estourado = horas < 0;
  const risco = horas >= 0 && horas <= 4;
  const label = estourado ? `SLA ${Math.abs(horas)}h atrás` : `SLA ${horas}h`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium tabular",
        estourado
          ? "bg-alert-soft text-alert"
          : risco
            ? "bg-primary text-primary-foreground"
            : "bg-primary-soft text-primary-deep",
      )}
    >
      {estourado ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {label}
    </span>
  );
}

export function Metric({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
}) {
  return (
    <div className="min-w-0 grow basis-40 border-border px-4 py-3 not-last:border-r sm:basis-44">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        {delta !== undefined && (
          <span className={cn("tabular font-medium", delta < 0 ? "text-alert" : "text-primary")}>
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}
