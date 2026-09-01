import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, LifeBuoy, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Paginacao, usePaginacao } from "@/components/pagination";
import { Bar, Chip, Metric, Panel, SlaBadge } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import {
  agentById,
  baseConhecimento,
  ticketCategorias,
  ticketStatuses,
  type TicketStatus,
} from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { NovoChamadoButton } from "@/components/dialogs";
import { EmptyState } from "@/components/forms";

export const Route = createFileRoute("/chamados/")({
  head: () => ({
    meta: [
      { title: "Chamados de suporte — Certus AC" },
      {
        name: "description",
        content:
          "Helpdesk da autoridade certificadora: chamados de clientes com categorização, SLA, fila por responsável e base de conhecimento.",
      },
      { property: "og:title", content: "Chamados de suporte — Certus AC" },
      { property: "og:description", content: "Fila de helpdesk com SLA, categorias e responsáveis." },
    ],
  }),
  component: Chamados,
});

export function statusTone(s: TicketStatus) {
  return s === "aberto"
    ? ("alert" as const)
    : s === "em andamento"
      ? ("deep" as const)
      : s === "aguardando cliente"
        ? ("outline" as const)
        : ("blue" as const);
}

export function prioridadeTone(p: string) {
  return p === "critica" || p === "alta" ? ("alert" as const) : ("neutral" as const);
}

function Chamados() {
  const { tickets } = useStore();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<TicketStatus | "todos">("todos");
  const [categoria, setCategoria] = useState<string>("todas");

  const lista = useMemo(
    () =>
      tickets.filter((t) => {
        const q = busca.toLowerCase();
        const matchBusca =
          !q ||
          t.numero.toLowerCase().includes(q) ||
          t.cliente.toLowerCase().includes(q) ||
          t.assunto.toLowerCase().includes(q);
        const pag = usePaginacao(lista, 25);

  return (
          matchBusca &&
          (status === "todos" || t.status === status) &&
          (categoria === "todas" || t.categoria === categoria)
        );
      }),
    [tickets, busca, status, categoria],
  );

  const abertos = tickets.filter((t) => t.status !== "resolvido" && t.status !== "fechado");
  const estourados = abertos.filter((t) => t.slaRestanteHoras < 0).length;
  const csat = tickets.filter((t) => t.satisfacao).reduce((a, t) => a + (t.satisfacao ?? 0), 0) /
    Math.max(1, tickets.filter((t) => t.satisfacao).length);
  const primeiraResposta =
    tickets.filter((t) => t.primeiraRespostaMin).reduce((a, t) => a + (t.primeiraRespostaMin ?? 0), 0) /
    Math.max(1, tickets.filter((t) => t.primeiraRespostaMin).length);

  const porCategoria = ticketCategorias
    .map((c) => ({ nome: c.nome, total: tickets.filter((t) => t.categoria === c.nome).length }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const maxCat = Math.max(...porCategoria.map((c) => c.total), 1);

  return (
    <AppShell
      title="Chamados"
      subtitle="Helpdesk de clientes — categorização, SLA e responsáveis"
      actions={
        <>
        <NovoChamadoButton />
        <Link
          to="/portal"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary"
        >
          <ExternalLink className="size-3.5" /> Abrir portal do cliente
        </Link>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap divide-border rounded-lg border border-border bg-card">
        <Metric label="Em aberto" value={String(abertos.length)} hint="fila ativa" />
        <Metric label="SLA estourado" value={String(estourados)} delta={estourados > 0 ? -100 : 0} hint="ação imediata" />
        <Metric label="1ª resposta" value={`${Math.round(primeiraResposta)} min`} delta={-14} hint="média 30 dias" />
        <Metric label="CSAT" value={csat.toFixed(1)} delta={3.2} hint="de 5,0" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel
          title="Fila de chamados"
          hint={`${lista.length} de ${tickets.length} chamados`}
          bodyClassName="p-0"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
                <Search className="size-3.5 text-muted-foreground" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nº, cliente ou assunto"
                  className="w-40 bg-transparent text-xs outline-none"
                />
              </div>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              >
                <option value="todas">Todas as categorias</option>
                {ticketCategorias.map((c) => (
                  <option key={c.nome} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2.5">
            {(["todos", ...ticketStatuses] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s as TicketStatus | "todos")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs capitalize transition-colors",
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:border-primary",
                )}
              >
                {s}
                {s !== "todos" && (
                  <span className="ml-1 tabular opacity-70">{tickets.filter((t) => t.status === s).length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-[42%] px-4 py-2 font-medium">Chamado</th>
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">SLA</th>
                  <th className="px-4 py-2 font-medium">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pag.visiveis.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        to="/chamados/$id"
                        params={{ id: t.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.numero} · {t.assunto}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {t.cliente} · {t.canal} · aberto {t.abertoEm}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone="blue">{t.categoria}</Chip>
                      <p className="mt-1 text-[11px] text-muted-foreground">{t.subcategoria}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Chip tone={statusTone(t.status)}>{t.status}</Chip>
                        <Chip tone={prioridadeTone(t.prioridade)}>{t.prioridade}</Chip>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SlaBadge horas={t.slaRestanteHoras} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{agentById(t.responsavelId).nome}</td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Nenhum chamado com esses filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacao {...pag} rotulo="chamados" />
        </Panel>

        <div className="space-y-4">
          <Panel title="Volume por categoria" hint="últimos 30 dias">
            <div className="space-y-2.5">
              {porCategoria.map((c) => (
                <div key={c.nome}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{c.nome}</span>
                    <span className="tabular text-muted-foreground">{c.total}</span>
                  </div>
                  <Bar value={(c.total / maxCat) * 100} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Carga por atendente">
            <div className="space-y-2 text-sm">
              {[...new Set(tickets.map((t) => t.responsavelId))].map((id) => {
                const meus = abertos.filter((t) => t.responsavelId === id);
                return (
                  <div key={id} className="flex items-center justify-between">
                    <span>{agentById(id).nome}</span>
                    <Chip tone={meus.length > 1 ? "alert" : "neutral"}>{meus.length} abertos</Chip>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Base de conhecimento" hint="artigos mais acessados">
            <ul className="space-y-2 text-sm">
              {baseConhecimento.map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <LifeBuoy className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <div>
                    <p className="leading-snug">{a.titulo}</p>
                    <p className="text-[11px] text-muted-foreground tabular">
                      {a.categoria} · {a.views.toLocaleString("pt-BR")} acessos
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
