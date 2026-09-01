// Painéis da tela de Configurações — cada seção edita um recorte do parâmetro
// global da AC. Tudo persiste no store de configurações.
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  CheckCircle2,
  KeyRound,
  Laptop,
  Plug,
  Plus,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Btn, ConfirmDialog, EmptyState, Field, Modal, SelectInput, TextArea, TextInput } from "@/components/forms";
import { Grid, Rows, TagList, Toggle } from "@/components/settings-kit";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import { agents } from "@/lib/mock-data";
import {
  escoposVisibilidade,
  escopoEfetivo,
  iniciaisDe,
  novaEtapa,
  novoChecklistItem,
  novoUsuario,
  permissoesDisponiveis,
  unidadesDisponiveis,
  useSettings,
  type CanalNotificacao,
  type ChaveApi,
  type ChecklistRule,
  type EscopoVisibilidade,
  type PapelRule,
  type ProdutoRule,
  type StageRule,
  type StatusUsuario,
  type UsuarioRule,
} from "@/lib/settings-store";
import { cn } from "@/lib/utils";

const moeda = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ----------------------------------------------------------------- Organização */

export function SecaoOrganizacao() {
  const { settings, update } = useSettings();
  const o = settings.org;
  const dias = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
  return (
    <div className="space-y-4">
      <Panel title="Identificação da AC" hint="Dados usados em documentos, e-mails e no portal do cliente.">
        <Grid>
          <Field label="Nome fantasia">
            <TextInput value={o.nome} onChange={(e) => update("org", { nome: e.target.value })} />
          </Field>
          <Field label="Razão social">
            <TextInput value={o.razaoSocial} onChange={(e) => update("org", { razaoSocial: e.target.value })} />
          </Field>
          <Field label="CNPJ">
            <TextInput value={o.cnpj} onChange={(e) => update("org", { cnpj: e.target.value })} />
          </Field>
          <Field label="Cadeia de confiança">
            <TextInput value={o.acRaiz} onChange={(e) => update("org", { acRaiz: e.target.value })} />
          </Field>
          <Field label="E-mail operacional">
            <TextInput value={o.email} onChange={(e) => update("org", { email: e.target.value })} />
          </Field>
          <Field label="Telefone">
            <TextInput value={o.telefone} onChange={(e) => update("org", { telefone: e.target.value })} />
          </Field>
          <Field label="Site" className="sm:col-span-2">
            <TextInput value={o.site} onChange={(e) => update("org", { site: e.target.value })} />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <TextInput value={o.endereco} onChange={(e) => update("org", { endereco: e.target.value })} />
          </Field>
        </Grid>
      </Panel>

      <Panel title="Expediente e regionalização" hint="Base de cálculo de SLA e janelas de atendimento.">
        <Grid cols={3}>
          <Field label="Fuso horário">
            <SelectInput value={o.fuso} onChange={(e) => update("org", { fuso: e.target.value })}>
              <option>America/Sao_Paulo</option>
              <option>America/Manaus</option>
              <option>America/Belem</option>
              <option>America/Rio_Branco</option>
            </SelectInput>
          </Field>
          <Field label="Moeda">
            <SelectInput value={o.moeda} onChange={(e) => update("org", { moeda: e.target.value })}>
              <option>BRL</option>
              <option>USD</option>
            </SelectInput>
          </Field>
          <Field label="Idioma">
            <SelectInput value={o.idioma} onChange={(e) => update("org", { idioma: e.target.value })}>
              <option>pt-BR</option>
              <option>en-US</option>
              <option>es-AR</option>
            </SelectInput>
          </Field>
          <Field label="Abertura">
            <TextInput
              type="time"
              value={o.expedienteInicio}
              onChange={(e) => update("org", { expedienteInicio: e.target.value })}
            />
          </Field>
          <Field label="Fechamento">
            <TextInput
              type="time"
              value={o.expedienteFim}
              onChange={(e) => update("org", { expedienteFim: e.target.value })}
            />
          </Field>
          <Field label="Dias úteis" className="sm:col-span-3">
            <div className="flex flex-wrap gap-1.5">
              {dias.map((d) => {
                const on = o.diasUteis.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      update("org", {
                        diasUteis: on ? o.diasUteis.filter((x) => x !== d) : [...o.diasUteis, d],
                      })
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      on
                        ? "border-primary bg-primary-soft text-primary-deep"
                        : "border-border text-muted-foreground hover:border-border-strong",
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>
        </Grid>
        <Rows>
          <Toggle
            label="Contar SLA apenas em dias úteis"
            hint="Fins de semana e feriados não consomem o prazo das etapas."
            checked={o.contaSlaEmDiasUteis}
            onChange={(v) => update("org", { contaSlaEmDiasUteis: v })}
          />
        </Rows>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- Fluxo */

const canais: { id: CanalNotificacao; label: string }[] = [
  { id: "email", label: "E-mail" },
  { id: "push", label: "Push no app" },
  { id: "whatsapp", label: "WhatsApp" },
];

function EditorEtapa({ etapa }: { etapa: StageRule }) {
  const { settings, updateEtapa } = useSettings();
  const papeis = settings.papeis;
  const [novo, setNovo] = useState("");

  const setChecklist = (checklist: ChecklistRule[]) => updateEtapa(etapa.id, { checklist });

  return (
    <div className="space-y-4 p-4">
      <Grid cols={3}>
        <Field label="Nome da etapa">
          <TextInput value={etapa.nome} onChange={(e) => updateEtapa(etapa.id, { nome: e.target.value })} />
        </Field>
        <Field label="SLA da etapa (horas)">
          <TextInput
            type="number"
            min={1}
            value={etapa.slaHoras}
            onChange={(e) => updateEtapa(etapa.id, { slaHoras: Number(e.target.value) })}
          />
        </Field>
        <Field label="Papel responsável">
          <SelectInput
            value={etapa.papelResponsavel}
            onChange={(e) => updateEtapa(etapa.id, { papelResponsavel: e.target.value })}
          >
            {[...new Set(agents.map((a) => a.papel))].map((p) => (
              <option key={p}>{p}</option>
            ))}
            <option>Compliance</option>
          </SelectInput>
        </Field>
        <Field label="Descrição" className="sm:col-span-3">
          <TextInput
            value={etapa.descricao}
            onChange={(e) => updateEtapa(etapa.id, { descricao: e.target.value })}
          />
        </Field>
      </Grid>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border">
          <header className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Checklist da etapa
            </p>
          </header>
          <ul className="divide-y divide-border">
            {etapa.checklist.map((item, i) => (
              <li key={item.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <TextInput
                  value={item.label}
                  onChange={(e) =>
                    setChecklist(etapa.checklist.map((c) => (c.id === item.id ? { ...c, label: e.target.value } : c)))
                  }
                  className="min-w-40 flex-1"
                />
                <SelectInput
                  aria-label="Evidência"
                  value={item.evidencia}
                  onChange={(e) =>
                    setChecklist(
                      etapa.checklist.map((c) =>
                        c.id === item.id ? { ...c, evidencia: e.target.value as ChecklistRule["evidencia"] } : c,
                      ),
                    )
                  }
                  className="w-32"
                >
                  <option value="nenhuma">Sem evidência</option>
                  <option value="arquivo">Arquivo</option>
                  <option value="assinatura">Assinatura</option>
                  <option value="foto">Foto</option>
                </SelectInput>
                <button
                  type="button"
                  onClick={() =>
                    setChecklist(
                      etapa.checklist.map((c) => (c.id === item.id ? { ...c, obrigatorio: !c.obrigatorio } : c)),
                    )
                  }
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[11px] font-medium",
                    item.obrigatorio
                      ? "border-primary bg-primary-soft text-primary-deep"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {item.obrigatorio ? "Obrigatório" : "Opcional"}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Subir"
                    disabled={i === 0}
                    onClick={() => {
                      const l = [...etapa.checklist];
                      const [it] = l.splice(i, 1);
                      if (it) l.splice(i - 1, 0, it);
                      setChecklist(l);
                    }}
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Descer"
                    disabled={i === etapa.checklist.length - 1}
                    onClick={() => {
                      const l = [...etapa.checklist];
                      const [it] = l.splice(i, 1);
                      if (it) l.splice(i + 1, 0, it);
                      setChecklist(l);
                    }}
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remover item"
                    onClick={() => setChecklist(etapa.checklist.filter((c) => c.id !== item.id))}
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-alert-soft hover:text-alert"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {etapa.checklist.length === 0 && (
              <li className="px-3 py-4 text-xs text-muted-foreground">Nenhum item nesta etapa.</li>
            )}
          </ul>
          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              const v = novo.trim();
              if (!v) return;
              setChecklist([...etapa.checklist, novoChecklistItem(v)]);
              setNovo("");
            }}
          >
            <TextInput value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo item do checklist" />
            <Btn type="submit" variant="ghost">
              <Plus className="size-4" /> Adicionar
            </Btn>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Requisitos mínimos para avançar
            </p>
            <Rows>
              <Toggle
                label="Checklist obrigatório concluído"
                hint="Bloqueia o avanço enquanto houver item obrigatório pendente."
                checked={etapa.gates.checklistObrigatorio}
                onChange={(v) => updateEtapa(etapa.id, { gates: { ...etapa.gates, checklistObrigatorio: v } })}
              />
              <Toggle
                label="Documentos aprovados"
                checked={etapa.gates.documentosAprovados}
                onChange={(v) => updateEtapa(etapa.id, { gates: { ...etapa.gates, documentosAprovados: v } })}
              />
              <Toggle
                label="Pagamento confirmado"
                checked={etapa.gates.pagamentoConfirmado}
                onChange={(v) => updateEtapa(etapa.id, { gates: { ...etapa.gates, pagamentoConfirmado: v } })}
              />
              <Toggle
                label="Dupla conferência (4 olhos)"
                hint="Exige um segundo agente diferente do executor."
                checked={etapa.gates.duplaConferencia}
                onChange={(v) => updateEtapa(etapa.id, { gates: { ...etapa.gates, duplaConferencia: v } })}
              />
              <Toggle
                label="Biometria validada"
                checked={etapa.gates.biometriaValidada}
                onChange={(v) => updateEtapa(etapa.id, { gates: { ...etapa.gates, biometriaValidada: v } })}
              />
              <Toggle
                label="Gravação arquivada"
                checked={etapa.gates.gravacaoArquivada}
                onChange={(v) => updateEtapa(etapa.id, { gates: { ...etapa.gates, gravacaoArquivada: v } })}
              />
            </Rows>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Automações</p>
            <Rows>
              <Toggle
                label="Notificar cliente ao entrar na etapa"
                checked={etapa.automacoes.notificarCliente}
                onChange={(v) => updateEtapa(etapa.id, { automacoes: { ...etapa.automacoes, notificarCliente: v } })}
              />
              <Toggle
                label="Distribuir automaticamente ao papel responsável"
                checked={etapa.automacoes.atribuirAutomatico}
                onChange={(v) => updateEtapa(etapa.id, { automacoes: { ...etapa.automacoes, atribuirAutomatico: v } })}
              />
              <Toggle
                label="Escalar quando o SLA estourar"
                checked={etapa.automacoes.escalarSlaEstourado}
                onChange={(v) => updateEtapa(etapa.id, { automacoes: { ...etapa.automacoes, escalarSlaEstourado: v } })}
              />
            </Rows>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Bell className="size-3.5" /> Aviso de chegada na etapa
            </p>
            <Rows>
              <Toggle
                label={`Notificar o papel responsável (${etapa.papelResponsavel})`}
                hint="Todas as pessoas desse papel recebem o aviso quando a solicitação entra nesta etapa."
                checked={etapa.automacoes.notificarPapelResponsavel}
                onChange={(v) =>
                  updateEtapa(etapa.id, { automacoes: { ...etapa.automacoes, notificarPapelResponsavel: v } })
                }
              />
            </Rows>
            <p className="mb-1.5 mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Papéis adicionais avisados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {papeis.map((papel) => {
                const on = etapa.papeisNotificados.includes(papel.id);
                return (
                  <button
                    key={papel.id}
                    type="button"
                    onClick={() =>
                      updateEtapa(etapa.id, {
                        papeisNotificados: on
                          ? etapa.papeisNotificados.filter((x) => x !== papel.id)
                          : [...etapa.papeisNotificados, papel.id],
                      })
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      on
                        ? "border-primary bg-primary-soft text-primary-deep"
                        : "border-border text-muted-foreground hover:border-border-strong",
                    )}
                  >
                    {papel.nome}
                  </button>
                );
              })}
            </div>
            <p className="mb-1.5 mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Canais do aviso
            </p>
            <div className="flex flex-wrap gap-1.5">
              {canais.map((c) => {
                const on = etapa.canaisNotificacao.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      updateEtapa(etapa.id, {
                        canaisNotificacao: on
                          ? etapa.canaisNotificacao.filter((x) => x !== c.id)
                          : [...etapa.canaisNotificacao, c.id],
                      })
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-border-strong",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Documentos exigidos
            </p>
            <TagList
              values={etapa.documentos}
              onChange={(documentos) => updateEtapa(etapa.id, { documentos })}
              placeholder="Ex.: Procuração registrada"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SecaoFluxo() {
  const { settings, update, updateEtapa, patchEtapas } = useSettings();
  const etapas = settings.fluxo.etapas;
  const [sel, setSel] = useState(etapas[1]?.id ?? etapas[0]?.id);
  const atual = etapas.find((e) => e.id === sel) ?? etapas[0];

  return (
    <div className="space-y-4">
      <Panel
        title="Regras gerais da esteira"
        hint="Como a operação se comporta entre as etapas do fluxo de emissão."
      >
        <div className="grid gap-x-8 sm:grid-cols-2">
          <Rows>
            <Toggle
              label="Permitir pular etapas"
              hint="Agentes com permissão podem saltar etapas intermediárias."
              checked={settings.fluxo.permitirPularEtapa}
              onChange={(v) => update("fluxo", { permitirPularEtapa: v })}
            />
            <Toggle
              label="Exigir justificativa ao retroceder"
              checked={settings.fluxo.exigirJustificativaRetorno}
              onChange={(v) => update("fluxo", { exigirJustificativaRetorno: v })}
            />
          </Rows>
          <Rows>
            <Toggle
              label="Bloquear solicitação com SLA estourado"
              hint="Move automaticamente para a raia Bloqueado e notifica o gestor."
              checked={settings.fluxo.bloquearAposSlaEstourado}
              onChange={(v) => update("fluxo", { bloquearAposSlaEstourado: v })}
            />
            <Toggle
              label="Reatribuir automaticamente quando o agente ficar indisponível"
              checked={settings.fluxo.reatribuirAutomatico}
              onChange={(v) => update("fluxo", { reatribuirAutomatico: v })}
            />
          </Rows>
        </div>
        <div className="mt-3 max-w-xs">
          <Field label="Limite de solicitações simultâneas por agente (WIP)">
            <TextInput
              type="number"
              min={1}
              value={settings.fluxo.limiteWipPorAgente}
              onChange={(e) => update("fluxo", { limiteWipPorAgente: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Desenho do fluxo"
        hint="Selecione uma etapa para personalizar checklist, requisitos de avanço e automações."
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
          {etapas.map((e, i) => (
            <div key={e.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSel(e.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  e.id === sel
                    ? "border-primary bg-primary text-primary-foreground"
                    : e.ativo
                      ? "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                      : "border-dashed border-border text-muted-foreground/60",
                )}
              >
                {i + 1}. {e.nome}
                <span className="ml-1.5 tabular opacity-70">{e.slaHoras}h</span>
              </button>
              {i < etapas.length - 1 && <span className="text-muted-foreground/50">›</span>}
            </div>
          ))}
        </div>

        {atual && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-semibold">{atual.nome}</h3>
                <Chip tone={atual.ativo ? "blue" : "outline"}>{atual.ativo ? "Ativa" : "Desativada"}</Chip>
                <Chip tone="outline">
                  {atual.checklist.filter((c) => c.obrigatorio).length} itens obrigatórios
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                <Btn
                  variant="ghost"
                  onClick={() => updateEtapa(atual.id, { ativo: !atual.ativo })}
                  disabled={atual.id === "novo" || atual.id === "concluido"}
                >
                  {atual.ativo ? "Desativar etapa" : "Ativar etapa"}
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    patchEtapas((l) =>
                      l.map((e) =>
                        e.id === atual.id
                          ? {
                              ...e,
                              checklist: e.checklist.map((c) => ({ ...c, obrigatorio: true })),
                            }
                          : e,
                      ),
                    );
                    toast.success("Todos os itens desta etapa passaram a ser obrigatórios");
                  }}
                >
                  Tornar tudo obrigatório
                </Btn>
              </div>
            </div>
            <EditorEtapa etapa={atual} />
          </>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Catálogo */

export function SecaoCatalogo() {
  const { settings, replace } = useSettings();
  const produtos = settings.produtos;
  const setProdutos = (p: ProdutoRule[]) => replace("produtos", p);

  const patch = (id: string, dados: Partial<ProdutoRule>) =>
    setProdutos(produtos.map((p) => (p.id === id ? { ...p, ...dados } : p)));

  return (
    <Panel
      title="Catálogo de certificados"
      hint="Preço, validade e exigência de videoconferência por produto."
      bodyClassName="p-0"
      actions={
        <Btn
          variant="ghost"
          onClick={() => {
            setProdutos([
              ...produtos,
              {
                id: `p${produtos.length + 1}${Math.random().toString(36).slice(2, 5)}`,
                nome: "Novo produto",
                validadeMeses: 12,
                preco: 199,
                exigeVideoconferencia: true,
                ativo: true,
              },
            ]);
            toast.success("Produto adicionado ao catálogo");
          }}
        >
          <Plus className="size-4" /> Novo produto
        </Btn>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Produto</th>
              <th className="px-4 py-2 font-medium">Validade (meses)</th>
              <th className="px-4 py-2 font-medium">Preço</th>
              <th className="px-4 py-2 font-medium">Videoconferência</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {produtos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">
                  <TextInput value={p.nome} onChange={(e) => patch(p.id, { nome: e.target.value })} />
                </td>
                <td className="px-4 py-2">
                  <TextInput
                    type="number"
                    min={1}
                    value={p.validadeMeses}
                    onChange={(e) => patch(p.id, { validadeMeses: Number(e.target.value) })}
                    className="w-24"
                  />
                </td>
                <td className="px-4 py-2">
                  <TextInput
                    type="number"
                    min={0}
                    value={p.preco}
                    onChange={(e) => patch(p.id, { preco: Number(e.target.value) })}
                    className="w-28"
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground tabular">{moeda(p.preco)}</span>
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => patch(p.id, { exigeVideoconferencia: !p.exigeVideoconferencia })}
                    className="text-xs"
                  >
                    <Chip tone={p.exigeVideoconferencia ? "blue" : "outline"}>
                      {p.exigeVideoconferencia ? "Obrigatória" : "Dispensada"}
                    </Chip>
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button type="button" onClick={() => patch(p.id, { ativo: !p.ativo })}>
                    <Chip tone={p.ativo ? "deep" : "outline"}>{p.ativo ? "Ativo" : "Inativo"}</Chip>
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    aria-label="Remover produto"
                    onClick={() => setProdutos(produtos.filter((x) => x.id !== p.id))}
                    className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-alert-soft hover:text-alert"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------------------- SLA */

export function SecaoSla() {
  const { settings, update } = useSettings();
  const sla = settings.sla;
  const patch = (prioridade: string, dados: Partial<(typeof sla.porPrioridade)[number]>) =>
    update("sla", {
      porPrioridade: sla.porPrioridade.map((p) => (p.prioridade === prioridade ? { ...p, ...dados } : p)),
    });

  return (
    <div className="space-y-4">
      <Panel title="Matriz de SLA por prioridade" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Prioridade</th>
                <th className="px-4 py-2 font-medium">1ª resposta (h)</th>
                <th className="px-4 py-2 font-medium">Resolução (h)</th>
                <th className="px-4 py-2 font-medium">Alertar em (% do prazo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sla.porPrioridade.map((p) => (
                <tr key={p.prioridade}>
                  <td className="px-4 py-2 capitalize">
                    <Chip tone={p.prioridade === "critica" ? "alert" : p.prioridade === "alta" ? "deep" : "blue"}>
                      {p.prioridade}
                    </Chip>
                  </td>
                  <td className="px-4 py-2">
                    <TextInput
                      type="number"
                      min={1}
                      value={p.primeiraRespostaH}
                      onChange={(e) => patch(p.prioridade, { primeiraRespostaH: Number(e.target.value) })}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <TextInput
                      type="number"
                      min={1}
                      value={p.resolucaoH}
                      onChange={(e) => patch(p.prioridade, { resolucaoH: Number(e.target.value) })}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <TextInput
                      type="number"
                      min={10}
                      max={100}
                      value={p.alertaEmPercent}
                      onChange={(e) => patch(p.prioridade, { alertaEmPercent: Number(e.target.value) })}
                      className="w-24"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Contagem do prazo">
        <Rows>
          <Toggle
            label="Contar apenas horário comercial"
            checked={sla.horarioComercialApenas}
            onChange={(v) => update("sla", { horarioComercialApenas: v })}
          />
          <Toggle
            label="Pausar SLA quando aguardando cliente"
            hint="O relógio volta a correr assim que o cliente responder."
            checked={sla.pausarAguardandoCliente}
            onChange={(v) => update("sla", { pausarAguardandoCliente: v })}
          />
        </Rows>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------- Equipe */

type RascunhoUsuario = {
  nome: string;
  email: string;
  papelId: string;
  unidade: string;
  telefone: string;
  status: StatusUsuario;
  mfa: boolean;
  limiteWip: number;
  observacao: string;
};

const rascunhoVazio = (papelId: string): RascunhoUsuario => ({
  nome: "",
  email: "",
  papelId,
  unidade: unidadesDisponiveis[0] as string,
  telefone: "",
  status: "convidado",
  mfa: true,
  limiteWip: 10,
  observacao: "",
});

const statusTone: Record<StatusUsuario, "blue" | "outline" | "alert" | "deep" | "neutral"> = {
  ativo: "blue",
  convidado: "outline",
  suspenso: "alert",
};

const statusLabel: Record<StatusUsuario, string> = {
  ativo: "Ativo",
  convidado: "Convite pendente",
  suspenso: "Suspenso",
};

export function SecaoEquipe() {
  const { settings, replace } = useSettings();
  const papeis = settings.papeis;
  const usuarios = settings.usuarios;

  const [busca, setBusca] = useState("");
  const [filtroPapel, setFiltroPapel] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [editando, setEditando] = useState<string | "novo" | null>(null);
  const [rascunho, setRascunho] = useState<RascunhoUsuario>(rascunhoVazio(papeis[0]?.id ?? "r2"));
  const [remover, setRemover] = useState<UsuarioRule | null>(null);
  const [novoPapel, setNovoPapel] = useState(false);
  const [papelDraft, setPapelDraft] = useState({ nome: "", descricao: "" });
  const [removerPapel, setRemoverPapel] = useState<string | null>(null);

  const nomePapel = (id: string) => papeis.find((p) => p.id === id)?.nome ?? "Sem papel";
  const contarUsuarios = (papelId: string) =>
    usuarios.filter((u) => u.papelId === papelId && u.status !== "suspenso").length;

  const setUsuarios = (lista: UsuarioRule[]) => replace("usuarios", lista);

  const filtrados = usuarios.filter((u) => {
    const texto = `${u.nome} ${u.email} ${u.unidade}`.toLowerCase();
    if (busca && !texto.includes(busca.toLowerCase())) return false;
    if (filtroPapel !== "todos" && u.papelId !== filtroPapel) return false;
    if (filtroStatus !== "todos" && u.status !== filtroStatus) return false;
    return true;
  });

  const abrirNovo = () => {
    setRascunho(rascunhoVazio(papeis[0]?.id ?? "r2"));
    setEditando("novo");
  };

  const abrirEdicao = (u: UsuarioRule) => {
    setRascunho({
      nome: u.nome,
      email: u.email,
      papelId: u.papelId,
      unidade: u.unidade,
      telefone: u.telefone,
      status: u.status,
      mfa: u.mfa,
      limiteWip: u.limiteWip,
      observacao: u.observacao,
    });
    setEditando(u.id);
  };

  const salvarUsuario = () => {
    if (!rascunho.nome.trim() || !rascunho.email.trim()) {
      toast.error("Informe nome e e-mail corporativo.");
      return;
    }
    const duplicado = usuarios.some(
      (u) => u.email.toLowerCase() === rascunho.email.trim().toLowerCase() && u.id !== editando,
    );
    if (duplicado) {
      toast.error("Já existe um usuário com este e-mail.");
      return;
    }
    if (settings.seguranca.mfaObrigatorio && !rascunho.mfa && rascunho.status === "ativo") {
      toast.error("A política da AC exige MFA para usuários ativos.");
      return;
    }

    if (editando === "novo") {
      setUsuarios([...usuarios, novoUsuario({ ...rascunho, email: rascunho.email.trim() })]);
      toast.success("Usuário criado", {
        description:
          rascunho.status === "convidado"
            ? `Convite enviado para ${rascunho.email.trim()}.`
            : `${rascunho.nome} já pode acessar o sistema.`,
      });
    } else {
      setUsuarios(
        usuarios.map((u) =>
          u.id === editando
            ? { ...u, ...rascunho, email: rascunho.email.trim(), iniciais: iniciaisDe(rascunho.nome) }
            : u,
        ),
      );
      toast.success("Usuário atualizado", { description: "Alteração registrada na trilha de auditoria." });
    }
    setEditando(null);
  };

  const alternarStatus = (u: UsuarioRule) => {
    const novo: StatusUsuario = u.status === "suspenso" ? "ativo" : "suspenso";
    setUsuarios(usuarios.map((x) => (x.id === u.id ? { ...x, status: novo } : x)));
    toast.success(novo === "ativo" ? "Acesso reativado" : "Acesso suspenso", {
      description: `${u.nome} — sessões encerradas imediatamente.`,
    });
  };

  const reenviarConvite = (u: UsuarioRule) =>
    toast.success("Convite reenviado", { description: `Link válido por 24h enviado para ${u.email}.` });

  const resetarMfa = (u: UsuarioRule) => {
    setUsuarios(usuarios.map((x) => (x.id === u.id ? { ...x, mfa: false } : x)));
    toast.success("MFA redefinido", { description: `${u.nome} fará novo cadastro do app autenticador no login.` });
  };

  const togglePerm = (papelId: string, perm: string) =>
    replace(
      "papeis",
      papeis.map((p) =>
        p.id === papelId
          ? {
              ...p,
              permissoes: p.permissoes.includes(perm)
                ? p.permissoes.filter((x) => x !== perm)
                : [...p.permissoes, perm],
            }
          : p,
      ),
    );

  const criarPapel = () => {
    if (!papelDraft.nome.trim()) {
      toast.error("Dê um nome ao papel.");
      return;
    }
    replace("papeis", [
      ...papeis,
      {
        id: `r${Math.random().toString(36).slice(2, 7)}`,
        nome: papelDraft.nome.trim(),
        descricao: papelDraft.descricao.trim() || "Papel personalizado.",
        permissoes: [],
        usuarios: 0,
      },
    ]);
    setPapelDraft({ nome: "", descricao: "" });
    setNovoPapel(false);
    toast.success("Papel criado", { description: "Marque as permissões na matriz de acesso." });
  };

  const usuarioEditado = editando && editando !== "novo" ? usuarios.find((u) => u.id === editando) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap rounded-lg border border-border bg-card">
        <Metric label="Usuários" value={String(usuarios.length)} hint="cadastrados" />
        <Metric label="Ativos" value={String(usuarios.filter((u) => u.status === "ativo").length)} hint="com acesso" />
        <Metric
          label="Convites pendentes"
          value={String(usuarios.filter((u) => u.status === "convidado").length)}
          hint="aguardando 1º acesso"
        />
        <Metric
          label="Sem MFA"
          value={String(usuarios.filter((u) => !u.mfa).length)}
          hint="risco de conformidade"
        />
      </div>

      <Panel
        title="Usuários"
        hint="Crie, edite, suspenda e defina papel, unidade e limite de trabalho de cada pessoa."
        bodyClassName="p-0"
        actions={
          <Btn onClick={abrirNovo}>
            <Plus className="size-4" /> Novo usuário
          </Btn>
        }
      >
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <TextInput
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou unidade"
            className="h-9 min-w-[220px] flex-1"
          />
          <SelectInput
            value={filtroPapel}
            onChange={(e) => setFiltroPapel(e.target.value)}
            className="h-9 w-auto"
            aria-label="Filtrar por papel"
          >
            <option value="todos">Todos os papéis</option>
            {papeis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-9 w-auto"
            aria-label="Filtrar por status"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="convidado">Convite pendente</option>
            <option value="suspenso">Suspensos</option>
          </SelectInput>
        </div>

        {filtrados.length === 0 ? (
          <div className="p-6">
            <EmptyState
              titulo="Nenhum usuário encontrado"
              descricao="Ajuste os filtros ou cadastre uma nova pessoa na equipe."
              acao={
                <Btn onClick={abrirNovo}>
                  <Plus className="size-4" /> Novo usuário
                </Btn>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtrados.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-deep">
                  {u.iniciais}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.nome}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {u.email} · {u.unidade}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip tone="outline">{nomePapel(u.papelId)}</Chip>
                  <Chip tone={statusTone[u.status]}>{statusLabel[u.status]}</Chip>
                  {u.mfa ? (
                    <Chip tone="blue">MFA</Chip>
                  ) : (
                    <Chip tone="alert">Sem MFA</Chip>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="hidden text-[11px] text-muted-foreground lg:block">
                    Último acesso: {u.ultimoAcesso}
                  </span>
                  <Btn variant="ghost" onClick={() => abrirEdicao(u)}>
                    Editar
                  </Btn>
                  <Btn variant="ghost" onClick={() => setRemover(u)}>
                    <Trash2 className="size-4" />
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Papéis e permissões"
        hint="Matriz de acesso aplicada a todos os módulos."
        bodyClassName="p-0"
        actions={
          <Btn variant="ghost" onClick={() => setNovoPapel(true)}>
            <Plus className="size-4" /> Novo papel
          </Btn>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Papel</th>
                {permissoesDisponiveis.map((p) => (
                  <th key={p.id} className="px-2 py-2 text-center font-medium">
                    {p.label}
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-medium">Usuários</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {papeis.map((papel) => (
                <tr key={papel.id}>
                  <td className="px-4 py-2">
                    <p className="font-medium">{papel.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{papel.descricao}</p>
                  </td>
                  {permissoesDisponiveis.map((perm) => {
                    const on = papel.permissoes.includes(perm.id);
                    return (
                      <td key={perm.id} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          aria-label={`${perm.label} para ${papel.nome}`}
                          onClick={() => togglePerm(papel.id, perm.id)}
                          className={cn(
                            "grid size-6 place-items-center rounded border transition-colors",
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-transparent hover:border-border-strong",
                          )}
                        >
                          <CheckCircle2 className="size-3.5" />
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right tabular">{contarUsuarios(papel.id)}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      aria-label={`Remover papel ${papel.nome}`}
                      onClick={() => setRemoverPapel(papel.id)}
                      className="text-muted-foreground transition-colors hover:text-alert"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={editando !== null}
        onClose={() => setEditando(null)}
        title={editando === "novo" ? "Novo usuário" : `Editar ${usuarioEditado?.nome ?? "usuário"}`}
        hint="Papel, unidade e políticas de acesso valem imediatamente após salvar."
        width="max-w-2xl"
        footer={
          <>
            {usuarioEditado && (
              <div className="mr-auto flex flex-wrap gap-2">
                {usuarioEditado.status === "convidado" && (
                  <Btn variant="ghost" onClick={() => reenviarConvite(usuarioEditado)}>
                    Reenviar convite
                  </Btn>
                )}
                <Btn variant="ghost" onClick={() => resetarMfa(usuarioEditado)}>
                  Redefinir MFA
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    alternarStatus(usuarioEditado);
                    setEditando(null);
                  }}
                >
                  {usuarioEditado.status === "suspenso" ? "Reativar acesso" : "Suspender acesso"}
                </Btn>
              </div>
            )}
            <Btn variant="ghost" onClick={() => setEditando(null)}>
              Cancelar
            </Btn>
            <Btn onClick={salvarUsuario}>{editando === "novo" ? "Criar usuário" : "Salvar alterações"}</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Grid>
            <Field label="Nome completo">
              <TextInput
                value={rascunho.nome}
                onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
                placeholder="Ex.: Ana Ribeiro"
              />
            </Field>
            <Field label="E-mail corporativo">
              <TextInput
                value={rascunho.email}
                onChange={(e) => setRascunho({ ...rascunho, email: e.target.value })}
                placeholder="nome@certus.com.br"
              />
            </Field>
            <Field label="Papel">
              <SelectInput
                value={rascunho.papelId}
                onChange={(e) => setRascunho({ ...rascunho, papelId: e.target.value })}
              >
                {papeis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Unidade">
              <SelectInput
                value={rascunho.unidade}
                onChange={(e) => setRascunho({ ...rascunho, unidade: e.target.value })}
              >
                {unidadesDisponiveis.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Telefone">
              <TextInput
                value={rascunho.telefone}
                onChange={(e) => setRascunho({ ...rascunho, telefone: e.target.value })}
                placeholder="(11) 90000-0000"
              />
            </Field>
            <Field label="Status inicial">
              <SelectInput
                value={rascunho.status}
                onChange={(e) => setRascunho({ ...rascunho, status: e.target.value as StatusUsuario })}
              >
                <option value="convidado">Convite pendente</option>
                <option value="ativo">Ativo</option>
                <option value="suspenso">Suspenso</option>
              </SelectInput>
            </Field>
            <Field label="Limite de solicitações simultâneas (WIP)">
              <TextInput
                type="number"
                min={1}
                value={rascunho.limiteWip}
                onChange={(e) => setRascunho({ ...rascunho, limiteWip: Number(e.target.value) || 1 })}
              />
            </Field>
          </Grid>

          <Field label="Observações internas">
            <TextArea
              rows={2}
              value={rascunho.observacao}
              onChange={(e) => setRascunho({ ...rascunho, observacao: e.target.value })}
              placeholder="Contexto de atuação, restrições ou período de afastamento."
            />
          </Field>

          <div className="rounded-md border border-border px-3">
            <Toggle
              checked={rascunho.mfa}
              onChange={(v) => setRascunho({ ...rascunho, mfa: v })}
              label="MFA configurado"
              hint={
                settings.seguranca.mfaObrigatorio
                  ? "A política atual exige MFA para usuários ativos."
                  : "Recomendado para todos os perfis com acesso a emissão."
              }
            />
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Permissões herdadas do papel</p>
            <p className="mt-1">
              {(papeis.find((p) => p.id === rascunho.papelId)?.permissoes ?? [])
                .map((perm) => permissoesDisponiveis.find((x) => x.id === perm)?.label ?? perm)
                .join(" · ") || "Nenhuma permissão marcada para este papel."}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={novoPapel}
        onClose={() => setNovoPapel(false)}
        title="Novo papel"
        hint="Depois marque as permissões diretamente na matriz."
        width="max-w-md"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setNovoPapel(false)}>
              Cancelar
            </Btn>
            <Btn onClick={criarPapel}>Criar papel</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Nome do papel">
            <TextInput
              value={papelDraft.nome}
              onChange={(e) => setPapelDraft({ ...papelDraft, nome: e.target.value })}
              placeholder="Ex.: Supervisor de emissão"
            />
          </Field>
          <Field label="Descrição">
            <TextInput
              value={papelDraft.descricao}
              onChange={(e) => setPapelDraft({ ...papelDraft, descricao: e.target.value })}
              placeholder="O que este papel pode fazer"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={remover !== null}
        title={`Remover ${remover?.nome ?? "usuário"}?`}
        descricao="O acesso é revogado imediatamente e as solicitações em aberto voltam para a fila."
        confirmLabel="Remover usuário"
        destructive
        onCancel={() => setRemover(null)}
        onConfirm={() => {
          setUsuarios(usuarios.filter((u) => u.id !== remover?.id));
          toast.success("Usuário removido", { description: "Registro mantido na trilha de auditoria." });
          setRemover(null);
        }}
      />

      <ConfirmDialog
        open={removerPapel !== null}
        title="Remover papel?"
        descricao="Usuários vinculados precisarão ser realocados em outro papel."
        confirmLabel="Remover papel"
        destructive
        onCancel={() => setRemoverPapel(null)}
        onConfirm={() => {
          const vinculados = usuarios.filter((u) => u.papelId === removerPapel).length;
          if (vinculados > 0) {
            toast.error("Papel em uso", {
              description: `${vinculados} usuário(s) ainda estão neste papel. Realoque antes de remover.`,
            });
            setRemoverPapel(null);
            return;
          }
          replace("papeis", papeis.filter((p) => p.id !== removerPapel));
          toast.success("Papel removido");
          setRemoverPapel(null);
        }}
      />
    </div>
  );
}


/* ---------------------------------------------------------------- Segurança */

export function SecaoSeguranca() {
  const { settings, update } = useSettings();
  const s = settings.seguranca;
  const [encerrar, setEncerrar] = useState<string | null>(null);

  const toggleMetodo = (m: string) =>
    update("seguranca", {
      metodosMfa: s.metodosMfa.includes(m) ? s.metodosMfa.filter((x) => x !== m) : [...s.metodosMfa, m],
    });

  const metodos = [
    { id: "app", label: "App autenticador (TOTP)" },
    { id: "sms", label: "SMS" },
    { id: "email", label: "E-mail" },
    { id: "chave", label: "Chave de segurança / Passkey" },
    { id: "certificado", label: "Certificado digital (A3)" },
  ];

  return (
    <div className="space-y-4">
      <Panel title="Autenticação multifator (MFA)">
        <Rows>
          <Toggle
            label="Exigir MFA para todos os usuários internos"
            hint="Parceiros contábeis seguem a política do portal externo."
            checked={s.mfaObrigatorio}
            onChange={(v) => update("seguranca", { mfaObrigatorio: v })}
          />
          <Toggle
            label="Pedir MFA novamente em ações críticas"
            hint="Emissão, revogação, alteração de configurações e liquidação financeira."
            checked={s.mfaParaAcoesCriticas}
            onChange={(v) => update("seguranca", { mfaParaAcoesCriticas: v })}
          />
        </Rows>
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Métodos permitidos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {metodos.map((m) => {
              const on = s.metodosMfa.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMetodo(m.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    on
                      ? "border-primary bg-primary-soft text-primary-deep"
                      : "border-border text-muted-foreground hover:border-border-strong",
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel title="Política de senha e sessão">
        <Grid cols={3}>
          <Field label="Tamanho mínimo">
            <TextInput
              type="number"
              min={6}
              value={s.senhaMinima}
              onChange={(e) => update("seguranca", { senhaMinima: Number(e.target.value) })}
            />
          </Field>
          <Field label="Expiração da senha (dias)">
            <TextInput
              type="number"
              min={0}
              value={s.senhaExpiraDias}
              onChange={(e) => update("seguranca", { senhaExpiraDias: Number(e.target.value) })}
            />
          </Field>
          <Field label="Bloquear após tentativas">
            <TextInput
              type="number"
              min={3}
              value={s.bloquearAposTentativas}
              onChange={(e) => update("seguranca", { bloquearAposTentativas: Number(e.target.value) })}
            />
          </Field>
          <Field label="Expirar sessão inativa (min)">
            <TextInput
              type="number"
              min={5}
              value={s.sessaoExpiraMin}
              onChange={(e) => update("seguranca", { sessaoExpiraMin: Number(e.target.value) })}
            />
          </Field>
        </Grid>
        <Rows>
          <Toggle
            label="Exigir símbolos e números na senha"
            checked={s.exigirSimbolos}
            onChange={(v) => update("seguranca", { exigirSimbolos: v })}
          />
          <Toggle
            label="Permitir apenas uma sessão simultânea por usuário"
            checked={s.sessaoUnica}
            onChange={(v) => update("seguranca", { sessaoUnica: v })}
          />
          <Toggle
            label="Alertar login em novo dispositivo ou local"
            checked={s.alertarLoginNovoDispositivo}
            onChange={(v) => update("seguranca", { alertarLoginNovoDispositivo: v })}
          />
          <Toggle
            label="Exigir VPN corporativa para o back-office"
            checked={s.exigirVpn}
            onChange={(v) => update("seguranca", { exigirVpn: v })}
          />
        </Rows>
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            IPs e faixas liberadas
          </p>
          <TagList
            values={s.ipAllowlist}
            onChange={(ipAllowlist) => update("seguranca", { ipAllowlist })}
            placeholder="Ex.: 200.155.30.0/24"
          />
        </div>
      </Panel>

      <Panel
        title="Sessões e dispositivos"
        hint="Sessões abertas com a sua credencial."
        bodyClassName="p-0"
        actions={
          <Btn
            variant="ghost"
            onClick={() => {
              update("seguranca", { sessoes: s.sessoes.filter((x) => x.atual) });
              toast.success("Todas as outras sessões foram encerradas");
            }}
          >
            Encerrar todas as outras
          </Btn>
        }
      >
        <ul className="divide-y divide-border">
          {s.sessoes.map((sessao) => (
            <li key={sessao.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <Laptop className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {sessao.dispositivo} · {sessao.navegador}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {sessao.local} · {sessao.ip} · {sessao.quando}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {sessao.atual ? (
                  <Chip tone="blue">Sessão atual</Chip>
                ) : (
                  <Btn variant="ghost" onClick={() => setEncerrar(sessao.id)}>
                    Encerrar
                  </Btn>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Últimos acessos" hint="Trilha de autenticação dos últimos dias." bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Usuário</th>
                <th className="px-4 py-2 font-medium">Quando</th>
                <th className="px-4 py-2 font-medium">Local</th>
                <th className="px-4 py-2 font-medium">IP</th>
                <th className="px-4 py-2 font-medium">Método</th>
                <th className="px-4 py-2 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.acessos.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2">{a.usuario}</td>
                  <td className="px-4 py-2 text-muted-foreground">{a.quando}</td>
                  <td className="px-4 py-2 text-muted-foreground">{a.local}</td>
                  <td className="px-4 py-2 tabular text-muted-foreground">{a.ip}</td>
                  <td className="px-4 py-2 text-muted-foreground">{a.metodo}</td>
                  <td className="px-4 py-2">
                    {a.resultado === "sucesso" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <CheckCircle2 className="size-3.5" /> sucesso
                      </span>
                    ) : a.resultado === "falha" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="size-3.5" /> falha
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-alert">
                        <ShieldAlert className="size-3.5" /> bloqueado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Auditoria">
        <Rows>
          <Toggle
            label="Trilha de auditoria imutável"
            hint="Eventos não podem ser editados nem excluídos por nenhum papel."
            checked={s.trilhaImutavel}
            onChange={(v) => update("seguranca", { trilhaImutavel: v })}
          />
        </Rows>
        <div className="mt-3 max-w-xs">
          <Field label="Retenção de logs (meses)">
            <TextInput
              type="number"
              min={6}
              value={s.retencaoLogsMeses}
              onChange={(e) => update("seguranca", { retencaoLogsMeses: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Panel>

      <ConfirmDialog
        open={encerrar !== null}
        title="Encerrar sessão?"
        descricao="O dispositivo precisará autenticar novamente."
        confirmLabel="Encerrar sessão"
        destructive
        onCancel={() => setEncerrar(null)}
        onConfirm={() => {
          update("seguranca", { sessoes: s.sessoes.filter((x) => x.id !== encerrar) });
          setEncerrar(null);
          toast.success("Sessão encerrada");
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- Notificações */

export function SecaoNotificacoes() {
  const { settings, update } = useSettings();
  const n = settings.notificacoes;
  const canais = ["email", "whatsapp", "sms", "push"] as const;

  const toggle = (eventoId: string, canal: (typeof canais)[number]) =>
    update("notificacoes", {
      eventos: n.eventos.map((e) => (e.id === eventoId ? { ...e, [canal]: !e[canal] } : e)),
    });

  return (
    <div className="space-y-4">
      <Panel title="Matriz de notificações" hint="Quais eventos disparam quais canais." bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Evento</th>
                {canais.map((c) => (
                  <th key={c} className="px-2 py-2 text-center font-medium capitalize">
                    {c === "email" ? "E-mail" : c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {n.eventos.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">{e.label}</td>
                  {canais.map((c) => (
                    <td key={c} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        aria-label={`${e.label} por ${c}`}
                        onClick={() => toggle(e.id, c)}
                        className={cn(
                          "grid size-6 place-items-center rounded border transition-colors",
                          e[c]
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-transparent hover:border-border-strong",
                        )}
                      >
                        <CheckCircle2 className="size-3.5" />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Remetente e janela de silêncio">
        <Grid>
          <Field label="Remetente padrão">
            <TextInput value={n.remetente} onChange={(e) => update("notificacoes", { remetente: e.target.value })} />
          </Field>
          <Field label="Assinatura">
            <TextInput value={n.assinatura} onChange={(e) => update("notificacoes", { assinatura: e.target.value })} />
          </Field>
          <Field label="Silêncio de" hint="Não enviar notificações ativas neste intervalo.">
            <TextInput
              type="time"
              value={n.silencioInicio}
              onChange={(e) => update("notificacoes", { silencioInicio: e.target.value })}
            />
          </Field>
          <Field label="Silêncio até">
            <TextInput
              type="time"
              value={n.silencioFim}
              onChange={(e) => update("notificacoes", { silencioFim: e.target.value })}
            />
          </Field>
        </Grid>
        <Rows>
          <Toggle
            label="Enviar resumo diário da operação aos gestores"
            checked={n.resumoDiario}
            onChange={(v) => update("notificacoes", { resumoDiario: v })}
          />
        </Rows>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------- Integrações */

export function SecaoIntegracoes() {
  const { settings, update } = useSettings();
  const i = settings.integracoes;
  const [revogar, setRevogar] = useState<ChaveApi | null>(null);

  return (
    <div className="space-y-4">
      <Panel title="Conectores" hint="Serviços externos usados pela operação." bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {i.conectores.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <Plug className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.nome}</p>
                <p className="text-[11px] text-muted-foreground">{c.descricao}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Chip tone={c.conectado ? "blue" : "outline"}>{c.conectado ? "Conectado" : "Desconectado"}</Chip>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    update("integracoes", {
                      conectores: i.conectores.map((x) => (x.id === c.id ? { ...x, conectado: !x.conectado } : x)),
                    });
                    toast.success(`${c.nome} ${c.conectado ? "desconectado" : "conectado"}`);
                  }}
                >
                  {c.conectado ? "Desconectar" : "Conectar"}
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Chaves de API"
        hint="Credenciais de integração. O segredo só é exibido na criação."
        bodyClassName="p-0"
        actions={
          <Btn
            variant="ghost"
            onClick={() => {
              update("integracoes", {
                chaves: [
                  {
                    id: `k${Math.random().toString(36).slice(2, 6)}`,
                    nome: "Nova integração",
                    prefixo: `cts_live_${Math.random().toString(36).slice(2, 6)}`,
                    escopo: "clientes:ro",
                    criadaEm: new Date().toISOString().slice(0, 10),
                    ultimoUso: "nunca",
                    ativa: true,
                  },
                  ...i.chaves,
                ],
              });
              toast.success("Chave gerada", { description: "Copie o segredo agora — ele não será exibido de novo." });
            }}
          >
            <KeyRound className="size-4" /> Gerar chave
          </Btn>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Chave</th>
                <th className="px-4 py-2 font-medium">Escopo</th>
                <th className="px-4 py-2 font-medium">Último uso</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {i.chaves.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-2">{k.nome}</td>
                  <td className="px-4 py-2 tabular text-muted-foreground">{k.prefixo}••••••</td>
                  <td className="px-4 py-2 text-muted-foreground">{k.escopo}</td>
                  <td className="px-4 py-2 text-muted-foreground">{k.ultimoUso}</td>
                  <td className="px-4 py-2">
                    <Chip tone={k.ativa ? "blue" : "outline"}>{k.ativa ? "Ativa" : "Revogada"}</Chip>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {k.ativa && (
                      <Btn variant="ghost" onClick={() => setRevogar(k)}>
                        Revogar
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Webhooks" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {i.webhooks.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{w.evento}</p>
                <p className="truncate text-[11px] text-muted-foreground">{w.url}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {w.status === "falha" && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-alert">
                    <AlertTriangle className="size-3.5" /> última entrega falhou
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">{w.ultimaEntrega}</span>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    update("integracoes", {
                      webhooks: i.webhooks.map((x) => (x.id === w.id ? { ...x, ativo: !x.ativo } : x)),
                    });
                  }}
                >
                  {w.ativo ? "Pausar" : "Ativar"}
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <ConfirmDialog
        open={revogar !== null}
        title={`Revogar ${revogar?.nome ?? ""}?`}
        descricao="As integrações que usam esta chave deixarão de funcionar imediatamente."
        confirmLabel="Revogar chave"
        destructive
        onCancel={() => setRevogar(null)}
        onConfirm={() => {
          update("integracoes", {
            chaves: i.chaves.map((x) => (x.id === revogar?.id ? { ...x, ativa: false } : x)),
          });
          setRevogar(null);
          toast.success("Chave revogada");
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- Financeiro */

export function SecaoFinanceiro() {
  const { settings, update } = useSettings();
  const f = settings.financeiro;
  return (
    <div className="space-y-4">
      <Panel title="Cobrança padrão">
        <Grid cols={3}>
          <Field label="Vencimento padrão (dias)">
            <TextInput
              type="number"
              min={0}
              value={f.diasVencimentoPadrao}
              onChange={(e) => update("financeiro", { diasVencimentoPadrao: Number(e.target.value) })}
            />
          </Field>
          <Field label="Juros ao mês (%)">
            <TextInput
              type="number"
              step="0.1"
              value={f.jurosMesPercent}
              onChange={(e) => update("financeiro", { jurosMesPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Multa por atraso (%)">
            <TextInput
              type="number"
              step="0.1"
              value={f.multaPercent}
              onChange={(e) => update("financeiro", { multaPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Carga tributária estimada (%)">
            <TextInput
              type="number"
              step="0.01"
              value={f.impostoPercent}
              onChange={(e) => update("financeiro", { impostoPercent: Number(e.target.value) })}
            />
          </Field>
        </Grid>
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Métodos de pagamento aceitos
          </p>
          <TagList
            values={f.metodosPagamento}
            onChange={(metodosPagamento) => update("financeiro", { metodosPagamento })}
            placeholder="Ex.: Débito automático"
          />
        </div>
        <Rows>
          <Toggle
            label="Emitir NF-e automaticamente na liquidação"
            checked={f.emitirNfeAutomatico}
            onChange={(v) => update("financeiro", { emitirNfeAutomatico: v })}
          />
        </Rows>
      </Panel>

      <Panel title="Comissionamento de parceiros">
        <Grid>
          <Field label="Comissão padrão (%)" hint="Aplicada a novos credenciamentos.">
            <TextInput
              type="number"
              step="0.5"
              value={f.comissaoPadraoPercent}
              onChange={(e) => update("financeiro", { comissaoPadraoPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Dia de fechamento da comissão">
            <TextInput
              type="number"
              min={1}
              max={28}
              value={f.fechamentoComissaoDia}
              onChange={(e) => update("financeiro", { fechamentoComissaoDia: Number(e.target.value) })}
            />
          </Field>
        </Grid>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------- Aparência e portal */

export function SecaoAparencia() {
  const { settings, update } = useSettings();
  const a = settings.aparencia;
  return (
    <Panel title="Aparência e portal do cliente">
      <Grid cols={3}>
        <Field label="Densidade padrão">
          <SelectInput
            value={a.densidade}
            onChange={(e) => update("aparencia", { densidade: e.target.value as typeof a.densidade })}
          >
            <option value="confortavel">Confortável</option>
            <option value="compacta">Compacta</option>
          </SelectInput>
        </Field>
        <Field label="Cor institucional">
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Cor institucional"
              value={a.corPrimaria}
              onChange={(e) => update("aparencia", { corPrimaria: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded-md border border-border bg-card"
            />
            <TextInput value={a.corPrimaria} onChange={(e) => update("aparencia", { corPrimaria: e.target.value })} />
          </div>
        </Field>
        <Field label="Formato de data">
          <SelectInput value={a.formatoData} onChange={(e) => update("aparencia", { formatoData: e.target.value })}>
            <option>dd/MM/yyyy</option>
            <option>yyyy-MM-dd</option>
            <option>dd MMM yyyy</option>
          </SelectInput>
        </Field>
      </Grid>
      <div className="mt-3">
        <Field label="Mensagem de boas-vindas do portal">
          <TextArea
            value={a.mensagemPortal}
            onChange={(e) => update("aparencia", { mensagemPortal: e.target.value })}
          />
        </Field>
      </div>
      <Rows>
        <Toggle
          label="Exibir logo da AC no portal e nos e-mails"
          checked={a.exibirLogoPortal}
          onChange={(v) => update("aparencia", { exibirLogoPortal: v })}
        />
      </Rows>
    </Panel>
  );
}

/* --------------------------------------------------------- Dados e LGPD */

export function SecaoDados({ onReset }: { onReset: () => void }) {
  const { settings, update } = useSettings();
  const d = settings.dados;
  const [confirmar, setConfirmar] = useState(false);

  return (
    <div className="space-y-4">
      <Panel title="Retenção e privacidade">
        <Grid>
          <Field label="Retenção de documentos (meses)" hint="Mínimo regulatório ICP-Brasil: 72 meses.">
            <TextInput
              type="number"
              min={12}
              value={d.retencaoDocumentosMeses}
              onChange={(e) => update("dados", { retencaoDocumentosMeses: Number(e.target.value) })}
            />
          </Field>
          <Field label="Encarregado de dados (DPO)">
            <TextInput value={d.encarregadoLgpd} onChange={(e) => update("dados", { encarregadoLgpd: e.target.value })} />
          </Field>
        </Grid>
        <Rows>
          <Toggle
            label="Anonimizar dados após encerramento do relacionamento"
            checked={d.anonimizarAposEncerrar}
            onChange={(v) => update("dados", { anonimizarAposEncerrar: v })}
          />
          <Toggle
            label="Registrar consentimento LGPD em cada solicitação"
            checked={d.consentimentoLgpd}
            onChange={(v) => update("dados", { consentimentoLgpd: v })}
          />
          <Toggle
            label="Backup diário criptografado"
            checked={d.backupDiario}
            onChange={(v) => update("dados", { backupDiario: v })}
          />
        </Rows>
      </Panel>

      <Panel title="Zona de risco" hint="Ações irreversíveis sobre os dados do ambiente.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-alert/40 bg-alert-soft/50 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-alert">Restaurar configurações de fábrica</p>
            <p className="text-xs text-muted-foreground">
              Retorna esteira, SLA, catálogo, segurança e integrações aos valores padrão.
            </p>
          </div>
          <Btn variant="danger" onClick={() => setConfirmar(true)}>
            Restaurar padrão
          </Btn>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmar}
        title="Restaurar configurações de fábrica?"
        descricao="Todas as personalizações desta AC serão perdidas."
        confirmLabel="Restaurar"
        destructive
        onCancel={() => setConfirmar(false)}
        onConfirm={() => {
          onReset();
          setConfirmar(false);
          toast.success("Configurações restauradas ao padrão");
        }}
      />
    </div>
  );
}
