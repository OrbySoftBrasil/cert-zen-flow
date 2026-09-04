import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Hand,
  LayoutGrid,
  List,
  Lock,
  RefreshCw,
  Rows3,
  Save,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { NovaSolicitacaoButton } from "@/components/dialogs";
import { Btn, ConfirmDialog, EmptyState, Field, Modal } from "@/components/forms";
import {
  BarraLote,
  CaixaSelecao,
  ChecklistCaso,
  PainelCarga,
  ReatribuirDialog,
  ResponsavelCaso,
  TimelineRecente,
} from "@/components/operacao-avancado";
import {
  AvisoRegulatorio,
  CasoCard,
  ErroEstado,
  LegendaProntidao,
  ProntidaoLinha,
  SkeletonLinhas,
  prioridadeTone,
} from "@/components/operacao-kit";
import { Paginacao, usePaginacao } from "@/components/pagination";
import { Chip, Panel, SlaBadge } from "@/components/ui-kit";
import { cenarios } from "@/lib/cenarios";
import { agentById, brl, stages, type Request } from "@/lib/mock-data";
import {
  acoesDe,
  bloqueioPrincipal,
  impedimentoDe,
  marcoDe,
  marcos,
  origemDe,
  papelEsperado,
  pendenciasDe,
  perfilById,
  perfis,
  proximaAcaoLabel,
  tarefasDe,
  unidadeDe,
  unidades,
  type AcaoCaso,
  type MarcoId,
  type PerfilId,
  type Tarefa,
  type TipoPendencia,
} from "@/lib/operacao-model";
import { USUARIO_ATUAL, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/operacao")({
  validateSearch: (search: Record<string, unknown>): { aba?: string } =>
    typeof search["aba"] === "string" ? { aba: search["aba"] } : {},
  head: () => ({
    meta: [
      { title: "Operação — Certus AR" },
      {
        name: "description",
        content:
          "Visão geral por marcos, fila de tarefas por papel e base completa de casos da autoridade de registro, com prontidão, SLA e ações permitidas.",
      },
      { property: "og:title", content: "Operação — Certus AR" },
      {
        property: "og:description",
        content: "Marcos operacionais, minha fila por papel e todos os casos com prontidão e SLA.",
      },
    ],
  }),
  component: Operacao,
});

type Aba = "visao" | "fila" | "casos" | "demo";

const tiposPendencia: { id: TipoPendencia; nome: string }[] = [
  { id: "contato", nome: "Contato comercial" },
  { id: "documento", nome: "Documento" },
  { id: "conferencia", nome: "Conferência" },
  { id: "identificacao", nome: "Identificação" },
  { id: "pagamento", nome: "Pagamento" },
  { id: "entrega", nome: "Entrega" },
];

interface FiltrosFila {
  papel: string;
  unidade: string;
  prazo: string;
  tipo: string;
  origem: string;
  ordem: "prioridade" | "vencimento";
}

const filtrosPadrao: FiltrosFila = {
  papel: "todos",
  unidade: "todas",
  prazo: "todos",
  tipo: "todos",
  origem: "todas",
  ordem: "prioridade",
};

const pesoPrioridade = { critica: 0, alta: 1, normal: 2, baixa: 3 } as const;

const abasValidas: Aba[] = ["visao", "fila", "casos", "demo"];

function Operacao() {
  const { requests, moveRequest, updateRequest, toggleChecklist, logRequest } = useStore();
  const navigate = useNavigate();
  const { aba: abaUrl } = Route.useSearch();

  // A visão fica na URL: links, favoritos e o botão voltar funcionam.
  const [aba, setAbaEstado] = useState<Aba>(
    abasValidas.includes(abaUrl as Aba) ? (abaUrl as Aba) : "visao",
  );
  useEffect(() => {
    if (abasValidas.includes(abaUrl as Aba) && abaUrl !== aba) setAbaEstado(abaUrl as Aba);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaUrl]);
  function setAba(proxima: Aba) {
    setAbaEstado(proxima);
    void navigate({ to: "/operacao", search: { aba: proxima }, replace: true });
  }
  const [caso, setCaso] = useState<string | null>(null);
  const [pendente, setPendente] = useState<{ acao: AcaoCaso; requestId: string } | null>(null);
  const [selecao, setSelecao] = useState<string[]>([]);
  const [lote, setLote] = useState<null | "avancar" | "assumir" | "priorizar" | "bloquear" | "reatribuir">(null);
  const [ordemVisivel, setOrdemVisivel] = useState<string[]>([]);

  const casoAberto = requests.find((r) => r.id === caso) ?? null;
  const selecionados = requests.filter((r) => selecao.includes(r.id));

  const emissoesPorCliente = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const r of requests) mapa[r.clienteId] = (mapa[r.clienteId] ?? 0) + 1;
    return mapa;
  }, [requests]);

  function alternarSelecao(id: string, marcado: boolean) {
    setSelecao((s) => (marcado ? [...new Set([...s, id])] : s.filter((x) => x !== id)));
  }

  function executar(acao: AcaoCaso, requestId: string) {
    const r = requests.find((x) => x.id === requestId);
    if (!r) return;
    if (acao.id === "assumir") {
      updateRequest(requestId, { responsavelId: perfilById(papelEsperado(r)).agenteId });
      logRequest(requestId, "Caso assumido", `${USUARIO_ATUAL.nome} passou a responder pelo caso.`);
      toast.success(`${r.protocolo} atribuído a você`, { description: "Registrado na trilha de auditoria." });
    } else if (acao.id === "priorizar") {
      const nova = r.prioridade === "critica" ? "alta" : r.prioridade === "alta" ? "critica" : "alta";
      updateRequest(requestId, { prioridade: nova });
      logRequest(requestId, `Prioridade alterada para ${nova}`, `Anterior: ${r.prioridade}.`);
      toast.success(`Prioridade de ${r.protocolo} agora é ${nova}`);
    } else if (acao.destino) {
      moveRequest(requestId, acao.destino, acao.label);
      toast.success(`${r.protocolo}: ${acao.label}`, { description: "Transição confirmada e auditada." });
    }
    setPendente(null);
  }

  function pedirConfirmacao(acao: AcaoCaso, requestId: string) {
    const r = requests.find((x) => x.id === requestId);
    if (!r) return;
    const impedimento = impedimentoDe(r, acao);
    if (impedimento) {
      toast.error("Ação bloqueada", { description: impedimento });
      return;
    }
    setPendente({ acao, requestId });
  }

  // ---- ações em lote: sempre reportam o que passou e o que foi barrado.
  const previaLote = useMemo(() => {
    if (lote !== "avancar") return { liberados: [] as Request[], barrados: [] as { r: Request; motivo: string }[] };
    const liberados: Request[] = [];
    const barrados: { r: Request; motivo: string }[] = [];
    for (const r of selecionados) {
      const acao = acoesDe(r).find((a) => a.destino && a.id === "avancar");
      if (!acao) {
        barrados.push({ r, motivo: "Não há avanço previsto para a etapa atual." });
        continue;
      }
      const imp = impedimentoDe(r, acao);
      if (imp) barrados.push({ r, motivo: imp });
      else liberados.push(r);
    }
    return { liberados, barrados };
  }, [lote, selecionados]);

  function aplicarLote(agenteId?: string, motivo?: string) {
    if (lote === "avancar") {
      for (const r of previaLote.liberados) {
        const acao = acoesDe(r).find((a) => a.destino && a.id === "avancar");
        if (acao?.destino) moveRequest(r.id, acao.destino, `${acao.label} (ação em lote)`);
      }
      toast.success(`${previaLote.liberados.length} caso(s) avançaram`, {
        description: previaLote.barrados.length
          ? `${previaLote.barrados.length} permaneceram na etapa por requisito pendente.`
          : "Nenhum caso ficou para trás.",
      });
    } else if (lote === "assumir") {
      for (const r of selecionados) {
        updateRequest(r.id, { responsavelId: USUARIO_ATUAL.id });
        logRequest(r.id, "Caso assumido em lote", `${USUARIO_ATUAL.nome} assumiu a responsabilidade.`);
      }
      toast.success(`${selecionados.length} caso(s) agora são seus`);
    } else if (lote === "priorizar") {
      for (const r of selecionados) {
        updateRequest(r.id, { prioridade: "critica" });
        logRequest(r.id, "Prioridade elevada para crítica", "Ação em lote da coordenação.");
      }
      toast.success(`${selecionados.length} caso(s) marcados como críticos`);
    } else if (lote === "bloquear") {
      for (const r of selecionados) moveRequest(r.id, "bloqueado", "Bloqueio registrado em lote");
      toast.success(`${selecionados.length} caso(s) sinalizados como bloqueados`);
    } else if (lote === "reatribuir" && agenteId) {
      for (const r of selecionados) {
        updateRequest(r.id, { responsavelId: agenteId });
        logRequest(r.id, `Responsável alterado para ${agentById(agenteId).nome}`, motivo);
      }
      toast.success(`${selecionados.length} caso(s) transferidos para ${agentById(agenteId).nome}`);
    }
    setLote(null);
    setSelecao([]);
  }

  const idxAberto = casoAberto ? ordemVisivel.indexOf(casoAberto.id) : -1;
  function navegarCaso(passo: 1 | -1) {
    if (idxAberto < 0) return;
    const proximo = ordemVisivel[idxAberto + passo];
    if (proximo) setCaso(proximo);
  }

  return (
    <AppShell
      title="Operação"
      subtitle={`${requests.length} casos na base · marcos operacionais, fila por papel e base completa`}
      actions={<NovaSolicitacaoButton />}
    >
      <ResumoOperacao requests={requests} />

      <div
        role="tablist"
        aria-label="Visões da operação"
        className="sticky top-14 z-20 mb-4 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80"
      >
        {(
          [
            ["visao", "Visão geral", LayoutGrid, 0],
            ["fila", "Minha fila", Rows3, 0],
            ["casos", "Todos os casos", List, requests.length],
            ["demo", "Casos demonstrativos", Sparkles, cenarios.length],
          ] as const
        ).map(([id, label, Icon, contagem]) => (
          <button
            key={id}
            role="tab"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              aba === id ? "bg-primary-soft font-medium text-primary-deep" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" /> {label}
            {contagem ? (
              <span
                className={cn(
                  "tabular rounded px-1 text-[10px] font-semibold",
                  aba === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {contagem}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {aba === "visao" && (
        <VisaoGeral
          requests={requests}
          emissoes={emissoesPorCliente}
          onOpen={setCaso}
          selecao={selecao}
          onSelecionar={alternarSelecao}
          onSelecionarVarios={(ids, marcado) =>
            setSelecao((s) => (marcado ? [...new Set([...s, ...ids])] : s.filter((x) => !ids.includes(x))))
          }
          onOrdemVisivel={setOrdemVisivel}
          onAcaoRapida={(id, acaoId) => {
            const r = requests.find((x) => x.id === id);
            const acao = r && acoesDe(r).find((a) => a.id === acaoId);
            if (r && acao) pedirConfirmacao(acao, id);
          }}
          onSolicitarTransicao={(id, marco) => {
            const r = requests.find((x) => x.id === id);
            if (!r) return;
            const acao = acoesDe(r).find((a) => a.destino && marcoDestinoValido(a, marco));
            if (!acao) {
              toast.error("Transição não permitida", {
                description: "Arraste apenas para o próximo marco previsto ou abra o caso para ver as ações.",
              });
              return;
            }
            pedirConfirmacao(acao, id);
          }}
        />
      )}

      {aba === "fila" && (
        <MinhaFila
          requests={requests}
          onOpen={setCaso}
          selecao={selecao}
          onSelecionar={alternarSelecao}
          onOrdemVisivel={setOrdemVisivel}
          onAssumir={(id) => {
            updateRequest(id, { responsavelId: USUARIO_ATUAL.id });
            logRequest(id, "Caso assumido pela fila", `${USUARIO_ATUAL.nome} puxou a tarefa.`);
            toast.success("Tarefa assumida", { description: "O caso passou para a sua fila." });
          }}
        />
      )}

      {aba === "casos" && (
        <TodosOsCasos
          requests={requests}
          onOpen={setCaso}
          selecao={selecao}
          onSelecionar={alternarSelecao}
          onSelecionarVarios={(ids, marcado) =>
            setSelecao((s) => (marcado ? [...new Set([...s, ...ids])] : s.filter((x) => !ids.includes(x))))
          }
          onOrdemVisivel={setOrdemVisivel}
        />
      )}

      {aba === "demo" && <CasosDemonstrativos />}

      <BarraLote quantidade={selecao.length} onLimpar={() => setSelecao([])}>
        <Btn variant="ghost" onClick={() => setLote("assumir")}>
          <Hand className="size-3.5" /> Assumir
        </Btn>
        <Btn variant="ghost" onClick={() => setLote("reatribuir")}>
          <UserCog className="size-3.5" /> Reatribuir
        </Btn>
        <Btn variant="ghost" onClick={() => setLote("priorizar")}>
          <AlertTriangle className="size-3.5" /> Elevar prioridade
        </Btn>
        <Btn onClick={() => setLote("avancar")}>
          <ArrowRight className="size-3.5" /> Avançar etapa
        </Btn>
        <Btn variant="danger" onClick={() => setLote("bloquear")}>
          <Lock className="size-3.5" /> Registrar bloqueio
        </Btn>
      </BarraLote>

      <CasoDrawer
        r={casoAberto}
        onClose={() => setCaso(null)}
        onAcao={(acao) => casoAberto && pedirConfirmacao(acao, casoAberto.id)}
        onToggleChecklist={(itemId) => casoAberto && toggleChecklist(casoAberto.id, itemId)}
        onResponsavel={(agenteId) => {
          if (!casoAberto) return;
          updateRequest(casoAberto.id, { responsavelId: agenteId });
          logRequest(casoAberto.id, `Responsável alterado para ${agentById(agenteId).nome}`);
          toast.success(`Responsável agora é ${agentById(agenteId).nome}`);
        }}
        onNota={(texto) => {
          if (!casoAberto) return;
          logRequest(casoAberto.id, "Nota da operação", texto);
          toast.success("Nota registrada no histórico do caso");
        }}
        {...(idxAberto > 0 ? { onAnterior: () => navegarCaso(-1) } : {})}
        {...(idxAberto >= 0 && idxAberto < ordemVisivel.length - 1 ? { onProximo: () => navegarCaso(1) } : {})}
        {...(idxAberto >= 0 ? { posicao: `${idxAberto + 1} de ${ordemVisivel.length}` } : {})}
        onAbrirFicha={() => {
          if (casoAberto) navigate({ to: "/solicitacoes/$id", params: { id: casoAberto.id } });
        }}
      />

      <ReatribuirDialog
        open={lote === "reatribuir"}
        quantidade={selecao.length}
        sugerido={USUARIO_ATUAL.id}
        onCancel={() => setLote(null)}
        onConfirm={(agenteId, motivo) => aplicarLote(agenteId, motivo)}
      />

      <ConfirmDialog
        open={!!lote && lote !== "reatribuir"}
        title={
          lote === "avancar"
            ? "Avançar etapa em lote"
            : lote === "assumir"
              ? "Assumir casos selecionados"
              : lote === "priorizar"
                ? "Elevar prioridade para crítica"
                : "Registrar bloqueio em lote"
        }
        descricao={`${selecao.length} caso(s) selecionado(s).`}
        confirmLabel="Confirmar"
        {...(lote === "bloquear" ? { destructive: true } : {})}
        onCancel={() => setLote(null)}
        onConfirm={() => aplicarLote()}
      >
        <div className="space-y-2 text-sm">
          {lote === "avancar" ? (
            <>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{previaLote.liberados.length}</span> caso(s) atendem aos
                requisitos e vão avançar.{" "}
                <span className="font-medium text-foreground">{previaLote.barrados.length}</span> ficarão parados.
              </p>
              {previaLote.barrados.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                  {previaLote.barrados.map(({ r, motivo }) => (
                    <li key={r.id} className="text-[11px] text-muted-foreground">
                      <span className="tabular font-medium text-alert">{r.protocolo}</span> — {motivo}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              A ação será aplicada a todos os casos selecionados e registrada individualmente na trilha de auditoria.
            </p>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!pendente}
        title={pendente?.acao.label ?? ""}
        {...(pendente?.acao.descricao ? { descricao: pendente.acao.descricao } : {})}
        confirmLabel="Confirmar ação"
        {...(pendente?.acao.destrutiva ? { destructive: true } : {})}
        onCancel={() => setPendente(null)}
        onConfirm={() => pendente && executar(pendente.acao, pendente.requestId)}
      >
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Esta ação será registrada na trilha de auditoria com seu usuário, horário e origem.
          </p>
          {pendente?.acao.regulatoria && (
            <AvisoRegulatorio>
              Requisito regulatório: a identificação presencial e a emissão seguem a política da ICP e não podem ser
              alteradas nas configurações.
            </AvisoRegulatorio>
          )}
        </div>
      </ConfirmDialog>
    </AppShell>
  );
}

function marcoDestinoValido(acao: AcaoCaso, marco: MarcoId) {
  if (!acao.destino) return false;
  const mapa: Record<string, MarcoId> = {
    novo: "captacao",
    documentacao: "preparacao",
    validacao: "validacao",
    agendamento: "validacao",
    videoconferencia: "validacao",
    emissao: "emissao",
    concluido: "entrega",
  };
  return mapa[acao.destino] === marco;
}

// ------------------------------------------------------- resumo e legenda

function ResumoOperacao({ requests }: { requests: Request[] }) {
  const atrasados = requests.filter((r) => r.slaRestanteHoras < 0).length;
  const criticos = requests.filter((r) => r.prioridade === "critica").length;
  const bloqueados = requests.filter((r) => !bloqueioPrincipal(r).startsWith("Sem bloqueio")).length;
  const semDono = requests.filter((r) => r.responsavelId !== papelEsperadoAgente(r)).length;

  const itens = [
    { label: "Casos ativos", valor: requests.length, tone: "" },
    { label: "SLA estourado", valor: atrasados, tone: "text-alert" },
    { label: "Prioridade crítica", valor: criticos, tone: "text-alert" },
    { label: "Com bloqueio", valor: bloqueados, tone: "text-primary-deep" },
    { label: "Fora do papel esperado", valor: semDono, tone: "text-muted-foreground" },
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
      {itens.map((i) => (
        <div key={i.label} className="bg-card px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{i.label}</p>
          <p className={cn("tabular font-display text-lg font-semibold leading-tight", i.tone)}>{i.valor}</p>
        </div>
      ))}
    </div>
  );
}

function papelEsperadoAgente(r: Request) {
  return perfilById(papelEsperado(r)).agenteId;
}

// ------------------------------------------------------------- visão geral

interface SelecaoProps {
  selecao: string[];
  onSelecionar: (id: string, marcado: boolean) => void;
  onSelecionarVarios: (ids: string[], marcado: boolean) => void;
  onOrdemVisivel: (ids: string[]) => void;
}

function VisaoGeral({
  requests,
  emissoes,
  onOpen,
  onSolicitarTransicao,
  onAcaoRapida,
  selecao,
  onSelecionar,
  onSelecionarVarios,
  onOrdemVisivel,
}: SelecaoProps & {
  requests: Request[];
  emissoes: Record<string, number>;
  onOpen: (id: string) => void;
  onSolicitarTransicao: (id: string, marco: MarcoId) => void;
  onAcaoRapida: (id: string, acaoId: string) => void;
}) {
  const [modo, setModo] = useState<"kanban" | "tabela">("kanban");
  const [responsavel, setResponsavel] = useState("todos");
  const [prioridade, setPrioridade] = useState("todas");
  const [somenteSla, setSomenteSla] = useState(false);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [carga, setCarga] = useState(false);

  const filtrados = useMemo(
    () =>
      requests.filter(
        (r) =>
          (responsavel === "todos" || r.responsavelId === responsavel) &&
          (prioridade === "todas" || r.prioridade === prioridade) &&
          (!somenteSla || r.slaRestanteHoras < 0),
      ),
    [requests, responsavel, prioridade, somenteSla],
  );

  useEffect(() => {
    onOrdemVisivel(filtrados.map((r) => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrados]);

  const filtroAtivo = responsavel !== "todos" || prioridade !== "todas" || somenteSla;



  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Filter className="size-4 text-muted-foreground" />
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs"
        >
          <option value="todos">Todos os responsáveis</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.agenteId}>
              {agentById(p.agenteId).nome}
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
        <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
          {(
            [
              ["kanban", LayoutGrid],
              ["tabela", List],
            ] as const
          ).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setModo(v)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs capitalize transition-colors",
                modo === v ? "bg-primary-soft text-primary-deep" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" /> {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p aria-live="polite" className="text-xs text-muted-foreground">
          Mostrando <span className="tabular font-medium text-foreground">{filtrados.length}</span> de{" "}
          <span className="tabular">{requests.length}</span> casos
        </p>
        {filtroAtivo && (
          <button
            onClick={() => {
              setResponsavel("todos");
              setPrioridade("todas");
              setSomenteSla(false);
            }}
            className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Limpar filtros
          </button>
        )}
        <LegendaProntidao />
        <button
          onClick={() => setCarga((v) => !v)}
          aria-expanded={carga}
          className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {carga ? "Ocultar carga da equipe" : "Ver carga da equipe"}
        </button>
      </div>

      {carga && (
        <div className="mb-3">
          <PainelCarga requests={requests} agenteAtivo={responsavel} onFiltrarAgente={setResponsavel} />
        </div>
      )}

      <p className="mb-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="mt-px size-3 shrink-0" />
        Marcos são uma leitura comparativa do andamento — trilhas comerciais, documentais e regulatórias acontecem em
        paralelo. Toda transição passa por confirmação e pelos requisitos da etapa.
      </p>


      {modo === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {marcos.map((m) => {
            const cards = filtrados.filter((r) => marcoDe(r) === m.id);
            const total = cards.reduce((s, r) => s + r.valor, 0);
            const atrasados = cards.filter((r) => r.slaRestanteHoras < 0).length;
            const ids = cards.map((r) => r.id);
            const todosMarcados = ids.length > 0 && ids.every((id) => selecao.includes(id));
            return (
              <div
                key={m.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (arrastando) onSolicitarTransicao(arrastando, m.id);
                  setArrastando(null);
                }}
                className="flex w-[290px] shrink-0 flex-col rounded-lg border border-border bg-surface"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="pt-0.5">
                      <CaixaSelecao
                        marcada={todosMarcados}
                        rotulo={`Selecionar todos os casos do marco ${m.nome}`}
                        onChange={(v) => onSelecionarVarios(ids, v)}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{m.nome}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{m.descricao}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-semibold">{cards.length}</p>
                    <p className="tabular text-[11px] text-muted-foreground">{brl(total)}</p>
                    {atrasados > 0 && (
                      <p className="tabular text-[10px] font-medium text-alert">{atrasados} fora do prazo</p>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-2 lg:max-h-[calc(100vh-22rem)]">
                  {cards.map((r) => (
                    <div key={r.id} className="relative">
                      <span className="absolute right-2 top-2 z-10">
                        <CaixaSelecao
                          marcada={selecao.includes(r.id)}
                          rotulo={`Selecionar caso ${r.protocolo}`}
                          onChange={(v) => onSelecionar(r.id, v)}
                        />
                      </span>
                      <CasoCard
                        r={r}
                        emissoes={emissoes[r.clienteId] ?? 1}
                        onOpen={() => onOpen(r.id)}
                        onDragStart={() => setArrastando(r.id)}
                        onDragEnd={() => setArrastando(null)}
                        {...(arrastando === r.id ? { arrastando: true } : {})}
                      />
                      <div className="mt-1 flex flex-wrap gap-1">
                        {acoesDe(r)
                          .filter((a) => a.id === "avancar" || a.id === "assumir")
                          .map((a) => {
                            const imp = impedimentoDe(r, a);
                            return (
                              <button
                                key={a.id}
                                onClick={() => onAcaoRapida(r.id, a.id)}
                                disabled={!!imp}
                                title={imp ?? a.descricao}
                                className={cn(
                                  "rounded border px-1.5 py-0.5 text-[10px] transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                                  imp
                                    ? "cursor-not-allowed border-border text-muted-foreground/60"
                                    : "border-border-strong text-muted-foreground hover:border-primary hover:text-primary-deep",
                                )}
                              >
                                {a.id === "assumir" ? "Assumir" : imp ? "Avanço bloqueado" : "Avançar"}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nenhum caso neste marco</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <TabelaCasos
          requests={filtrados}
          onOpen={onOpen}
          selecao={selecao}
          onSelecionar={onSelecionar}
          onSelecionarVarios={onSelecionarVarios}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------ tabela casos

function TabelaCasos({
  requests,
  onOpen,
  selecao,
  onSelecionar,
  onSelecionarVarios,
}: {
  requests: Request[];
  onOpen: (id: string) => void;
  selecao: string[];
  onSelecionar: (id: string, marcado: boolean) => void;
  onSelecionarVarios: (ids: string[], marcado: boolean) => void;
}) {
  const pag = usePaginacao(requests, 25);
  const idsPagina = pag.visiveis.map((r) => r.id);
  const todosMarcados = idsPagina.length > 0 && idsPagina.every((id) => selecao.includes(id));
  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">
                <CaixaSelecao
                  marcada={todosMarcados}
                  rotulo="Selecionar todos os casos desta página"
                  onChange={(v) => onSelecionarVarios(idsPagina, v)}
                />
              </th>
              <th className="px-4 py-2 font-medium">Caso</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Produto</th>
              <th className="px-4 py-2 font-medium">Marco</th>
              <th className="px-4 py-2 font-medium">Prontidão</th>
              <th className="px-4 py-2 font-medium">Responsável</th>
              <th className="px-4 py-2 font-medium">SLA</th>
              <th className="px-4 py-2 font-medium">Próxima ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pag.visiveis.map((r) => (
              <tr
                key={r.id}
                onClick={() => onOpen(r.id)}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  selecao.includes(r.id) && "bg-primary-soft/50",
                )}
              >
                <td className="px-3 py-2.5">
                  <CaixaSelecao
                    marcada={selecao.includes(r.id)}
                    rotulo={`Selecionar caso ${r.protocolo}`}
                    onChange={(v) => onSelecionar(r.id, v)}
                  />
                </td>
                <td className="px-4 py-2.5 tabular text-primary">{r.protocolo}</td>
                <td className="px-4 py-2.5">
                  <p className="truncate">{r.cliente}</p>
                  <p className="text-[11px] text-muted-foreground">{origemDe(r)}</p>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.tipo}</td>
                <td className="px-4 py-2.5">
                  <Chip tone="blue">{marcos.find((m) => m.id === marcoDe(r))?.nome}</Chip>
                </td>
                <td className="px-4 py-2.5">
                  <ProntidaoLinha r={r} />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{agentById(r.responsavelId).nome}</td>
                <td className="px-4 py-2.5">
                  <SlaBadge horas={r.slaRestanteHoras} />
                </td>
                <td className="px-4 py-2.5 text-[11px] text-muted-foreground">
                  <p>{proximaAcaoLabel(r)}</p>
                  <p className="text-alert">{bloqueioPrincipal(r).startsWith("Sem bloqueio") ? "" : bloqueioPrincipal(r)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {requests.length === 0 && (
        <EmptyState titulo="Nenhum caso encontrado" descricao="Ajuste os filtros para ver outros casos." />
      )}
      <Paginacao {...pag} rotulo="casos" />
    </Panel>
  );
}

// ------------------------------------------------------------- todos casos

function TodosOsCasos({
  requests,
  onOpen,
  selecao,
  onSelecionar,
  onSelecionarVarios,
  onOrdemVisivel,
}: SelecaoProps & { requests: Request[]; onOpen: (id: string) => void }) {
  const [busca, setBusca] = useState("");
  const [marco, setMarco] = useState("todos");
  const [origem, setOrigem] = useState("todas");
  const [responsavel, setResponsavel] = useState("todos");
  const [prazo, setPrazo] = useState("todos");
  const [ordem, setOrdem] = useState<"sla" | "valor" | "cliente">("sla");

  const filtrados = useMemo(() => {
    const base = requests.filter((r) => {
      const texto = `${r.protocolo} ${r.cliente} ${r.documento} ${r.tipo}`.toLowerCase();
      return (
        (busca === "" || texto.includes(busca.toLowerCase())) &&
        (marco === "todos" || marcoDe(r) === marco) &&
        (responsavel === "todos" || r.responsavelId === responsavel) &&
        (prazo === "todos" ||
          (prazo === "vencido" && r.slaRestanteHoras < 0) ||
          (prazo === "hoje" && r.slaRestanteHoras >= 0 && r.slaRestanteHoras <= 8) ||
          (prazo === "futuro" && r.slaRestanteHoras > 8)) &&
        (origem === "todas" ||
          (origem === "parceiro" ? origemDe(r).startsWith("Contabilidade") : !origemDe(r).startsWith("Contabilidade")))
      );
    });
    return [...base].sort((a, b) =>
      ordem === "sla"
        ? a.slaRestanteHoras - b.slaRestanteHoras
        : ordem === "valor"
          ? b.valor - a.valor
          : a.cliente.localeCompare(b.cliente),
    );
  }, [requests, busca, marco, origem, responsavel, prazo, ordem]);

  useEffect(() => {
    onOrdemVisivel(filtrados.map((r) => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrados]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por protocolo, cliente ou documento"
          className="min-w-56 flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
        />
        <SelectFiltro value={marco} onChange={setMarco}>
          <option value="todos">Todos os marcos</option>
          {marcos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </SelectFiltro>
        <SelectFiltro value={responsavel} onChange={setResponsavel}>
          <option value="todos">Todos os responsáveis</option>
          {agentesOperacao.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </SelectFiltro>
        <SelectFiltro value={prazo} onChange={setPrazo}>
          <option value="todos">Qualquer prazo</option>
          <option value="vencido">SLA estourado</option>
          <option value="hoje">Vence em até 8h</option>
          <option value="futuro">Prazo folgado</option>
        </SelectFiltro>
        <SelectFiltro value={origem} onChange={setOrigem}>
          <option value="todas">Toda origem</option>
          <option value="parceiro">Indicação de contabilidade</option>
          <option value="direto">Canal direto</option>
        </SelectFiltro>
        <SelectFiltro value={ordem} onChange={(v) => setOrdem(v as "sla")}>
          <option value="sla">Ordenar por SLA</option>
          <option value="valor">Ordenar por valor</option>
          <option value="cliente">Ordenar por cliente</option>
        </SelectFiltro>
        <span className="tabular ml-auto text-[11px] text-muted-foreground">{filtrados.length} casos</span>
      </div>
      <TabelaCasos
        requests={filtrados}
        onOpen={onOpen}
        selecao={selecao}
        onSelecionar={onSelecionar}
        onSelecionarVarios={onSelecionarVarios}
      />
    </>
  );
}

// ---------------------------------------------------------------- minha fila

const STORAGE_VIEWS = "certus-op-views-v1";

function MinhaFila({ requests, onOpen }: { requests: Request[]; onOpen: (id: string) => void }) {
  const [perfil, setPerfil] = useState<PerfilId>("agr");
  const [escopo, setEscopo] = useState<"minhas" | "equipe" | "livres">("minhas");
  const [filtros, setFiltros] = useState<FiltrosFila>(filtrosPadrao);
  const [estado, setEstado] = useState<"ok" | "carregando" | "erro">("carregando");
  const [views, setViews] = useState<{ nome: string; perfil: PerfilId; filtros: FiltrosFila }[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [nomeView, setNomeView] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_VIEWS);
      if (raw) setViews(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function carregar(falhar = false) {
    setEstado("carregando");
    window.setTimeout(() => setEstado(falhar ? "erro" : "ok"), 700);
  }

  useEffect(() => {
    carregar();
  }, [perfil]);

  const tarefas = useMemo(() => tarefasDe(requests), [requests]);
  const perfilAtual = perfilById(perfil);

  const doEscopo = useMemo(
    () =>
      tarefas.filter((t) => {
        if (escopo === "minhas") return t.papel === perfil && t.atribuida;
        if (escopo === "equipe") return t.papel === perfil;
        return !t.atribuida;
      }),
    [tarefas, escopo, perfil],
  );

  const lista = useMemo(() => {
    const filtrada = doEscopo.filter((t) => {
      const unidade = unidadeDe(t.request);
      const parceiro = t.origem.startsWith("Contabilidade");
      return (
        (filtros.papel === "todos" || t.papel === filtros.papel) &&
        (filtros.unidade === "todas" || unidade === filtros.unidade) &&
        (filtros.tipo === "todos" || t.tipo === filtros.tipo) &&
        (filtros.origem === "todas" || (filtros.origem === "parceiro" ? parceiro : !parceiro)) &&
        (filtros.prazo === "todos" ||
          (filtros.prazo === "vencido" && t.prazoHoras < 0) ||
          (filtros.prazo === "hoje" && t.prazoHoras >= 0 && t.prazoHoras <= 8) ||
          (filtros.prazo === "futuro" && t.prazoHoras > 8))
      );
    });
    return [...filtrada].sort((a, b) =>
      filtros.ordem === "prioridade"
        ? pesoPrioridade[a.prioridade] - pesoPrioridade[b.prioridade] || a.prazoHoras - b.prazoHoras
        : a.prazoHoras - b.prazoHoras,
    );
  }, [doEscopo, filtros]);

  const pag = usePaginacao(lista, 10);

  // Contagem por escopo: o usuário vê onde há trabalho antes de trocar de aba.
  const contagemEscopo = {
    minhas: tarefas.filter((t) => t.papel === perfil && t.atribuida).length,
    equipe: tarefas.filter((t) => t.papel === perfil).length,
    livres: tarefas.filter((t) => !t.atribuida).length,
  } as const;

  function salvarView() {
    const nova = { nome: nomeView.trim() || `Visualização ${views.length + 1}`, perfil, filtros };
    const proximas = [...views.filter((v) => v.nome !== nova.nome), nova];
    setViews(proximas);
    try {
      localStorage.setItem(STORAGE_VIEWS, JSON.stringify(proximas));
    } catch {
      /* ignore */
    }
    setSalvando(false);
    setNomeView("");
    toast.success("Visualização salva", { description: `“${nova.nome}” disponível para este perfil.` });
  }

  return (
    <div className="space-y-3">
      <Panel
        title="Perfil de demonstração"
        hint="Veja a fila exatamente como cada papel da operação enxerga."
        bodyClassName="p-3"
        actions={
          <div className="flex items-center gap-1.5">
            <Btn variant="ghost" onClick={() => carregar()}>
              <RefreshCw className="size-3.5" /> Recarregar
            </Btn>
            <Btn variant="ghost" onClick={() => carregar(true)}>
              <AlertTriangle className="size-3.5" /> Simular falha
            </Btn>
          </div>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {perfis.map((p) => (
            <button
              key={p.id}
              onClick={() => setPerfil(p.id)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-left transition-colors",
                perfil === p.id
                  ? "border-primary bg-primary-soft text-primary-deep"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              <span className="block text-xs font-semibold">
                {p.sigla} · {p.nome}
              </span>
              <span className="block text-[10px]">{p.descricao}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
        {(
          [
            ["minhas", "Minhas"],
            ["equipe", "Minha equipe"],
            ["livres", "Não atribuídas"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={escopo === id}
            onClick={() => setEscopo(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              escopo === id ? "bg-primary-soft font-medium text-primary-deep" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <span
              className={cn(
                "tabular rounded px-1 text-[10px] font-semibold",
                escopo === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {contagemEscopo[id]}
            </span>
          </button>
        ))}
        <span className="tabular ml-auto px-2 text-[11px] text-muted-foreground">
          {lista.length} tarefa(s) para {perfilAtual.nome}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Filter className="size-4 text-muted-foreground" />
        <SelectFiltro value={filtros.papel} onChange={(v) => setFiltros({ ...filtros, papel: v })}>
          <option value="todos">Todos os papéis</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sigla} · {p.nome}
            </option>
          ))}
        </SelectFiltro>
        <SelectFiltro value={filtros.unidade} onChange={(v) => setFiltros({ ...filtros, unidade: v })}>
          <option value="todas">Todas as unidades</option>
          {unidades.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </SelectFiltro>
        <SelectFiltro value={filtros.prazo} onChange={(v) => setFiltros({ ...filtros, prazo: v })}>
          <option value="todos">Qualquer prazo</option>
          <option value="vencido">Vencido</option>
          <option value="hoje">Vence em até 8h</option>
          <option value="futuro">Prazo folgado</option>
        </SelectFiltro>
        <SelectFiltro value={filtros.tipo} onChange={(v) => setFiltros({ ...filtros, tipo: v })}>
          <option value="todos">Toda pendência</option>
          {tiposPendencia.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </SelectFiltro>
        <SelectFiltro value={filtros.origem} onChange={(v) => setFiltros({ ...filtros, origem: v })}>
          <option value="todas">Toda origem</option>
          <option value="parceiro">Indicação de contabilidade</option>
          <option value="direto">Canal direto</option>
        </SelectFiltro>
        <SelectFiltro value={filtros.ordem} onChange={(v) => setFiltros({ ...filtros, ordem: v as "prioridade" })}>
          <option value="prioridade">Ordenar por prioridade</option>
          <option value="vencimento">Ordenar por vencimento</option>
        </SelectFiltro>
        <div className="ml-auto flex items-center gap-1.5">
          <Btn variant="ghost" onClick={() => setFiltros(filtrosPadrao)}>
            Limpar
          </Btn>
          <Btn variant="ghost" onClick={() => setSalvando(true)}>
            <Save className="size-3.5" /> Salvar visualização
          </Btn>
        </div>
      </div>

      {views.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] text-muted-foreground">Salvas:</span>
          {views.map((v) => (
            <button
              key={v.nome}
              onClick={() => {
                setPerfil(v.perfil);
                setFiltros(v.filtros);
                toast.success(`Visualização “${v.nome}” aplicada`);
              }}
              className="inline-flex items-center gap-1 rounded border border-border-strong px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Bookmark className="size-3" /> {v.nome}
            </button>
          ))}
        </div>
      )}

      <Panel bodyClassName="p-0">
        {estado === "carregando" ? (
          <SkeletonLinhas />
        ) : estado === "erro" ? (
          <ErroEstado onRetry={() => carregar()} />
        ) : lista.length === 0 ? (
          <EmptyState
            titulo="Nada pendente por aqui"
            descricao={`Nenhuma tarefa de ${perfilAtual.nome} corresponde aos filtros. Tente a aba “Não atribuídas”.`}
            acao={
              <Btn variant="ghost" onClick={() => setFiltros(filtrosPadrao)}>
                Limpar filtros
              </Btn>
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-border">
              {pag.visiveis.map((t) => (
                <TarefaLinha key={t.id} t={t} onOpen={() => onOpen(t.request.id)} />
              ))}
            </ul>
            <Paginacao {...pag} rotulo="tarefas" />
          </>
        )}
      </Panel>

      <Modal
        open={salvando}
        onClose={() => setSalvando(false)}
        title="Salvar visualização"
        hint="Guarda perfil, filtros e ordenação para reabrir depois."
        width="max-w-sm"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setSalvando(false)}>
              Cancelar
            </Btn>
            <Btn onClick={salvarView}>Salvar</Btn>
          </>
        }
      >
        <Field label="Nome da visualização">
          <input
            value={nomeView}
            onChange={(e) => setNomeView(e.target.value)}
            placeholder="Ex.: Verificadora · vencendo hoje"
            className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
      </Modal>
    </div>
  );
}

function SelectFiltro({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-card px-2 py-1 text-xs"
    >
      {children}
    </select>
  );
}

function TarefaLinha({ t, onOpen }: { t: Tarefa; onOpen: () => void }) {
  return (
    <li>
      <button onClick={onOpen} className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-semibold">{t.acao}</span>
          <Chip tone={prioridadeTone[t.prioridade]}>{t.prioridade}</Chip>
          <SlaBadge horas={t.prazoHoras} />
          <Chip tone="outline">{tiposPendencia.find((x) => x.id === t.tipo)?.nome}</Chip>
          {!t.atribuida && <Chip tone="neutral">Não atribuída</Chip>}
          <span className="tabular ml-auto text-[11px] text-muted-foreground">{t.request.protocolo}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.request.cliente} · {t.request.tipo} · {unidadeDe(t.request)} · {t.origem}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <AlertTriangle className="size-3" /> {t.motivo}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" /> {t.aguardando}
          </span>
          <span className="flex items-center gap-1">
            <ArrowRight className="size-3" /> Próximo: {t.proximoResponsavel}
          </span>
        </p>
      </button>
    </li>
  );
}

// -------------------------------------------------------------- caso drawer

function CasoDrawer({
  r,
  onClose,
  onAcao,
  onAbrirFicha,
}: {
  r: Request | null;
  onClose: () => void;
  onAcao: (acao: AcaoCaso) => void;
  onAbrirFicha: () => void;
}) {
  if (!r) return null;
  const acoes = acoesDe(r);
  const pendentes = pendenciasDe(r);
  const marco = marcos.find((m) => m.id === marcoDe(r));

  return (
    <Modal
      open
      onClose={onClose}
      title={`${r.protocolo} · ${r.cliente}`}
      hint={`${r.tipo} · ${brl(r.valor)} · ${origemDe(r)}`}
      width="max-w-2xl"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Fechar
          </Btn>
          <Btn onClick={onAbrirFicha}>Abrir ficha completa</Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone="blue">{marco?.nome}</Chip>
          <Chip tone="outline">Etapa: {stages.find((s) => s.id === r.stage)?.nome}</Chip>
          <Chip tone={prioridadeTone[r.prioridade]}>{r.prioridade}</Chip>
          <SlaBadge horas={r.slaRestanteHoras} />
          <Chip tone="neutral">Responsável: {agentById(r.responsavelId).nome}</Chip>
          <Chip tone="neutral">{unidadeDe(r)}</Chip>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Prontidão por trilha
          </p>
          <ProntidaoLinha r={r} completo />
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Principal bloqueio
          </p>
          <p className="text-sm">{bloqueioPrincipal(r)}</p>
          {pendentes.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {pendentes.map((p) => (
                <li key={p.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-alert" /> {p.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Ações permitidas
          </p>
          <div className="space-y-1.5">
            {acoes.map((a) => {
              const impedimento = impedimentoDe(r, a);
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {impedimento ? <Lock className="size-3.5 text-alert" /> : <Check className="size-3.5 text-primary" />}
                      {a.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{impedimento ?? a.descricao}</p>
                  </div>
                  <Btn
                    variant={a.destrutiva ? "danger" : impedimento ? "ghost" : "primary"}
                    disabled={!!impedimento}
                    onClick={() => onAcao(a)}
                  >
                    {impedimento ? "Bloqueada" : "Executar"}
                  </Btn>
                </div>
              );
            })}
          </div>
          <div className="mt-2">
            <AvisoRegulatorio>
              Requisitos regulatórios e de segurança (identificação do titular, videoconferência e emissão) são fixos e
              não podem ser desativados por configuração.
            </AvisoRegulatorio>
          </div>
        </div>
      </div>
    </Modal>
  );
}


// -------------------------------------------------- casos demonstrativos
function CasosDemonstrativos() {
  return (
    <Panel
      title="Casos demonstrativos"
      hint="Oito situações que cobrem o modelo completo — abra cada uma para ver a regra em ação"
      bodyClassName="p-0"
    >
      <ul className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
        {cenarios.map((c) => (
          <li key={c.id} className="bg-card p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-medium">{c.titulo}</h3>
              <Chip tone={c.bloqueioAbsoluto ? "alert" : c.bloqueio ? "deep" : "blue"}>
                {c.bloqueioAbsoluto ? "Bloqueio de conformidade" : c.bloqueio ? "Bloqueado" : "Em curso"}
              </Chip>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.resumo}</p>
            <ul className="mt-2 space-y-1">
              {c.observar.slice(0, 3).map((o) => (
                <li key={o} className="flex gap-1.5 text-[11px] text-muted-foreground">
                  <ArrowRight className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Link
                to="/solicitacoes/$id"
                params={{ id: c.request.id }}
                search={{ aba: "visao" }}
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Abrir caso
              </Link>
              <Link
                to="/solicitacoes/$id"
                params={{ id: c.request.id }}
                search={{ aba: "emissoes" }}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                Emissões
              </Link>
              <Link
                to="/solicitacoes/$id"
                params={{ id: c.request.id }}
                search={{ aba: "dossie" }}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                Dossiê
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
