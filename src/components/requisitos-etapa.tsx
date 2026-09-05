// Checklist híbrido e tipado da etapa.
// Cada linha mostra requisito, status, motivo, origem da evidência e apenas as
// ações que fazem sentido para o modo de cumprimento configurado.
// Nada aqui é inferido pelo texto do item.
import {
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock,
  FileCheck2,
  History,
  Lock,
  Minus,
  Paperclip,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Btn, Field, Modal, Select, TextArea, TextInput } from "@/components/forms";
import { emissoesDoCaso } from "@/lib/caso-model";
import {
  ACOES_PRODUTO,
  RESULTADOS_CONSULTA,
  categoriaInfo,
  linhaRequisito,
  modoInfo,
  portoesAtivos,
  requisitoAtendido,
  rotuloEstadoRequisito,
  type AcaoRequisito,
  type EstadoRequisito,
  type LinhaRequisito,
} from "@/lib/checklist-model";
import type { ChecklistItem, Request } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const tonEstado: Record<EstadoRequisito, string> = {
  nao_iniciado: "border border-border-strong text-muted-foreground",
  em_andamento: "bg-primary-soft text-primary-deep",
  aguardando_info: "border border-border-strong text-muted-foreground",
  automatico: "bg-primary text-primary-foreground",
  reutilizado: "bg-primary-soft text-primary-deep",
  confirmado: "bg-primary-soft text-primary-deep",
  concluido: "bg-primary-soft text-primary-deep",
  rejeitado: "bg-alert-soft text-alert",
  expirado: "bg-alert-soft text-alert",
  nao_aplicavel: "bg-muted text-muted-foreground",
};

const iconeEstado: Record<EstadoRequisito, typeof CheckCircle2> = {
  nao_iniciado: CircleDashed,
  em_andamento: Clock,
  aguardando_info: Clock,
  automatico: Sparkles,
  reutilizado: FileCheck2,
  confirmado: CheckCircle2,
  concluido: CheckCircle2,
  rejeitado: TriangleAlert,
  expirado: TriangleAlert,
  nao_aplicavel: Minus,
};

function StatusChip({ estado }: { estado: EstadoRequisito }) {
  const Icon = iconeEstado[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tonEstado[estado],
      )}
    >
      <Icon className="size-3" />
      {rotuloEstadoRequisito[estado]}
    </span>
  );
}

// ------------------------------------------------------------------ diálogos

function DlgConfirmar({ r, item, onClose }: { r: Request; item: ChecklistItem; onClose: () => void }) {
  const store = useStore();
  const [obs, setObs] = useState("");
  const exige = item.observacaoObrigatoria === true;
  const invalido = exige && obs.trim().length < 3;
  return (
    <Modal
      open
      onClose={onClose}
      title="Confirmar realização"
      hint={`${item.label} · ${r.protocolo}`}
      width="max-w-md"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            disabled={invalido}
            onClick={() => {
              store.cumprirRequisito(r.id, item.id, {
                tipo: "confirmacao",
                origem: "confirmacao",
                ...(obs.trim() ? { observacao: obs.trim() } : {}),
              });
              onClose();
            }}
          >
            Confirmar
          </Btn>
        </>
      }
    >
      <p className="mb-3 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        Atividade humana que o sistema não consegue verificar. Ficam registrados operador, data e
        hora — sem anexo obrigatório.
      </p>
      <Field
        label={exige ? "Observação" : "Observação · opcional"}
        {...(invalido ? { error: "Descreva o que foi feito." } : {})}
      >
        <TextArea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
      </Field>
    </Modal>
  );
}

function DlgDocumento({
  r,
  item,
  onClose,
}: {
  r: Request;
  item: ChecklistItem;
  onClose: () => void;
}) {
  const store = useStore();
  const [arquivo, setArquivo] = useState("");
  const [ref, setRef] = useState("");
  const [tentou, setTentou] = useState(false);
  const cat = categoriaInfo(item.categoriaDoc ?? "identidade");
  return (
    <Modal
      open
      onClose={onClose}
      title="Enviar nova versão"
      hint={`${cat.nome} · ${r.protocolo}`}
      width="max-w-lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            onClick={() => {
              setTentou(true);
              if (!arquivo || !ref.trim()) return;
              store.cumprirRequisito(r.id, item.id, {
                tipo: cat.id,
                origem: "nova",
                arquivo,
                referencia: ref.trim(),
              });
              onClose();
            }}
          >
            Anexar documento
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          A nova versão entra no dossiê do cliente e marca a versão anterior como substituída — o
          histórico continua consultável.
        </p>
        <Field
          label="Arquivo"
          hint="PDF ou imagem legível"
          {...(tentou && !arquivo ? { error: "Anexe o arquivo." } : {})}
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary hover:bg-primary-soft/40 focus-within:ring-2 focus-within:ring-primary">
              <Paperclip className="size-3.5" /> Escolher arquivo
              <input
                type="file"
                className="sr-only"
                onChange={(e) => setArquivo(e.target.files?.[0]?.name ?? "")}
              />
            </label>
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {arquivo || "Nenhum arquivo selecionado"}
            </span>
          </div>
        </Field>
        <Field
          label="Tipo / número do documento"
          {...(tentou && !ref.trim() ? { error: "Campo obrigatório." } : {})}
        >
          <TextInput value={ref} onChange={(e) => setRef(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function DlgReutilizar({
  r,
  linha,
  onClose,
}: {
  r: Request;
  linha: LinhaRequisito;
  onClose: () => void;
}) {
  const store = useStore();
  const [sel, setSel] = useState(linha.reutilizaveis[0]?.id ?? "");
  return (
    <Modal
      open
      onClose={onClose}
      title="Usar documento existente"
      hint={`${linha.item.label} · sem novo upload`}
      width="max-w-lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            disabled={!sel}
            onClick={() => {
              store.reutilizarDocumento(r.id, linha.item.id, sel);
              onClose();
            }}
          >
            Vincular ao requisito
          </Btn>
        </>
      }
    >
      <p className="mb-3 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        O arquivo não é duplicado: a versão existente é vinculada a este requisito e fica marcada
        como <span className="font-medium text-foreground">Reutilizado</span>, com operador, data e
        política aplicada.
      </p>
      <ul className="space-y-1.5">
        {linha.reutilizaveis.map((d) => (
          <li key={d.id}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-xs",
                sel === d.id ? "border-primary bg-primary-soft/40" : "border-border",
              )}
            >
              <input
                type="radio"
                name="doc"
                className="mt-0.5"
                checked={sel === d.id}
                onChange={() => setSel(d.id)}
              />
              <span className="min-w-0">
                <span className="block font-medium">{d.nome}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {d.tipo} · enviado em {d.enviadoEm} · {d.status}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function DlgConsulta({ r, item, onClose }: { r: Request; item: ChecklistItem; onClose: () => void }) {
  const store = useStore();
  const [fonte, setFonte] = useState("Receita Federal");
  const [sujeito, setSujeito] = useState(r.cliente);
  const [quando, setQuando] = useState("");
  const [resultado, setResultado] = useState<string>(RESULTADOS_CONSULTA[0]);
  const [protocolo, setProtocolo] = useState("");
  const [obs, setObs] = useState("");
  const [tentou, setTentou] = useState(false);
  const faltando = !fonte.trim() || !sujeito.trim() || !quando;
  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar consulta"
      hint={`${item.label} · registro manual`}
      width="max-w-lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            onClick={() => {
              setTentou(true);
              if (faltando) return;
              store.cumprirRequisito(r.id, item.id, {
                tipo: "consulta",
                origem: "manual",
                fonte: fonte.trim(),
                referencia: `${sujeito.trim()}${protocolo.trim() ? ` · protocolo ${protocolo.trim()}` : ""}`,
                resultado,
                quando,
                ...(obs.trim() ? { observacao: obs.trim() } : {}),
              });
              onClose();
            }}
          >
            Registrar
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Consulta feita fora do Certus fica marcada como{" "}
          <span className="font-medium text-foreground">Registrado manualmente</span> — nunca como
          verificação automática.
        </p>
        <Field label="Fonte consultada" {...(tentou && !fonte.trim() ? { error: "Informe a fonte." } : {})}>
          <TextInput value={fonte} onChange={(e) => setFonte(e.target.value)} />
        </Field>
        <Field label="Sujeito consultado" {...(tentou && !sujeito.trim() ? { error: "Informe o sujeito." } : {})}>
          <TextInput value={sujeito} onChange={(e) => setSujeito(e.target.value)} />
        </Field>
        <Field label="Data e hora" {...(tentou && !quando ? { error: "Informe quando foi feita." } : {})}>
          <TextInput type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} />
        </Field>
        <Field label="Resultado">
          <Select value={resultado} onChange={(e) => setResultado(e.target.value)}>
            {RESULTADOS_CONSULTA.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
        <Field label="Protocolo externo · opcional">
          <TextInput value={protocolo} onChange={(e) => setProtocolo(e.target.value)} />
        </Field>
        <Field label="Observação · opcional">
          <TextArea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function DlgAcaoProduto({
  r,
  item,
  onClose,
}: {
  r: Request;
  item: ChecklistItem;
  onClose: () => void;
}) {
  const store = useStore();
  const [ref, setRef] = useState("");
  const acao = ACOES_PRODUTO.find((a) => a.id === item.acaoProduto);
  return (
    <Modal
      open
      onClose={onClose}
      title={acao?.nome ?? "Ação do produto"}
      hint={`${item.label} · ${r.protocolo}`}
      width="max-w-md"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            disabled={ref.trim().length < 3}
            onClick={() => {
              store.cumprirRequisito(r.id, item.id, {
                tipo: item.acaoProduto ?? "acao",
                origem: "manual",
                referencia: ref.trim(),
              });
              onClose();
            }}
          >
            Concluir a partir do resultado
          </Btn>
        </>
      }
    >
      <p className="mb-3 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        Este requisito é atendido pelo resultado da ação estruturada do Certus — não por um
        formulário genérico.
      </p>
      <Field label="Referência do registro" hint="Ex.: protocolo, número do registro ou emissão">
        <TextInput value={ref} onChange={(e) => setRef(e.target.value)} />
      </Field>
    </Modal>
  );
}

function DlgDecisao({ r, item, onClose }: { r: Request; item: ChecklistItem; onClose: () => void }) {
  const store = useStore();
  const [motivo, setMotivo] = useState("");
  const [aprovador, setAprovador] = useState("");
  const [segundo, setSegundo] = useState("");
  const precisaSegundo = item.exigeSegundoOperador === true;
  const invalido =
    motivo.trim().length < 20 || aprovador.trim().length < 3 || (precisaSegundo && segundo.trim().length < 3);
  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar decisão controlada"
      hint={`${item.label} · exige permissão específica`}
      width="max-w-lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            disabled={invalido}
            onClick={() => {
              store.cumprirRequisito(r.id, item.id, {
                tipo: "decisao",
                origem: "decisao",
                referencia: `Aprovado por ${aprovador.trim()}${precisaSegundo ? ` · 2º operador ${segundo.trim()}` : ""}`,
                observacao: motivo.trim(),
              });
              onClose();
            }}
          >
            Registrar decisão
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-md bg-alert-soft px-3 py-2">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-alert" />
          <p className="text-xs text-alert">
            Decisão controlada não é caixa de seleção: exige alçada, motivo registrado
            {precisaSegundo ? " e segundo operador" : ""}.
          </p>
        </div>
        <Field label="Motivo / fundamentação" hint="Mínimo de 20 caracteres — fica na auditoria">
          <TextArea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
        <Field label="Responsável pela alçada">
          <TextInput value={aprovador} onChange={(e) => setAprovador(e.target.value)} />
        </Field>
        {precisaSegundo && (
          <Field label="Segundo operador">
            <TextInput value={segundo} onChange={(e) => setSegundo(e.target.value)} />
          </Field>
        )}
      </div>
    </Modal>
  );
}

function DlgNaoAplicavel({
  r,
  item,
  onClose,
}: {
  r: Request;
  item: ChecklistItem;
  onClose: () => void;
}) {
  const store = useStore();
  const [motivo, setMotivo] = useState("");
  const [regra, setRegra] = useState("Regra do produto");
  return (
    <Modal
      open
      onClose={onClose}
      title="Marcar como não aplicável"
      hint={`${item.label} — não conta como concluído`}
      width="max-w-md"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            disabled={motivo.trim().length < 5}
            onClick={() => {
              store.naoAplicarRequisito(r.id, item.id, motivo.trim(), regra);
              onClose();
            }}
          >
            Marcar
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Motivo">
          <TextArea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
        <Field label="Regra que determina a não aplicabilidade">
          <Select value={regra} onChange={(e) => setRegra(e.target.value)}>
            <option>Regra do produto</option>
            <option>Regra da modalidade</option>
            <option>Regra da unidade</option>
            <option>Regra do perfil homologado</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

function DlgSolicitar({ r, item, onClose }: { r: Request; item: ChecklistItem; onClose: () => void }) {
  const store = useStore();
  const [msg, setMsg] = useState(`Precisamos do item “${item.label}” para seguir com a emissão.`);
  return (
    <Modal
      open
      onClose={onClose}
      title="Solicitar ao cliente"
      hint={item.label}
      width="max-w-md"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            onClick={() => {
              store.solicitarAoCliente(r.id, item.id, msg.trim());
              onClose();
            }}
          >
            Enviar pedido
          </Btn>
        </>
      }
    >
      <Field label="Mensagem" hint="Fica registrada na trilha do caso.">
        <TextArea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
      </Field>
    </Modal>
  );
}

function DlgReabrir({ r, item, onClose }: { r: Request; item: ChecklistItem; onClose: () => void }) {
  const store = useStore();
  const [motivo, setMotivo] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title="Reabrir requisito"
      hint={`${item.label} — evidência e histórico anteriores são preservados.`}
      width="max-w-md"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="danger"
            disabled={motivo.trim().length < 3}
            onClick={() => {
              store.reabrirRequisito(r.id, item.id, motivo.trim());
              onClose();
            }}
          >
            Reabrir
          </Btn>
        </>
      }
    >
      <Field label="Motivo" hint="Obrigatório — registrado na timeline.">
        <TextArea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Field>
    </Modal>
  );
}

function DlgEvidencia({ linha, onClose }: { linha: LinhaRequisito; onClose: () => void }) {
  const e = linha.item.evidencia;
  return (
    <Modal open onClose={onClose} title="Evidência do requisito" hint={linha.item.label} width="max-w-lg">
      <dl className="space-y-2 text-xs">
        {[
          ["Origem", linha.origem ?? "—"],
          ["Arquivo", e?.arquivo ?? "—"],
          ["Referência", e?.referencia ?? "—"],
          ["Fonte", e?.fonte ?? "—"],
          ["Resultado", e?.resultado ?? "—"],
          ["Quando", e?.quando ?? e?.registradoEm ?? "—"],
          ["Observação", e?.observacao ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2 border-b border-border pb-1.5 last:border-0">
            <dt className="w-28 shrink-0 text-muted-foreground">{k}</dt>
            <dd className="min-w-0 flex-1">{v}</dd>
          </div>
        ))}
      </dl>
      {(linha.item.historico?.length ?? 0) > 0 && (
        <div className="mt-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <History className="size-3.5" /> Histórico
          </p>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {linha.item.historico!.map((h) => (
              <li key={h.id}>
                <span className="text-foreground">{h.acao}</span> · {h.por} · {h.quando}
                {h.detalhe ? ` — ${h.detalhe}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

// -------------------------------------------------------------------- lista

type Aberto = { tipo: AcaoRequisito["id"]; linha: LinhaRequisito } | null;

export function RequisitosEtapa({ r, compacto = false }: { r: Request; compacto?: boolean }) {
  const store = useStore();
  const [aberto, setAberto] = useState<Aberto>(null);

  const cliente = store.clients.find((c) => c.id === r.clienteId);
  const emissoes = useMemo(
    () => emissoesDoCaso(r, store.emissoesExtras[r.id] ?? []),
    [r, store.emissoesExtras],
  );

  const linhas = useMemo(
    () => r.checklist.map((i) => linhaRequisito(i, { request: r, ...(cliente ? { cliente } : {}), emissoes })),
    [r, cliente, emissoes],
  );

  const consideradas = linhas.filter((l) => l.item.modo !== "orientacao");
  const atendidos = consideradas.filter(requisitoAtendido).length;
  const total = consideradas.length;
  const pct = total ? Math.round((atendidos / total) * 100) : 100;
  const portoes = portoesAtivos(linhas);

  const abrir = (tipo: AcaoRequisito["id"], linha: LinhaRequisito) => setAberto({ tipo, linha });
  const fechar = () => setAberto(null);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <ClipboardList className="size-3.5" /> Requisitos da etapa
        </p>
        <span className="tabular text-[11px] text-muted-foreground">
          {atendidos}/{total} atendidos · {pct}%
        </span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      {portoes.length > 0 && (
        <div className="mb-2 space-y-1 rounded-md bg-alert-soft px-2.5 py-2">
          {portoes.map((p) => (
            <p key={`${p.acao}-${p.item}`} className="flex items-start gap-1.5 text-[11px] text-alert">
              <Lock className="mt-0.5 size-3 shrink-0" />
              <span>
                <span className="font-medium">{p.acao}</span> bloqueado por “{p.item}” — {p.motivo}.
                Responsável: {p.responsavel}.
              </span>
            </p>
          ))}
        </div>
      )}

      {linhas.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum requisito nesta etapa.</p>
      ) : (
        <ul className="space-y-1.5">
          {linhas.map((l) => {
            const atendido = requisitoAtendido(l);
            return (
              <li
                key={l.item.id}
                className={cn(
                  "rounded-md border border-border px-2.5 py-2",
                  atendido && l.estado !== "nao_aplicavel" && "border-primary/40 bg-primary-soft/30",
                  (l.estado === "expirado" || l.estado === "rejeitado") && "border-alert/40 bg-alert-soft/30",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                      {l.item.label}
                      <StatusChip estado={l.estado} />
                      {l.item.obrigatorio === false && (
                        <span className="rounded border border-border px-1 py-px text-[10px] text-muted-foreground">
                          Opcional
                        </span>
                      )}
                      <span className="rounded border border-border px-1 py-px text-[10px] text-muted-foreground">
                        {modoInfo(l.item.modo).nome}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{l.motivo}</p>
                    {l.origem && !compacto && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground/80">{l.origem}</p>
                    )}
                    {l.bloqueia && !requisitoAtendido(l) && (
                      <p className="mt-0.5 text-[11px] text-alert">Bloqueia: {l.bloqueia}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    {l.acoes.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => abrir(a.id, l)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                          a.primaria
                            ? "bg-primary font-medium text-primary-foreground hover:opacity-90"
                            : "border border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {a.id === "reabrir" && <RotateCcw className="size-3" />}
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {aberto?.tipo === "confirmar" && (
        <DlgConfirmar r={r} item={aberto.linha.item} onClose={fechar} />
      )}
      {(aberto?.tipo === "enviar-documento" || aberto?.tipo === "substituir") && (
        <DlgDocumento r={r} item={aberto.linha.item} onClose={fechar} />
      )}
      {aberto?.tipo === "reutilizar" && <DlgReutilizar r={r} linha={aberto.linha} onClose={fechar} />}
      {aberto?.tipo === "registrar-consulta" && (
        <DlgConsulta r={r} item={aberto.linha.item} onClose={fechar} />
      )}
      {aberto?.tipo === "acao-produto" && (
        <DlgAcaoProduto r={r} item={aberto.linha.item} onClose={fechar} />
      )}
      {aberto?.tipo === "decidir" && <DlgDecisao r={r} item={aberto.linha.item} onClose={fechar} />}
      {aberto?.tipo === "nao-aplicavel" && (
        <DlgNaoAplicavel r={r} item={aberto.linha.item} onClose={fechar} />
      )}
      {aberto?.tipo === "solicitar-cliente" && (
        <DlgSolicitar r={r} item={aberto.linha.item} onClose={fechar} />
      )}
      {aberto?.tipo === "reabrir" && <DlgReabrir r={r} item={aberto.linha.item} onClose={fechar} />}
      {(aberto?.tipo === "ver-evidencia" || aberto?.tipo === "ver-registro") && (
        <DlgEvidencia linha={aberto.linha} onClose={fechar} />
      )}
    </div>
  );
}
