// Shell do Admin Center — plano de controle do SaaS, separado do app do tenant.
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Boxes,
  CreditCard,
  FileClock,
  Flag,
  Gauge,
  LayoutGrid,
  Menu,
  Moon,
  Plug,
  ShieldAlert,
  Sun,
  Terminal,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useTema } from "@/lib/theme";

const nav = [
  { to: "/admin", label: "Visão geral", icon: LayoutGrid, exact: true },
  { to: "/admin/tenants", label: "Tenants", icon: Boxes },
  { to: "/admin/planos", label: "Planos & preços", icon: CreditCard },
  { to: "/admin/faturamento", label: "Faturamento SaaS", icon: Gauge },
  { to: "/admin/integracoes", label: "Integrações & APIs", icon: Plug },
  { to: "/admin/observabilidade", label: "Observabilidade", icon: Activity },
  { to: "/admin/incidentes", label: "Incidentes & uptime", icon: ShieldAlert },
  { to: "/admin/logs", label: "Logs & auditoria", icon: Terminal },
  { to: "/admin/flags", label: "Feature flags", icon: Flag },
] as const;

export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [aberto, setAberto] = useState(false);
  const { efetivo, alternar } = useTema();

  useEffect(() => setAberto(false), [pathname]);

  const menu = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
      {nav.map((item) => {
        const active = "exact" in item && item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-primary-soft font-medium text-primary-deep"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const marca = (
    <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
      <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-deep text-primary-foreground">
        <ShieldAlert className="size-4" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-semibold">Admin Center</p>
        <p className="text-[11px] text-muted-foreground">Plano de controle · Certus SaaS</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        {marca}
        {menu}
        <div className="border-t border-border p-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao app
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-6">
          <button
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          >
            <Menu className="size-4" />
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Produção · sa-east-1
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={alternar}
              title={efetivo === "escuro" ? "Tema claro" : "Tema escuro"}
              className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {efetivo === "escuro" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link
              to="/admin/logs"
              title="Logs"
              className="hidden size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:grid"
            >
              <FileClock className="size-4" />
            </Link>
            <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
              <div className="grid size-8 place-items-center rounded-full bg-primary-deep text-xs font-semibold text-primary-foreground">
                SA
              </div>
              <div className="hidden leading-tight lg:block">
                <p className="text-xs font-medium">Super Admin</p>
                <p className="text-[11px] text-muted-foreground">plataforma@certus.app</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-card px-4 py-4 md:px-6">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>

        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Fechar" onClick={() => setAberto(false)} className="absolute inset-0 bg-foreground/40" />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-sidebar">
            <div className="relative">
              {marca}
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
              >
                <X className="size-4" />
              </button>
            </div>
            {menu}
          </div>
        </div>
      )}
    </div>
  );
}
