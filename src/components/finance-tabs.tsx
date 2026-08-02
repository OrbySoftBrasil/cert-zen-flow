import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const tabs = [
  { to: "/financeiro", label: "BI financeiro" },
  { to: "/financeiro/caixa", label: "Caixa e bancos" },
  { to: "/financeiro/receber", label: "A receber" },
  { to: "/financeiro/pagar", label: "A pagar" },
  { to: "/financeiro/planos", label: "Planos e contratos" },
  { to: "/financeiro/comissoes", label: "Comissões" },
] as const;

export function FinanceTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mb-4 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1 print:hidden">
      {tabs.map((t) => {
        const active = t.to === "/financeiro" ? pathname === "/financeiro" : pathname.startsWith(t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary-soft font-medium text-primary-deep"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
