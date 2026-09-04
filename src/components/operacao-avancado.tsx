// Camadas de profundidade da área Operação: carga da equipe, ações em lote,
// checklist operável e trilha de auditoria — tudo sobre o estado global.
import { ArrowRight, History, UserCog, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Btn, Field, Modal, SelectInput } from "@/components/forms";
import { Chip, Panel } from "@/components/ui-kit";
import { agents, agentById, brl, type Request, type TimelineEvent } from "@/lib/mock-data";
import { bloqueioPrincipal, papelEsperado, perfilById } from "@/lib/operacao-model";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------ carga equipe

export function PainelCarga({
  requests,
  onFiltrarAgente,
  agenteAtivo,
}: {
  requests: Request[];
  onFiltrarAgente: (id: string) => void;
  agenteAtivo: string;
}) {
  const linhas = agents.map((a) => {
    const meus = requests.filter((r) => r.responsavelId === a.id);
    const atrasados = meus.filter((r) => r.slaRestanteHoras < 0).length;
    const criticos = meus.filter((r) => r.prioridade === "critica").length;
    const bloqueados = meus.filter((r) => !bloqueioPrincipal(r).startsWith("Sem bloqueio")).length;
    const valor = meus.reduce((s, r) => s + r.valor, 0);
    return { a, total: meus.length, atrasados, criticos, bloqueados, valor };
  });
  const pico = Math.max(1, ...linhas.map((l) => l.total));

  return (
    <Panel
      title="Carga da equipe"
      hint="Quem está sobrecarregado agora — clique para filtrar o quadro por responsável"
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-border">
        {linhas.map((l) => {
          const ativo = agenteAtivo === l.a.id;
          return (
            <li key={l.a.id}>
              <button
                onClick={() => onFiltrarAgente(ativo ? "todos" : l.a.id)}
                aria-pressed={ativo}
                className={cn(
                  "flex w-full flex-wrap items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  ativo && "bg-primary-soft/60",
                )}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary-deep">
                  {l.a.iniciais}
                </span>
                <span className="min-w-40 flex-1">
                  <span className="block text-sm font-medium">{l.a.nome}</span>
                  <span className="block text-[11px] text-muted-foreground">{l.a.papel}</span>
                </span>
                <span className="hidden min-w-32 flex-1 sm:block" aria-hidden="true">
                  <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(l.total / pico) * 100}%` }}
                    />
                  </span>
                </span>
                <span className="tabular flex flex-wrap items-center gap-1.5 text-[11px]">
                  <Chip tone="outline">{l.total} em fila</Chip>
                  {l.atrasados > 0 && <Chip tone="alert">{l.atrasados} fora do prazo</Chip>}
                  {l.criticos > 0 && <Chip tone="deep">{l.criticos} crítico</Chip>}
                  {l.bloqueados > 0 && <Chip tone="blue">{l.bloqueados} com bloqueio</Chip>}
                  <span className="text-muted-foreground">{brl(l.valor)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// -------------------------------------------------------------- ações lote

export function BarraLote({
  quantidade,
  onLimpar,
  children,
}: {
  quantidade: number;
  onLimpar: () => void;
  children: ReactNode;
}) {
  if (quantidade === 0) return null;
  return (
    <div
      role="region"
      aria-label={`${quantidade} caso(s) selecionado(s)`}
      className="sticky bottom-3 z-30 mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-card px-3 py-2 shadow-lg"
    >
      <span className="tabular text-xs font-medium text-primary-deep">
        {quantidade} caso(s) selecionado(s)
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
      <button
        onClick={onLimpar}
        className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <X className="size-3" /> Limpar seleção
      </button>
    </div>
  );
}

export function CaixaSelecao({
  marcada,
  onChange,
  rotulo,
}: {
  marcada: boolean;
  onChange: (v: boolean) => void;
  rotulo: string;
}) {
  return (
    <input
      type="checkbox"
      checked={marcada}
      aria-label={rotulo}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.checked)}
      className="size-3.5 accent-[var(--color-primary)]"
    />
  );
}

export function ReatribuirDialog({
  open,
  quantidade,
  sugerido,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  quantidade: number;
  sugerido: string;
  onCancel: () => void;
  onConfirm: (agenteId: string, motivo: string) => void;
}) {
  const [agente, setAgente] = useState(sugerido);
  const [motivo, setMotivo] = useState("");
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Reatribuir responsável"
      hint={`${quantidade} caso(s) mudarão de dono. A transferência entra na trilha de auditoria.`}
      width="max-w-md"
      footer={
        <>
          <Btn variant="ghost" onClick={onCancel}>
            Cancelar
          </Btn>
          <Btn disabled={motivo.trim().length < 3} onClick={() => onConfirm(agente, motivo.trim())}>
            Transferir
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Novo responsável">
          <SelectInput value={agente} onChange={(e) => setAgente(e.target.value)}>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} · {a.papel}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field
          label="Motivo da transferência"
          hint="Obrigatório: fica visível no histórico do caso."
          {...(motivo.trim().length > 0 && motivo.trim().length < 3
            ? { error: "Descreva o motivo com ao menos 3 caracteres." }
            : {})}
        >
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder="Ex.: titular remarcou e o agente original está em férias"
            className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- checklist

// ------------------------------------------------------------- auditoria

export function TimelineRecente({ eventos }: { eventos: TimelineEvent[] }) {
  const ultimos = [...eventos].slice(-5).reverse();
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <History className="size-3.5" /> Últimos registros
      </p>
      {ultimos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem eventos registrados.</p>
      ) : (
        <ol className="space-y-1.5 border-l border-border pl-3">
          {ultimos.map((e) => (
            <li key={e.id} className="relative text-xs">
              <span
                className={cn(
                  "absolute -left-[17px] top-1.5 size-1.5 rounded-full",
                  e.tipo === "alerta"
                    ? "bg-alert"
                    : e.tipo === "sistema"
                      ? "bg-primary"
                      : "bg-border-strong",
                )}
              />
              <p className="font-medium">{e.titulo}</p>
              <p className="text-[11px] text-muted-foreground">
                {e.quando} · {e.autor}
                {e.detalhe ? ` · ${e.detalhe}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ----------------------------------------------------------- responsável

export function ResponsavelCaso({
  r,
  onChange,
}: {
  r: Request;
  onChange: (agenteId: string) => void;
}) {
  const esperado = perfilById(papelEsperado(r));
  const foraDoPapel = r.responsavelId !== esperado.agenteId;
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <UserCog className="size-3.5" /> Responsável atual
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <SelectInput
          value={r.responsavelId}
          aria-label="Responsável pelo caso"
          onChange={(e) => onChange(e.target.value)}
          className="max-w-64"
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome} · {a.papel}
            </option>
          ))}
        </SelectInput>
        {foraDoPapel && (
          <span className="flex items-center gap-1 text-[11px] text-alert">
            <ArrowRight className="size-3" /> A etapa espera {esperado.nome} (
            {agentById(esperado.agenteId).nome})
          </span>
        )}
      </div>
    </div>
  );
}
