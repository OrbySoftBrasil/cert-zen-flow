import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileCheck2,
  Signature,
  UserCog,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Panel, SlaBadge } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { agentById, brl, requestById, stages } from "@/lib/mock-data";

export const Route = createFileRoute("/solicitacoes/$id")({
  loader: ({ params }) => {
    const r = requestById(params.id);
    if (!r) throw notFound();
    return { protocolo: r.protocolo, cliente: r.cliente };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.protocolo} — Solicitação` : "Solicitação não encontrada" },
      {
        name: "description",
        content:
          "Detalhe da solicitação de certificado: timeline auditável, checklist da etapa e ações operacionais.",
      },
      { property: "og:title", content: loaderData ? `${loaderData.protocolo} — Solicitação` : "Solicitação" },
      { property: "og:description", content: "Timeline auditável, checklist e ações de etapa." },
    ],
  }),
  component: Solicitacao,
});

function Solicitacao() {
  const { id } = Route.useParams();
  const solicitacao = requestById(id)!;
  const [checklist, setChecklist] = useState(solicitacao.checklist);
  const [log, setLog] = useState(solicitacao.timeline);
  const feitos = checklist.filter((c) => c.done).length;

  function registrar(titulo: string, tipo: "humano" | "alerta" = "humano") {
    setLog((prev) => [
      ...prev,
      { id: `x${prev.length}`, quando: "agora", autor: "Marina Duarte", titulo, tipo },
    ]);
  }

  const acoes = [
    { label: "Aprovar documentos", icon: FileCheck2 },
    { label: "Reprovar documento", icon: AlertTriangle },
    { label: "Reagendar videoconferência", icon: CalendarClock },
    { label: "Escalar para compliance", icon: UserCog },
    { label: "Emitir certificado", icon: Signature },
    { label: "Revogar", icon: Ban },
  ];

  return (
    <AppShell
      title={`${solicitacao.protocolo} · ${solicitacao.tipo}`}
      subtitle={`${solicitacao.cliente} · aberto em ${solicitacao.abertoEm}`}
      actions={
        <Link
          to="/operacao"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar ao Kanban
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
            {stages
              .filter((s) => s.id !== "bloqueado")
              .map((s, i, arr) => {
                const atual = s.id === solicitacao.stage;
                const passou = arr.findIndex((x) => x.id === solicitacao.stage) > i;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-2 py-1 text-xs",
                        atual
                          ? "bg-primary font-medium text-primary-foreground"
                          : passou
                            ? "bg-primary-soft text-primary-deep"
                            : "text-muted-foreground",
                      )}
                    >
                      {s.nome}
                    </span>
                    {i < arr.length - 1 && <span className="text-border-strong">›</span>}
                  </div>
                );
              })}
          </div>

          <Panel
            title="Checklist da etapa"
            hint={`${feitos} de ${checklist.length} concluídos · avanço bloqueado com pendências`}
          >
            <ul className="space-y-1">
              {checklist.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setChecklist((prev) =>
                        prev.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)),
                      );
                      registrar(`${c.done ? "Desmarcou" : "Concluiu"}: ${c.label}`);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    {c.done ? (
                      <CheckCircle2 className="size-4 text-primary" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                    <span className={cn(c.done && "text-muted-foreground line-through")}>{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Timeline" hint="Registro auditável de todos os eventos" bodyClassName="p-0">
            <ol className="relative space-y-0">
              {log.map((e, i) => (
                <li key={e.id} className="flex gap-3 px-4 py-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1 size-2.5 rounded-full",
                        e.tipo === "alerta" ? "bg-alert" : e.tipo === "cliente" ? "bg-primary-soft" : "bg-primary",
                      )}
                    />
                    {i < log.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-sm font-medium">{e.titulo}</p>
                    {e.detalhe && <p className="text-xs text-muted-foreground">{e.detalhe}</p>}
                    <p className="mt-0.5 text-[11px] text-muted-foreground tabular">
                      {e.autor} · {e.quando}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel title="Solicitação">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Titular</dt>
                <dd className="text-right">
                  <Link
                    to="/clientes/$id"
                    params={{ id: solicitacao.clienteId }}
                    className="text-primary hover:underline"
                  >
                    {solicitacao.cliente}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Documento</dt>
                <dd className="tabular">{solicitacao.documento}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Responsável</dt>
                <dd>{agentById(solicitacao.responsavelId).nome}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Canal</dt>
                <dd>{solicitacao.canal}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Valor</dt>
                <dd className="tabular">{brl(solicitacao.valor)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">SLA</dt>
                <dd>
                  <SlaBadge horas={solicitacao.slaRestanteHoras} />
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-1">
              {solicitacao.tags.map((t) => (
                <Chip key={t} tone="outline">
                  {t}
                </Chip>
              ))}
            </div>
          </Panel>

          <Panel title="Ações da etapa">
            <div className="grid gap-1.5">
              {acoes.map((a) => (
                <button
                  key={a.label}
                  onClick={() => registrar(a.label, a.label === "Revogar" ? "alerta" : "humano")}
                  className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary-soft/40"
                >
                  <a.icon className="size-4 text-primary" /> {a.label}
                </button>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
