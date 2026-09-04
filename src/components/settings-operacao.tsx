// "Operação & perfis" — configura o perfil operacional dentro de limites do
// produto: marcos canônicos fixos, subfluxos controlados, escopo com
// precedência declarada, versionamento, simulador e validações de publicação.
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GitCompare,
  History,
  Lock,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Btn, ConfirmDialog, Field, Modal, SelectInput, TextArea, TextInput } from "@/components/forms";
import { Grid, Rows, Toggle } from "@/components/settings-kit";
import { Chip, Panel } from "@/components/ui-kit";
import {
  APLICABILIDADES,
  CENARIOS,
  ESCOPOS,
  MARCOS,
  ORIGENS,
  PAPEIS_OPERACAO,
  novaEtapaConfig,
  novoItemChecklist,
  simular,
  type Canal,
  type EtapaConfig,
  type MarcoId,
  type OrigemRegra,
} from "@/lib/opconfig-model";
import { useOpConfig } from "@/lib/opconfig-store";
import { cn } from "@/lib/utils";

const CANAIS: { id: Canal; label: string }[] = [
  { id: "email", label: "E-mail" },
  { id: "push", label: "Push" },
  { id: "whatsapp", label: "WhatsApp" },
];

const abas = [
  { id: "marcos", label: "Marcos & etapas" },
  { id: "subfluxos", label: "Subfluxos" },
  { id: "escopo", label: "Escopo & precedência" },
  { id: "versoes", label: "Versões" },
  { id: "simulador", label: "Simulador" },
  { id: "validacoes", label: "Validações" },
] as const;

type AbaId = (typeof abas)[number]["id"];

function OrigemChip({ origem }: { origem: OrigemRegra }) {
  const o = ORIGENS[origem];
  return (
    <Chip tone={o.editavel ? "outline" : "blue"} className="gap-1">
      {!o.editavel && <Lock className="size-3" />}
      {o.label}
    </Chip>
  );
}

function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ Raiz */

export function SecaoOperacaoPerfis() {
  const [aba, setAba] = useState<AbaId>("marcos");
  const { rascunho, publicada, dirty, achados, permissoes } = useOpConfig();
  const erros = achados.filter((a) => a.tipo === "erro").length;

  return (
    <div className="space-y-4">
      <Panel
        title="Operação & perfis"
        hint="O administrador não desenha workflows livres: configura um perfil operacional seguro dentro dos limites do produto."
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Chip tone="deep">Publicada {publicada.numero}</Chip>
          {dirty ? <Chip tone="alert">Rascunho com alterações</Chip> : <Chip tone="blue">Rascunho igual à publicada</Chip>}
          <Chip tone={erros ? "alert" : "outline"}>
            {erros ? `${erros} bloqueio(s) de publicação` : "Sem bloqueios de publicação"}
          </Chip>
          <Chip tone="outline">
            Escopo: {ESCOPOS.find((e) => e.tipo === rascunho.escopo.tipo)?.label} · {rascunho.escopo.alvo}
          </Chip>
          {!permissoes.publicar && <Chip tone="outline">Você só pode editar rascunho</Chip>}
        </div>
        <p className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Esta versão será aplicada aos novos casos. Casos em andamento continuam usando a versão com que foram criados.
          <br />
          <span className="text-foreground">
            Regras legais, controles de segurança, capabilities revogadas e bloqueios emergenciais continuam prevalecendo
            sobre versões antigas.
          </span>
        </p>
      </Panel>

      <div className="flex gap-1.5 overflow-x-auto rounded-lg border border-border bg-card p-1.5">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
              aba === a.id ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {a.label}
            {a.id === "validacoes" && erros > 0 && <span className="ml-1.5 tabular text-[11px]">({erros})</span>}
          </button>
        ))}
      </div>

      {aba === "marcos" && <AbaMarcos />}
      {aba === "subfluxos" && <AbaSubfluxos />}
      {aba === "escopo" && <AbaEscopo />}
      {aba === "versoes" && <AbaVersoes />}
      {aba === "simulador" && <AbaSimulador />}
      {aba === "validacoes" && <AbaValidacoes />}
    </div>
  );
}

/* --------------------------------------------------------- Marcos & etapas */

function AbaMarcos() {
  const { rascunho, patchEtapas, permissoes } = useOpConfig();
  const [sel, setSel] = useState<string | undefined>(rascunho.etapas[0]?.id);
  const [criando, setCriando] = useState<MarcoId | null>(null);
  const [draft, setDraft] = useState({ nome: "", papel: PAPEIS_OPERACAO[0] as string });
  const atual = rascunho.etapas.find((e) => e.id === sel);
  const somenteLeitura = !permissoes.editarRascunho;

  const mover = (id: string, dir: -1 | 1) =>
    patchEtapas((l) => {
      const etapa = l.find((e) => e.id === id);
      if (!etapa) return l;
      const irmas = l.filter((e) => e.marco === etapa.marco);
      const i = irmas.findIndex((e) => e.id === id);
      const alvo = i + dir;
      if (alvo < 0 || alvo >= irmas.length) return l;
      const ordem = [...irmas];
      const [it] = ordem.splice(i, 1);
      if (it) ordem.splice(alvo, 0, it);
      let k = 0;
      return l.map((e) => (e.marco === etapa.marco ? ordem[k++]! : e));
    });

  return (
    <div className="space-y-4">
      <Panel
        title="Marcos canônicos"
        hint="Os seis marcos são fixos: não podem ser removidos nem reordenados. Você configura o que acontece dentro de cada um."
        bodyClassName="p-0"
      >
        <div className="divide-y divide-border">
          {MARCOS.map((m, idx) => {
            const etapas = rascunho.etapas.filter((e) => e.marco === m.id);
            return (
              <div key={m.id} className="p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded bg-primary-soft text-[11px] font-semibold text-primary-deep tabular">
                        {idx + 1}
                      </span>
                      <h3 className="font-display text-sm font-semibold">{m.nome}</h3>
                      <Chip tone="outline" className="gap-1">
                        <Lock className="size-3" /> Marco fixo
                      </Chip>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{m.proposito}</p>
                    <p className="text-[11px] text-muted-foreground/80">{m.invariante}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Remover marco ${m.nome}`}
                      onClick={() =>
                        toast.error("Marco fixo não pode ser removido", {
                          description: m.invariante,
                        })
                      }
                      className="grid size-7 place-items-center rounded border border-dashed border-border text-muted-foreground/60"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <Btn
                      variant="ghost"
                      disabled={somenteLeitura}
                      onClick={() => {
                        setCriando(m.id);
                        setDraft({ nome: "", papel: PAPEIS_OPERACAO[0] });
                      }}
                    >
                      <Plus className="size-4" /> Etapa interna
                    </Btn>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {etapas.length === 0 && (
                    <span className="text-xs text-alert">Nenhuma etapa ativa — o marco não pode ficar vazio.</span>
                  )}
                  {etapas.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSel(e.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                        e.id === sel
                          ? "border-primary bg-primary text-primary-foreground"
                          : e.ativa
                            ? "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                            : "border-dashed border-border text-muted-foreground/60",
                      )}
                    >
                      {!ORIGENS[e.origem].editavel && <Lock className="size-3" />}
                      {e.nome}
                      <span className="tabular opacity-70">{e.slaHoras}h</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {atual && <EditorEtapaOperacao etapa={atual} onMover={mover} somenteLeitura={somenteLeitura} />}

      <Modal
        open={criando !== null}
        onClose={() => setCriando(null)}
        title={`Nova etapa em ${MARCOS.find((m) => m.id === criando)?.nome ?? ""}`}
        hint="A etapa nasce dentro do marco escolhido. Marcos e ordem entre marcos permanecem fixos."
        width="max-w-md"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCriando(null)}>
              Cancelar
            </Btn>
            <Btn
              onClick={() => {
                if (!draft.nome.trim() || !criando) {
                  toast.error("Dê um nome à etapa.");
                  return;
                }
                const nova = novaEtapaConfig(criando, draft.nome.trim(), draft.papel);
                patchEtapas((l) => [...l, nova]);
                setSel(nova.id);
                setCriando(null);
                toast.success("Etapa adicionada ao rascunho", { description: "Publique para valer nos novos casos." });
              }}
            >
              Adicionar etapa
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Nome exibido">
            <TextInput value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex.: Conferência jurídica" />
          </Field>
          <Field label="Papel responsável">
            <SelectInput value={draft.papel} onChange={(e) => setDraft({ ...draft, papel: e.target.value })}>
              {PAPEIS_OPERACAO.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function EditorEtapaOperacao({
  etapa,
  onMover,
  somenteLeitura,
}: {
  etapa: EtapaConfig;
  onMover: (id: string, dir: -1 | 1) => void;
  somenteLeitura: boolean;
}) {
  const { updateEtapa, patchEtapas } = useOpConfig();
  const [novoItem, setNovoItem] = useState("");
  const [removendo, setRemovendo] = useState(false);
  const travada = !ORIGENS[etapa.origem].editavel;
  const bloqueado = somenteLeitura || travada;

  return (
    <Panel
      title={`Etapa: ${etapa.nome}`}
      hint={MARCOS.find((m) => m.id === etapa.marco)?.nome ?? ""}
      actions={
        <div className="flex items-center gap-1.5">
          <OrigemChip origem={etapa.origem} />
          <button
            type="button"
            aria-label="Mover etapa para cima"
            onClick={() => onMover(etapa.id, -1)}
            disabled={somenteLeitura}
            className="grid size-7 place-items-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ArrowUp className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Mover etapa para baixo"
            onClick={() => onMover(etapa.id, 1)}
            disabled={somenteLeitura}
            className="grid size-7 place-items-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ArrowDown className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Remover etapa"
            onClick={() =>
              etapa.removivel && !bloqueado
                ? setRemovendo(true)
                : toast.error("Etapa protegida", {
                    description: travada
                      ? `Regra de origem ${ORIGENS[etapa.origem].label} — ${ORIGENS[etapa.origem].hint}`
                      : "Etapa obrigatória do produto: só pode ser configurada, não removida.",
                  })
            }
            className="grid size-7 place-items-center rounded border border-border text-muted-foreground hover:border-alert hover:text-alert"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      }
    >
      {travada && (
        <p className="mb-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          {ORIGENS[etapa.origem].hint} Você pode ajustar apenas checklist complementar, instruções e notificações.
        </p>
      )}

      <Grid>
        <Field label="Nome exibido">
          <TextInput value={etapa.nome} disabled={bloqueado} onChange={(e) => updateEtapa(etapa.id, { nome: e.target.value })} />
        </Field>
        <Field label="Papel responsável">
          <SelectInput value={etapa.papel} disabled={bloqueado} onChange={(e) => updateEtapa(etapa.id, { papel: e.target.value })}>
            {PAPEIS_OPERACAO.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="SLA da etapa (horas)">
          <TextInput
            type="number"
            min={0}
            value={etapa.slaHoras}
            disabled={somenteLeitura}
            onChange={(e) => updateEtapa(etapa.id, { slaHoras: Number(e.target.value) })}
          />
        </Field>
        <Field label="Aplicabilidade">
          <SelectInput
            value={etapa.aplicabilidade[0] ?? "Todos os produtos"}
            disabled={bloqueado}
            onChange={(e) => updateEtapa(etapa.id, { aplicabilidade: [e.target.value] })}
          >
            {APLICABILIDADES.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Critério de entrada">
          <TextInput value={etapa.criterioEntrada} disabled={bloqueado} onChange={(e) => updateEtapa(etapa.id, { criterioEntrada: e.target.value })} />
        </Field>
        <Field label="Critério de saída">
          <TextInput value={etapa.criterioSaida} disabled={bloqueado} onChange={(e) => updateEtapa(etapa.id, { criterioSaida: e.target.value })} />
        </Field>
      </Grid>

      <div className="mt-3">
        <Field label="Instruções para o operador">
          <TextArea
            rows={3}
            value={etapa.instrucoes}
            disabled={somenteLeitura}
            onChange={(e) => updateEtapa(etapa.id, { instrucoes: e.target.value })}
            placeholder="O que a pessoa precisa fazer, conferir e registrar nesta etapa."
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Checklist</p>
          <div className="divide-y divide-border rounded-md border border-border">
            {etapa.checklist.length === 0 && <p className="p-3 text-xs text-muted-foreground">Nenhum item.</p>}
            {etapa.checklist.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2">
                <TextInput
                  value={c.label}
                  disabled={somenteLeitura}
                  onChange={(e) =>
                    updateEtapa(etapa.id, {
                      checklist: etapa.checklist.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)),
                    })
                  }
                />
                <button
                  type="button"
                  disabled={somenteLeitura}
                  onClick={() =>
                    updateEtapa(etapa.id, {
                      checklist: etapa.checklist.map((x) => (x.id === c.id ? { ...x, obrigatorio: !x.obrigatorio } : x)),
                    })
                  }
                  className={cn(
                    "shrink-0 rounded border px-1.5 py-1 text-[11px]",
                    c.obrigatorio ? "border-primary bg-primary-soft text-primary-deep" : "border-border text-muted-foreground",
                  )}
                >
                  {c.obrigatorio ? "Obrigatório" : "Opcional"}
                </button>
                <button
                  type="button"
                  aria-label={`Remover ${c.label}`}
                  disabled={somenteLeitura}
                  onClick={() => updateEtapa(etapa.id, { checklist: etapa.checklist.filter((x) => x.id !== c.id) })}
                  className="shrink-0 text-muted-foreground hover:text-alert"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <form
            className="mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!novoItem.trim()) return;
              updateEtapa(etapa.id, { checklist: [...etapa.checklist, novoItemChecklist(novoItem.trim())] });
              setNovoItem("");
            }}
          >
            <TextInput
              value={novoItem}
              disabled={somenteLeitura}
              onChange={(e) => setNovoItem(e.target.value)}
              placeholder="Adicionar item ao checklist…"
            />
          </form>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Notificações e controles</p>
          <Rows>
            <Toggle
              label="Avisar o papel responsável na chegada"
              checked={etapa.avisarPapel}
              disabled={somenteLeitura}
              onChange={(v) => updateEtapa(etapa.id, { avisarPapel: v })}
            />
            <Toggle
              label="Avisar o titular"
              checked={etapa.avisarCliente}
              disabled={somenteLeitura}
              onChange={(v) => updateEtapa(etapa.id, { avisarCliente: v })}
            />
            <Toggle
              label="Etapa ativa"
              hint={etapa.obrigatoria ? "Etapa obrigatória do produto — não pode ser desativada." : ""}
              checked={etapa.ativa}
              disabled={somenteLeitura || etapa.obrigatoria}
              onChange={(v) => updateEtapa(etapa.id, { ativa: v })}
            />
            <Toggle
              label="Segregação obrigatória"
              hint="Executor e verificador precisam ser pessoas/papéis diferentes."
              checked={etapa.segregacaoObrigatoria}
              disabled={bloqueado}
              onChange={(v) => updateEtapa(etapa.id, { segregacaoObrigatoria: v })}
            />
          </Rows>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CANAIS.map((c) => {
              const on = etapa.canais.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={somenteLeitura}
                  onClick={() =>
                    updateEtapa(etapa.id, {
                      canais: on ? etapa.canais.filter((x) => x !== c.id) : [...etapa.canais, c.id],
                    })
                  }
                  className={cn(
                    "rounded border px-2 py-1 text-[11px]",
                    on ? "border-primary bg-primary-soft text-primary-deep" : "border-border text-muted-foreground",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {etapa.segregacaoObrigatoria && (
            <div className="mt-3">
              <Field label="Papel verificador">
                <SelectInput
                  value={etapa.papelVerificador}
                  disabled={bloqueado}
                  onChange={(e) => updateEtapa(etapa.id, { papelVerificador: e.target.value })}
                >
                  <option value="">Selecionar…</option>
                  {PAPEIS_OPERACAO.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          )}

          {etapa.portao && (
            <div className="mt-3 rounded-md border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium">Portão desta etapa</p>
              <p className="text-xs text-muted-foreground">Exige: {etapa.portao.exige}</p>
              <div className="mt-2">
                <Field label="Autorizador do portão">
                  <SelectInput
                    value={etapa.portao.autorizador}
                    disabled={somenteLeitura}
                    onChange={(e) => updateEtapa(etapa.id, { portao: { ...etapa.portao!, autorizador: e.target.value } })}
                  >
                    <option value="">Sem autorizador</option>
                    {PAPEIS_OPERACAO.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={removendo}
        onCancel={() => setRemovendo(false)}
        title={`Remover a etapa “${etapa.nome}”?`}
        descricao="A etapa sai do rascunho. Casos em andamento continuam com a versão em que foram criados."
        confirmLabel="Remover etapa"
        onConfirm={() => {
          patchEtapas((l) => l.filter((e) => e.id !== etapa.id));
          setRemovendo(false);
          toast.success("Etapa removida do rascunho");
        }}
      />
    </Panel>
  );
}

/* ---------------------------------------------------------------- Subfluxos */

function AbaSubfluxos() {
  const { rascunho, updateSubfluxo, permissoes } = useOpConfig();
  const somenteLeitura = !permissoes.editarRascunho;
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const lista = rascunho.subfluxos.filter((s) =>
    `${s.nome} ${s.descricao} ${s.gatilho} ${s.responsavel}`.toLowerCase().includes(busca.trim().toLowerCase()),
  );
  const aberto = rascunho.subfluxos.find((s) => s.id === abrindo);
  const ativos = rascunho.subfluxos.filter((s) => s.ativo).length;

  return (
    <div className="space-y-4">
      <Panel
        title="Catálogo de subfluxos"
        hint="Subfluxos são exceções pré-definidas pelo produto. Você liga, escolhe quem responde, o prazo, os avisos e monta o checklist — sem criar loops ou ligações arbitrárias."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="outline">
              {ativos} de {rascunho.subfluxos.length} ativos
            </Chip>
            <div className="w-44">
              <TextInput
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar subfluxo"
                placeholder="Buscar subfluxo…"
              />
            </div>
          </div>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-border">
          {lista.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-muted-foreground">Nenhum subfluxo com esse termo.</li>
          )}
          {lista.map((s) => {
            const dependente = s.dependeHomologacao && !s.homologado;
            const obrigatorios = s.checklist.filter((c) => c.obrigatorio).length;
            return (
              <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-sm font-semibold">{s.nome}</h3>
                    <OrigemChip origem={s.origem} />
                    {dependente && <Chip tone="alert">Aguarda homologação da AC</Chip>}
                    {s.ativo && !dependente && <Chip tone="blue">Ativo</Chip>}
                    {!s.ativo && <Chip tone="outline">Desligado</Chip>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.descricao}</p>
                  <p className="text-[11px] text-muted-foreground/80">Dispara quando: {s.gatilho}</p>
                  {s.ativo && (
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>Responsável: {s.responsavel || "— não definido"}</span>
                      <span className="tabular">SLA {s.slaHoras}h</span>
                      <span className="tabular">
                        {s.checklist.length} itens no checklist ({obrigatorios} obrigatórios)
                      </span>
                      <span>Avisos: {s.canais.length ? s.canais.map((c) => CANAIS.find((x) => x.id === c)?.label).join(", ") : "nenhum"}</span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Btn variant="ghost" onClick={() => setAbrindo(s.id)}>
                    <Pencil className="size-4" /> {somenteLeitura ? "Ver" : "Configurar"}
                  </Btn>
                  <div className="w-28">
                    <Toggle
                      label={s.ativo ? "Ligado" : "Desligado"}
                      checked={s.ativo}
                      disabled={somenteLeitura}
                      onChange={(v) => {
                        if (v && dependente) {
                          toast.error("Capability não confirmada pela AC", {
                            description: "Este subfluxo só pode valer após homologação. A ativação fica registrada como pendência de publicação.",
                          });
                        }
                        updateSubfluxo(s.id, { ativo: v });
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Modal
        open={aberto !== undefined}
        onClose={() => setAbrindo(null)}
        title={aberto ? `Subfluxo: ${aberto.nome}` : ""}
        hint={aberto?.descricao}
        width="max-w-2xl"
        footer={
          <Btn onClick={() => setAbrindo(null)}>Concluir</Btn>
        }
      >
        {aberto && (
          <div className="space-y-4">
            <p className="rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
              Dispara quando: <span className="text-foreground">{aberto.gatilho}</span>. Origem da regra: {ORIGENS[aberto.origem].label} — {ORIGENS[aberto.origem].hint}
            </p>
            <Grid cols={3}>
              <Field label="Responsável">
                <SelectInput
                  value={aberto.responsavel}
                  disabled={somenteLeitura}
                  onChange={(e) => updateSubfluxo(aberto.id, { responsavel: e.target.value })}
                >
                  <option value="">Selecionar…</option>
                  {PAPEIS_OPERACAO.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="SLA (horas)">
                <TextInput
                  type="number"
                  min={0}
                  value={aberto.slaHoras}
                  disabled={somenteLeitura}
                  onChange={(e) => updateSubfluxo(aberto.id, { slaHoras: Number(e.target.value) })}
                />
              </Field>
              <Field label="Canais de aviso">
                <div className="pt-1">
                  <CanaisPicker
                    value={aberto.canais}
                    disabled={somenteLeitura}
                    onChange={(canais) => updateSubfluxo(aberto.id, { canais })}
                  />
                </div>
              </Field>
            </Grid>
            <ChecklistEditor
              titulo="Checklist do subfluxo"
              hint="Estes são os itens que o responsável precisa cumprir para encerrar o subfluxo."
              itens={aberto.checklist}
              disabled={somenteLeitura}
              onChange={(checklist) => updateSubfluxo(aberto.id, { checklist })}
              placeholder="Ex.: Novo horário confirmado com o titular"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}


/* ----------------------------------------------------- Escopo & precedência */

function AbaEscopo() {
  const { rascunho, setEscopo, permissoes } = useOpConfig();
  const escopoAtual = ESCOPOS.find((e) => e.tipo === rascunho.escopo.tipo)!;
  const somenteLeitura = !permissoes.editarRascunho;

  return (
    <div className="space-y-4">
      <Panel title="Escopo desta configuração" hint="O rascunho é editado dentro de um escopo. Escopos mais específicos herdam do padrão do tenant.">
        <Grid>
          <Field label="Nível">
            <SelectInput
              value={rascunho.escopo.tipo}
              disabled={somenteLeitura}
              onChange={(e) => {
                const tipo = e.target.value as typeof rascunho.escopo.tipo;
                const alvo = ESCOPOS.find((x) => x.tipo === tipo)!.alvos[0]!;
                setEscopo({ tipo, alvo });
              }}
            >
              {ESCOPOS.map((e) => (
                <option key={e.tipo} value={e.tipo}>
                  {e.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Alvo">
            <SelectInput
              value={rascunho.escopo.alvo}
              disabled={somenteLeitura}
              onChange={(e) => setEscopo({ ...rascunho.escopo, alvo: e.target.value })}
            >
              {escopoAtual.alvos.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </SelectInput>
          </Field>
        </Grid>
        <p className="mt-2 text-xs text-muted-foreground">{escopoAtual.hint}</p>
      </Panel>

      <Panel title="Precedência das regras" hint="Da mais forte para a mais fraca. A origem aparece em cada regra efetiva.">
        <ol className="space-y-2">
          {(Object.keys(ORIGENS) as OrigemRegra[])
            .sort((a, b) => ORIGENS[b].peso - ORIGENS[a].peso)
            .map((o, i) => (
              <li key={o} className="flex items-start gap-3 rounded-md border border-border p-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded bg-muted text-[11px] font-semibold tabular">{i + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{ORIGENS[o].label}</p>
                    {!ORIGENS[o].editavel && <Chip tone="blue">Não editável</Chip>}
                  </div>
                  <p className="text-xs text-muted-foreground">{ORIGENS[o].hint}</p>
                </div>
              </li>
            ))}
        </ol>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <li className="flex gap-2"><ShieldCheck className="size-3.5 shrink-0 text-primary" /> Regra legal e de segurança sempre prevalece.</li>
          <li className="flex gap-2"><ShieldCheck className="size-3.5 shrink-0 text-primary" /> Capability da AC não pode ser ligada manualmente.</li>
          <li className="flex gap-2"><ShieldCheck className="size-3.5 shrink-0 text-primary" /> Regra comercial não remove requisito regulatório.</li>
          <li className="flex gap-2"><AlertTriangle className="size-3.5 shrink-0 text-alert" /> Conflitos impedem a publicação.</li>
        </ul>
      </Panel>

      <Panel title="Regras efetivas neste escopo" hint="Cada etapa mostra de onde veio a regra que está valendo." bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Etapa</th>
                <th className="px-4 py-2 font-medium">Marco</th>
                <th className="px-4 py-2 font-medium">Responsável</th>
                <th className="px-4 py-2 font-medium">SLA</th>
                <th className="px-4 py-2 font-medium">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rascunho.etapas.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">{e.nome}</td>
                  <td className="px-4 py-2 text-muted-foreground">{MARCOS.find((m) => m.id === e.marco)?.nome}</td>
                  <td className="px-4 py-2 text-muted-foreground">{e.papel}</td>
                  <td className="px-4 py-2 tabular">{e.slaHoras}h</td>
                  <td className="px-4 py-2">
                    <OrigemChip origem={e.origem} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ----------------------------------------------------------------- Versões */

function AbaVersoes() {
  const { publicada, historico, dirty, diff, achados, permissoes, setPermissoes, descartarRascunho, publicar } = useOpConfig();
  const [comparando, setComparando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [nota, setNota] = useState("");
  const [descartando, setDescartando] = useState(false);
  const erros = achados.filter((a) => a.tipo === "erro");

  return (
    <div className="space-y-4">
      <Panel
        title="Versão publicada"
        hint="Aplicada aos novos casos criados a partir da publicação."
        actions={<Chip tone="deep">{publicada.numero}</Chip>}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Autor</p>
            <p className="text-sm">{publicada.autor}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Publicada em</p>
            <p className="text-sm tabular">{formatarData(publicada.data)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Casos usando</p>
            <p className="text-sm tabular">{publicada.casos}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Escopo</p>
            <p className="text-sm">{publicada.escopo.alvo}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{publicada.nota}</p>
      </Panel>

      <Panel
        title="Rascunho em edição"
        hint={dirty ? `${diff.length} diferença(s) em relação à versão publicada.` : "Idêntico à versão publicada."}
        actions={
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" onClick={() => setComparando(true)} disabled={diff.length === 0}>
              <GitCompare className="size-4" /> Comparar
            </Btn>
            <Btn variant="ghost" onClick={() => setDescartando(true)} disabled={!dirty || !permissoes.editarRascunho}>
              Descartar rascunho
            </Btn>
            <Btn
              onClick={() => {
                if (!permissoes.publicar) {
                  toast.error("Sem permissão para publicar", { description: "Seu perfil pode editar o rascunho, mas não publicar." });
                  return;
                }
                if (erros.length) {
                  toast.error("Publicação bloqueada", { description: `${erros.length} conflito(s) precisam ser resolvidos na aba Validações.` });
                  return;
                }
                setPublicando(true);
              }}
              disabled={!dirty}
            >
              Publicar versão
            </Btn>
          </div>
        }
      >
        <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Esta versão será aplicada aos novos casos. Casos em andamento continuam usando a versão com que foram criados.
          Regras legais, controles de segurança, capabilities revogadas e bloqueios emergenciais continuam prevalecendo sobre
          versões antigas.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Rows>
            <Toggle
              label="Permissão: editar rascunho"
              hint="Quem tem apenas esta permissão configura, mas não coloca em produção."
              checked={permissoes.editarRascunho}
              onChange={(v) => setPermissoes({ ...permissoes, editarRascunho: v })}
            />
          </Rows>
          <Rows>
            <Toggle
              label="Permissão: publicar configuração"
              hint="Necessária para aplicar a versão aos novos casos."
              checked={permissoes.publicar}
              onChange={(v) => setPermissoes({ ...permissoes, publicar: v })}
            />
          </Rows>
        </div>
      </Panel>

      <Panel title="Histórico de versões" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Versão</th>
                <th className="px-4 py-2 font-medium">Autor</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Casos</th>
                <th className="px-4 py-2 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[publicada, ...historico].map((v, i) => (
                <tr key={v.id}>
                  <td className="px-4 py-2">
                    <span className="tabular font-medium">{v.numero}</span>{" "}
                    {i === 0 && <Chip tone="blue">Publicada</Chip>}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{v.autor}</td>
                  <td className="px-4 py-2 tabular text-muted-foreground">{formatarData(v.data)}</td>
                  <td className="px-4 py-2 tabular">{v.casos}</td>
                  <td className="px-4 py-2 text-muted-foreground">{v.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal open={comparando} onClose={() => setComparando(false)} title="Publicada × rascunho" width="max-w-3xl">
        <div className="divide-y divide-border rounded-md border border-border">
          {diff.map((l) => (
            <div key={l.chave} className="grid gap-2 p-3 sm:grid-cols-[1fr_1fr_1fr]">
              <p className="text-sm font-medium">{l.titulo}</p>
              <p className="text-xs text-muted-foreground">
                <span className="mr-1 uppercase tracking-wide">Publicada:</span> {l.publicada}
              </p>
              <p className="text-xs text-primary-deep">
                <span className="mr-1 uppercase tracking-wide">Rascunho:</span> {l.rascunho}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={publicando}
        onClose={() => setPublicando(false)}
        title="Publicar nova versão"
        hint="A versão passa a valer para os novos casos."
        width="max-w-md"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setPublicando(false)}>
              Cancelar
            </Btn>
            <Btn
              onClick={() => {
                publicar(nota.trim(), "Você");
                setNota("");
                setPublicando(false);
                toast.success("Versão publicada", {
                  description: "Aplicada aos novos casos. Casos em andamento seguem na versão anterior.",
                });
              }}
            >
              Publicar
            </Btn>
          </>
        }
      >
        <Field label="Nota da publicação">
          <TextArea rows={3} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="O que muda nesta versão." />
        </Field>
      </Modal>

      <ConfirmDialog
        open={descartando}
        onCancel={() => setDescartando(false)}
        title="Descartar rascunho?"
        descricao="O rascunho volta a ser exatamente a versão publicada. As alterações não salvas são perdidas."
        confirmLabel="Descartar"
        onConfirm={() => {
          descartarRascunho();
          setDescartando(false);
          toast.success("Rascunho descartado");
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- Simulador */

function AbaSimulador() {
  const { rascunho } = useOpConfig();
  const [cenarioId, setCenarioId] = useState(CENARIOS[0]!.id);
  const cenario = CENARIOS.find((c) => c.id === cenarioId)!;
  const resultado = useMemo(() => simular(rascunho, cenario), [rascunho, cenario]);

  return (
    <div className="space-y-4">
      <Panel title="Simular um cenário" hint="A simulação usa o rascunho atual, não a versão publicada.">
        <div className="flex flex-wrap gap-1.5">
          {CENARIOS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCenarioId(c.id)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                c.id === cenarioId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {c.nome}
            </button>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Play className="size-3.5 text-primary" /> {cenario.descricao}
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Etapas geradas" bodyClassName="p-0">
          <ol className="divide-y divide-border">
            {resultado.etapas.map((e, i) => (
              <li key={`${e.nome}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {i + 1}. {e.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.marco} · {e.papel}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Chip tone="outline">{e.sla}h</Chip>
                  <OrigemChip origem={e.origem} />
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="space-y-4">
          <Panel title="Tarefas por papel" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {resultado.tarefas.map((t) => (
                <li key={t.papel} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{t.papel}</span>
                  <span className="tabular text-muted-foreground">{t.quantidade} tarefa(s)</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Portões aplicados" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {resultado.portoes.length === 0 && <li className="px-4 py-2 text-sm text-muted-foreground">Nenhum portão neste cenário.</li>}
              {resultado.portoes.map((p) => (
                <li key={p.etapa} className="px-4 py-2 text-sm">
                  <p className="font-medium">{p.etapa}</p>
                  <p className="text-xs text-muted-foreground">
                    Exige: {p.exige} · Autoriza: {p.autorizador || "— sem autorizador"}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Notificações" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {resultado.notificacoes.map((n) => (
              <li key={n.etapa} className="px-4 py-2 text-sm">
                <p className="font-medium">{n.etapa}</p>
                <p className="text-xs text-muted-foreground">
                  {n.canais} → {n.alvo}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Subfluxos acionados" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {resultado.subfluxos.length === 0 && <li className="px-4 py-2 text-sm text-muted-foreground">Nenhum subfluxo neste cenário.</li>}
            {resultado.subfluxos.map((s) => (
              <li key={s.nome} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <div>
                  <p className="font-medium">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.responsavel} · {s.sla}h
                  </p>
                </div>
                <Chip tone={s.estado.startsWith("Dependente") ? "alert" : s.estado === "Ativo" ? "blue" : "outline"}>{s.estado}</Chip>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Bloqueios, regra efetiva e próxima ação">
        <div className="space-y-2">
          {resultado.bloqueios.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-primary-deep">
              <CheckCircle2 className="size-4" /> Nenhum bloqueio neste cenário.
            </p>
          ) : (
            resultado.bloqueios.map((b) => (
              <div key={b.titulo} className="rounded-md border border-alert/40 bg-alert-soft p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-alert">
                  <AlertTriangle className="size-4" /> {b.titulo}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{b.regra}</p>
                <div className="mt-1.5">
                  <OrigemChip origem={b.origem} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Regra efetiva</p>
            <p className="text-sm">{resultado.regraEfetiva.regra}</p>
            <div className="mt-1.5">
              <OrigemChip origem={resultado.regraEfetiva.origem} />
            </div>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Próxima ação permitida</p>
            <p className="text-sm">{resultado.proximaAcao}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------- Validações */

function AbaValidacoes() {
  const { achados } = useOpConfig();
  const erros = achados.filter((a) => a.tipo === "erro");
  const avisos = achados.filter((a) => a.tipo === "aviso");

  return (
    <div className="space-y-4">
      <Panel
        title="Validações de publicação"
        hint="Conflitos impedem a publicação. Avisos não impedem, mas ficam registrados."
        actions={
          <div className="flex gap-1.5">
            <Chip tone={erros.length ? "alert" : "blue"}>{erros.length} conflito(s)</Chip>
            <Chip tone="outline">{avisos.length} aviso(s)</Chip>
          </div>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-border">
          {achados.length === 0 && (
            <li className="flex items-center gap-2 px-4 py-3 text-sm text-primary-deep">
              <CheckCircle2 className="size-4" /> Nenhum conflito. A configuração pode ser publicada.
            </li>
          )}
          {achados.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3">
              {a.tipo === "erro" ? (
                <XCircle className="mt-0.5 size-4 shrink-0 text-alert" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.detalhe}</p>
                <p className="mt-0.5 text-xs text-primary-deep">Como resolver: {a.comoResolver}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="O que a plataforma nunca permite" hint="Tentativas destas ações são recusadas com explicação, não silenciosamente.">
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {[
            "Remover ou reordenar um dos seis marcos canônicos.",
            "Ligar manualmente uma capability dependente de homologação da AC.",
            "Usar regra de indicador para remover requisito regulatório.",
            "Deixar etapa obrigatória sem responsável ou portão sem autorizador.",
            "Atribuir a verificação à mesma pessoa que executou, quando há segregação obrigatória.",
            "Criar loops, scripts ou ligações arbitrárias entre etapas.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <History className="size-3.5 shrink-0 text-primary" />
              {t}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
