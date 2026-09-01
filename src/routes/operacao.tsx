import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, LayoutGrid, List, Lock } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Panel, SlaBadge } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import {
  agentById,
  agents,
  brl,
  stages,
  type Request,
  type StageId,
} from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { NovaSolicitacaoButton } from "@/components/dialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/operacao")({
  head: () => ({
    meta: [
      { title: "Central operacional — Certus AC" },
      {
        name: "description",
        content:
          "Kanban operacional da autoridade certificadora com SLA, responsável, checklist de etapa e filtros por canal e prioridade.",
      },
      { property: "og:title", content: "Central operacional — Certus AC" },
      { property: "og:description", content: "Kanban com SLA, responsável e checklist por etapa." },
    ],
  }),
  component: Operacao,
});

const prioridadeTone = {
  baixa: "outline",
  normal: "neutral",
  alta: "blue",
  critica: "alert",
} as const;

function Operacao() {
  const { requests: items, moveRequest } = useStore();
  const [view, setView] = useState<"kanban" | "tabela">("kanban");
  const [responsavel, setResponsavel] = useState("todos");
  const [prioridade, setPrioridade] = useState("todas");
  const [somenteSla, setSomenteSla] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const filtrados = useMemo(
    () =>
      items.filter(
        (r) =>
          (responsavel === "todos" || r.responsavelId === responsavel) &&
          (prioridade === "todas" || r.prioridade === prioridade) &&
          (!somenteSla || r.slaRestanteHoras < 0),
      ),
    [items, responsavel, prioridade, somenteSla],
  );

  function mover(id: string, stage: StageId) {
    const item = items.find((r) => r.id === id);
    if (!item) return;
    const pendentes = item.checklist.filter((c) => !c.done).length;
    const avancando = stages.findIndex((s) => s.id === stage) > stages.findIndex((s) => s.id === item.stage);
    if (avancando && pendentes > 0 && stage !== "bloqueado") {
      setAviso(`${item.protocolo}: ${pendentes} item(ns) do checklist pendente(s) nesta etapa.`);
      return;
    }
    setAviso(null);
    moveRequest(id, stage, "Movido no Kanban");
    toast.success(`${item.protocolo} → ${stages.find((s) => s.id === stage)?.nome}`);
  }

  return (
    <AppShell
      title="Central operacional"
      subtitle={`${filtrados.length} solicitações em fluxo · regra de checklist ativa`}
      actions={
        <>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {(
            [
              ["kanban", LayoutGrid],
              ["tabela", List],
            ] as const
          ).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs capitalize transition-colors",
                view === v ? "bg-primary-soft text-primary-deep" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" /> {v}
            </button>
          ))}
        </div>
        <NovaSolicitacaoButton />
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Filter className="size-4 text-muted-foreground" />
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs"
        >
          <option value="todos">Todos os responsáveis</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs"
        >
          <option value="todas">Todas as prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="normal">Normal</option>
          <option value="baixa">Baixa</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={somenteSla}
            onChange={(e) => setSomenteSla(e.target.checked)}
            className="accent-[var(--color-primary)]"
          />
          Somente SLA estourado
        </label>
        {aviso && (
          <span className="ml-auto flex items-center gap-1.5 rounded bg-alert-soft px-2 py-1 text-xs text-alert">
            <Lock className="size-3" /> {aviso}
          </span>
        )}
      </div>

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const cards = filtrados.filter((r) => r.stage === stage.id);
            const total = cards.reduce((s, r) => s + r.valor, 0);
            return (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragging) mover(dragging, stage.id);
                  setDragging(null);
                }}
                className={cn(
                  "flex w-[290px] shrink-0 flex-col rounded-lg border border-border bg-surface",
                  stage.id === "bloqueado" && "hatched",
                )}
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{stage.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{stage.descricao}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-semibold">{cards.length}</p>
                    <p className="tabular text-[11px] text-muted-foreground">{brl(total)}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {cards.map((r) => {
                    const feitos = r.checklist.filter((c) => c.done).length;
                    return (
                      <Link
                        key={r.id}
                        to="/solicitacoes/$id"
                        params={{ id: r.id }}
                        draggable
                        onDragStart={() => setDragging(r.id)}
                        onDragEnd={() => setDragging(null)}
                        className={cn(
                          "block cursor-grab rounded-md border border-border bg-card p-2.5 transition-shadow hover:border-border-strong active:cursor-grabbing",
                          dragging === r.id && "opacity-50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">{r.cliente}</p>
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary-deep">
                            {agentById(r.responsavelId).iniciais}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground tabular">
                          {r.protocolo} · {r.tipo} · {brl(r.valor)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          <SlaBadge horas={r.slaRestanteHoras} />
                          <Chip tone={prioridadeTone[r.prioridade]}>{r.prioridade}</Chip>
                          <Chip tone="outline">{r.canal}</Chip>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${(feitos / r.checklist.length) * 100}%` }}
                            />
                          </div>
                          <span className="tabular text-[10px] text-muted-foreground">
                            {feitos}/{r.checklist.length}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {cards.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-muted-foreground">Sem cards</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Protocolo</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Etapa</th>
                  <th className="px-4 py-2 font-medium">Responsável</th>
                  <th className="px-4 py-2 font-medium">SLA</th>
                  <th className="px-4 py-2 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-2.5 tabular">
                      <Link to="/solicitacoes/$id" params={{ id: r.id }} className="text-primary hover:underline">
                        {r.protocolo}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{r.cliente}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.tipo}</td>
                    <td className="px-4 py-2.5">
                      <Chip tone="blue">{stages.find((s) => s.id === r.stage)?.nome}</Chip>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{agentById(r.responsavelId).nome}</td>
                    <td className="px-4 py-2.5">
                      <SlaBadge horas={r.slaRestanteHoras} />
                    </td>
                    <td className="px-4 py-2.5 tabular">{brl(r.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </AppShell>
  );
}
