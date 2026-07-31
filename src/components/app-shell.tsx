import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  MessagesSquare,
  CalendarClock,
  LifeBuoy,
  ShieldCheck,
  RefreshCw,
  Search,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Rows3,
  Rows4,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { clients, requests } from "@/lib/mock-data";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/operacao", label: "Operação", icon: KanbanSquare },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/chat", label: "Chat", icon: MessagesSquare },
  { to: "/chamados", label: "Chamados", icon: LifeBuoy },
  { to: "/agenda", label: "Agenda", icon: CalendarClock },
  { to: "/renovacoes", label: "Renovações", icon: RefreshCw },
  { to: "/conformidade", label: "Conformidade", icon: ShieldCheck },
] as const;

export function AppShell({
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
  const [collapsed, setCollapsed] = useState(false);
  const [dense, setDense] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar md:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">Certus AC</p>
              <p className="text-[11px] text-muted-foreground">Autoridade Certificadora</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary-soft font-medium text-primary-deep"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-6">
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 flex-1 max-w-md items-center gap-2 rounded-md border border-border bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong"
          >
            <Search className="size-4" />
            <span className="truncate">Buscar cliente, protocolo ou certificado</span>
            <kbd className="ml-auto hidden rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground sm:block">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setDense((v) => !v)}
              title={dense ? "Densidade confortável" : "Densidade compacta"}
              className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {dense ? <Rows4 className="size-4" /> : <Rows3 className="size-4" />}
            </button>
            <button className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-alert" />
            </button>
            <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
              <div className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-deep">
                MD
              </div>
              <div className="hidden leading-tight lg:block">
                <p className="text-xs font-medium">Marina Duarte</p>
                <p className="text-[11px] text-muted-foreground">Agente de Registro</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-card px-4 py-4 md:px-6">
          <div>
            <h1 className="font-display text-xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>

        <main className={cn("flex-1 px-4 md:px-6", dense ? "py-3" : "py-6")}>{children}</main>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar clientes, solicitações e certificados..." />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Clientes">
            {clients.map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.nome} ${c.documento}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/clientes/$id", params: { id: c.id } });
                }}
              >
                <Users className="size-4" />
                <span>{c.nome}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.documento}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Solicitações">
            {requests.map((r) => (
              <CommandItem
                key={r.id}
                value={`${r.protocolo} ${r.cliente} ${r.tipo}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/solicitacoes/$id", params: { id: r.id } });
                }}
              >
                <KanbanSquare className="size-4" />
                <span>{r.protocolo}</span>
                <span className="ml-auto text-xs text-muted-foreground">{r.cliente}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
