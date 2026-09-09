import type { ReactNode } from "react";
import { ChevronRight, Eye } from "lucide-react";

import { cn } from "@/lib/utils";

/** Somente leitura: nada aqui executa ação, apenas navegação/visualização. */
export function ReadOnlyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-deep",
        className,
      )}
    >
      <Eye className="size-3" /> Somente leitura
    </span>
  );
}

export function MCard({
  title,
  hint,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  hint?: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card", className)}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            {title && <h2 className="truncate font-display text-[13px] font-semibold">{title}</h2>}
            {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  delta,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  tone?: "default" | "alert" | "primary";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border p-3",
        tone === "alert"
          ? "border-alert/30 bg-alert-soft"
          : tone === "primary"
            ? "border-primary/25 bg-primary-soft"
            : "border-border bg-card",
      )}
    >
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-xl font-semibold tabular",
          tone === "alert" ? "text-alert" : tone === "primary" ? "text-primary-deep" : "",
        )}
      >
        {value}
      </p>
      <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
        {delta !== undefined && (
          <span className={cn("font-semibold tabular", delta < 0 ? "text-alert" : "text-primary")}>
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
        {hint && <span className="truncate text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function Row({
  title,
  subtitle,
  meta,
  right,
  onClick,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left not-last:border-b not-last:border-border",
        onClick && "active:bg-muted",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{title}</p>
        {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
        {meta && <div className="mt-1 flex flex-wrap items-center gap-1">{meta}</div>}
      </div>
      {right}
      {onClick && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </Tag>
  );
}

export function MiniBar({
  value,
  tone = "primary",
}: {
  value: number;
  tone?: "primary" | "alert";
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", tone === "alert" ? "bg-alert" : "bg-primary")}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}
