// Componentes compartilhados do Admin Center.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "alert" | "ok";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-border bg-card p-4",
        tone === "alert" && "border-alert/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-1.5 font-display text-2xl font-semibold tabular",
          tone === "alert" && "text-alert",
        )}
      >
        {value}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
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

export function StatusDot({ status }: { status: string }) {
  const ok = ["operacional", "conectado", "ativo", "on", "resolvido", "paga"].includes(status);
  const warn = [
    "degradado",
    "parcial",
    "trial",
    "onboarding",
    "mitigado",
    "aberta",
    "aberto",
  ].includes(status);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span
        className={cn(
          "size-1.5 rounded-full",
          ok ? "bg-primary" : warn ? "bg-alert" : "bg-muted-foreground",
        )}
      />
      <span className="capitalize">{status}</span>
    </span>
  );
}

export function Spark({ values, className }: { values: number[]; className?: string }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const span = Math.max(max - min, 1);
  const pontos = values
    .map((v, i) => `${(i / (values.length - 1 || 1)) * 100},${28 - ((v - min) / span) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)}>
      <polyline
        points={pontos}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="text-primary"
      />
    </svg>
  );
}

export function Gauge({
  label,
  value,
  sufixo = "%",
}: {
  label: string;
  value: number;
  sufixo?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="tabular font-medium">
          {value}
          {sufixo}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", pct > 80 ? "bg-alert" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "h-9 w-full rounded-md border border-border bg-card px-2.5 text-sm outline-none transition-colors focus:border-primary";
