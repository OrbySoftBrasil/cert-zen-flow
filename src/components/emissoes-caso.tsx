// Painel operacional das emissões de um caso. Cada emissão tem ciclo próprio:
// registro manual → conferência por outro operador → entrega → instalação → em uso.
// Nenhuma ação aqui é genérica: toda ela pertence a UMA emissão identificada.
import { AlertTriangle, CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EstadoChip } from "@/components/caso-kit";
import { Btn, Field, Modal, SelectInput, TextArea, TextInput } from "@/components/forms";
import { Chip, Panel } from "@/components/ui-kit";
import { cicloDaEmissao, rotuloEstado, type EmissaoCaso } from "@/lib/caso-model";
import {
  AVISO_SENSIVEL,
  estadoDoCiclo,
  modosEntrega,
  podeColocarEmUso,
  podeConferir,
  podeConfirmarEntregue,
  podeConfirmarInstalacao,
  podeEntregar,
  podeRegistrarEmissao,
  resultadosEmissao,
  rotuloCiclo,
  type ModoEntrega,
  type RegistroEmissao,
  type ResultadoEmissao,
} from "@/lib/emissao-model";
import { agents } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

function AvisoSensivel() {
  return (
    <p className="flex items-start gap-2 rounded-md border border-alert/40 bg-alert-soft/50 px-3 py-2 text-[11px] text-alert">
      <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>{AVISO_SENSIVEL}</span>
    </p>
  );
}

// ------------------------------------------------------------------ registro

function DialogoRegistrar({
  open,
  onClose,
  emissoes,
  emissaoId,
  requestId,
}: {
  open: boolean;
  onClose: () => void;
  emissoes: EmissaoCaso[];
  emissaoId: string;
  requestId: string;
}) {
  const store = useStore();
  const [alvo, setAlvo] = useState(emissaoId);
  const [resultado, setResultado] = useState<ResultadoEmissao>("emitida");
  const [ac, setAc] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [serie, setSerie] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [validade, setValidade] = useState("");
  const [comprovante, setComprovante] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const emissao = emissoes.find((e) => e.id === alvo) ?? emissoes[0];
  if (!open || !emissao) return null;

  function salvar() {
    const e: Record<string, string> = {};
    if (!ac.trim()) e["ac"] = "Informe a AC que processou a emissão.";
    if (!protocolo.trim()) e["protocolo"] = "Informe o protocolo externo da AC.";
    if (resultado === "emitida" && !serie.trim())
      e["serie"] = "Emissão concluída exige o número de série.";
    if (resultado === "emitida" && !dataEmissao.trim())
      e["dataEmissao"] = "Informe a data de emissão.";
    if (resultado === "emitida" && !validade.trim())
      e["validade"] = "Informe a validade do certificado.";
    if (!comprovante.trim()) e["comprovante"] = "Anexe o comprovante ou evidência do portal da AC.";
    setErros(e);
    if (Object.keys(e).length) return;
    store.registrarEmissaoManual(requestId, alvo, {
      resultado,
      ac: ac.trim(),
      protocoloExterno: protocolo.trim(),
      numeroSerie: serie.trim(),
      dataEmissao: dataEmissao.trim(),
      validade: validade.trim(),
      comprovante: comprovante.trim(),
      ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      produto: emissao!.produto,
    });
    toast.success("Registro salvo — aguardando conferência", {
      description: "A entrega continua bloqueada até outro operador confirmar os dados.",
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar emissão manual"
      hint="Os dados ficam Aguardando conferência — a entrega não é liberada por este registro."
      width="max-w-2xl"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar}>Salvar para conferência</Btn>
        </>
      }
    >
      <div className="space-y-3">
        <AvisoSensivel />
        <Field label="Emissão do caso" hint="A ação vale apenas para a emissão escolhida.">
          <SelectInput value={alvo} onChange={(ev) => setAlvo(ev.target.value)}>
            {emissoes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.produto} · {e.titular}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field
          label="Resultado"
          hint={resultadosEmissao.find((x) => x.id === resultado)?.descricao ?? ""}
        >
          <SelectInput
            value={resultado}
            onChange={(ev) => setResultado(ev.target.value as ResultadoEmissao)}
          >
            {resultadosEmissao.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Autoridade Certificadora (AC)"
            {...(erros["ac"] ? { error: erros["ac"] } : {})}
          >
            <TextInput
              value={ac}
              onChange={(ev) => setAc(ev.target.value)}
              placeholder="Ex.: AC Certus RFB"
            />
          </Field>
          <Field
            label="Protocolo externo"
            {...(erros["protocolo"] ? { error: erros["protocolo"] } : {})}
          >
            <TextInput
              value={protocolo}
              onChange={(ev) => setProtocolo(ev.target.value)}
              placeholder="Protocolo do portal da AC"
            />
          </Field>
          <Field label="Número de série" {...(erros["serie"] ? { error: erros["serie"] } : {})}>
            <TextInput
              value={serie}
              onChange={(ev) => setSerie(ev.target.value)}
              placeholder="Série do certificado"
            />
          </Field>
          <Field
            label="Data de emissão"
            {...(erros["dataEmissao"] ? { error: erros["dataEmissao"] } : {})}
          >
            <TextInput
              type="date"
              value={dataEmissao}
              onChange={(ev) => setDataEmissao(ev.target.value)}
            />
          </Field>
          <Field label="Validade" {...(erros["validade"] ? { error: erros["validade"] } : {})}>
            <TextInput
              type="date"
              value={validade}
              onChange={(ev) => setValidade(ev.target.value)}
            />
          </Field>
          <Field
            label="Comprovante / evidência"
            hint="Print ou recibo do portal da AC. Nunca o arquivo do certificado."
            {...(erros["comprovante"] ? { error: erros["comprovante"] } : {})}
          >
            <TextInput
              value={comprovante}
              onChange={(ev) => setComprovante(ev.target.value)}
              placeholder="comprovante-emissao.pdf"
            />
          </Field>
        </div>
        <Field label="Observação">
          <TextArea
            value={observacao}
            onChange={(ev) => setObservacao(ev.target.value)}
            placeholder="Contexto útil para quem vai conferir"
          />
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- conferência

function DialogoConferir({
  open,
  onClose,
  registro,
  produto,
}: {
  open: boolean;
  onClose: () => void;
  registro: RegistroEmissao;
  produto: string;
}) {
  const store = useStore();
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const permissao = podeConferir(registro, store.operadorId);

  function decidir(decisao: "confirmada" | "devolvida") {
    if (!permissao.permitido) {
      toast.error("Conferência bloqueada", { description: permissao.motivo ?? "" });
      return;
    }
    if (decisao === "devolvida" && motivo.trim().length < 4) {
      setErro("Descreva o motivo da devolução com pelo menos 4 caracteres.");
      return;
    }
    store.conferirEmissao(registro.emissaoId, decisao, motivo.trim() || undefined);
    toast.success(decisao === "confirmada" ? "Emissão confirmada" : "Emissão devolvida", {
      description:
        decisao === "confirmada"
          ? "Estado: Emitida confirmada. A entrega está liberada para esta emissão."
          : "O registro volta para quem emitiu. A entrega segue bloqueada.",
    });
    onClose();
  }

  const linhas: [string, string][] = [
    ["Resultado", registro.resultado],
    ["AC", registro.ac],
    ["Protocolo externo", registro.protocoloExterno],
    ["Número de série", registro.numeroSerie || "—"],
    ["Data de emissão", registro.dataEmissao || "—"],
    ["Validade", registro.validade || "—"],
    ["Comprovante", registro.comprovante],
    ["Registrado por", `${registro.registradoPor.nome} · ${registro.registradoPor.quando}`],
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Conferir emissão manual · ${produto}`}
      hint="A conferência precisa ser feita por um operador diferente de quem registrou."
      width="max-w-xl"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Fechar
          </Btn>
          <Btn variant="danger" onClick={() => decidir("devolvida")}>
            Devolver
          </Btn>
          <Btn onClick={() => decidir("confirmada")}>Confirmar emissão</Btn>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        {!permissao.permitido && (
          <p className="flex items-start gap-2 rounded-md border border-alert/40 bg-alert-soft/50 px-3 py-2 text-xs text-alert">
            <Lock className="mt-0.5 size-3.5 shrink-0" /> {permissao.motivo}
          </p>
        )}
        <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {linhas.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="text-sm">{v}</dd>
            </div>
          ))}
        </dl>
        {registro.observacao && (
          <p className="text-xs text-muted-foreground">Observação: {registro.observacao}</p>
        )}
        <Field label="Motivo (obrigatório para devolver)" {...(erro ? { error: erro } : {})}>
          <TextArea
            value={motivo}
            onChange={(ev) => {
              setMotivo(ev.target.value);
              if (erro) setErro(null);
            }}
            placeholder="O que precisa ser corrigido no registro"
          />
        </Field>
        <p className="text-[11px] text-muted-foreground">
          A decisão registra autor e horário na trilha de auditoria do caso.
        </p>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------------- entrega

function DialogoEntrega({
  open,
  onClose,
  emissaoId,
  produto,
}: {
  open: boolean;
  onClose: () => void;
  emissaoId: string;
  produto: string;
}) {
  const store = useStore();
  const [modo, setModo] = useState<ModoEntrega>("ac-envia");
  const [referencia, setReferencia] = useState("");
  const [observacao, setObservacao] = useState("");
  const escolhido = modosEntrega.find((m) => m.id === modo)!;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Definir entrega · ${produto}`}
      hint="A AR entrega instruções e acompanhamento. O certificado em nuvem nunca é anexado nem transportado."
      width="max-w-xl"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            onClick={() => {
              store.definirEntrega(
                emissaoId,
                modo,
                referencia.trim() || undefined,
                observacao.trim() || undefined,
              );
              toast.success("Entrega definida", { description: escolhido.nome });
              onClose();
            }}
          >
            Salvar forma de entrega
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <AvisoSensivel />
        <fieldset className="space-y-2">
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Como o titular receberá
          </legend>
          {modosEntrega.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40"
            >
              <input
                type="radio"
                name="modo-entrega"
                value={m.id}
                checked={modo === m.id}
                onChange={() => setModo(m.id)}
                className="mt-1 accent-[var(--color-primary)]"
              />
              <span>
                <span className="block font-medium">{m.nome}</span>
                <span className="block text-[11px] text-muted-foreground">{m.descricao}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <Field
          label="Referência do envio"
          hint="Protocolo do disparo, número do canal ou protocolo de retirada."
        >
          <TextInput
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ex.: ENV-2026-4471"
          />
        </Field>
        <Field label="Observação">
          <TextArea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Combinado com o titular"
          />
        </Field>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------- confirmação simples

function DialogoTexto({
  open,
  onClose,
  titulo,
  hint,
  rotulo,
  obrigatorio,
  acao,
}: {
  open: boolean;
  onClose: () => void;
  titulo: string;
  hint: string;
  rotulo: string;
  obrigatorio?: boolean;
  acao: (texto: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      hint={hint}
      width="max-w-lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            onClick={() => {
              if (obrigatorio && texto.trim().length < 4) {
                setErro("Descreva com pelo menos 4 caracteres — o texto fica na auditoria.");
                return;
              }
              acao(texto.trim());
              onClose();
            }}
          >
            Confirmar
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <AvisoSensivel />
        <Field label={rotulo} {...(erro ? { error: erro } : {})}>
          <TextArea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              if (erro) setErro(null);
            }}
          />
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- painel

type DialogoAberto =
  | { tipo: "registrar"; emissaoId: string }
  | { tipo: "conferir"; emissaoId: string }
  | { tipo: "entrega"; emissaoId: string }
  | { tipo: "entregue"; emissaoId: string }
  | { tipo: "instalacao"; emissaoId: string }
  | { tipo: "falha"; emissaoId: string }
  | { tipo: "revogar"; emissaoId: string }
  | null;

export function PainelEmissoes({
  requestId,
  emissoes,
  resumido,
  bloqueioAbsoluto,
}: {
  requestId: string;
  emissoes: EmissaoCaso[];
  resumido?: boolean;
  bloqueioAbsoluto?: string | null;
}) {
  const store = useStore();
  const [dlg, setDlg] = useState<DialogoAberto>(null);
  const emissaoDoDlg = emissoes.find((e) => e.id === dlg?.emissaoId);

  return (
    <Panel
      title="Emissões deste caso"
      hint="Cada emissão tem ciclo próprio — pagamento, documento ou validação de uma nunca libera outra"
      bodyClassName="p-0"
      {...(resumido
        ? {}
        : {
            actions: (
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                Operador
                <SelectInput
                  value={store.operadorId}
                  aria-label="Operador em uso"
                  onChange={(e) => store.setOperador(e.target.value)}
                  className="py-1 text-xs"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </SelectInput>
              </label>
            ),
          })}
    >
      <ul className="divide-y divide-border">
        {emissoes.map((e) => {
          const reg = store.emissoes[e.id];
          const ciclo = cicloDaEmissao(e, reg);
          const registrar = podeRegistrarEmissao(ciclo, {
            bloqueio: bloqueioAbsoluto ?? e.bloqueio,
            pagamentoOk: e.pagamento.estado === "concluido",
            dossieOk: e.dossie !== "bloqueado" && e.dossie !== "pendente",
            validacaoOk: e.validacao === "concluido" || e.validacao === "pronto",
          });
          const conferir = podeConferir(reg, store.operadorId);
          const entregar = podeEntregar(ciclo);
          const entregue = podeConfirmarEntregue(ciclo);
          const instalar = podeConfirmarInstalacao(ciclo);
          const emUso = podeColocarEmUso(ciclo);

          return (
            <li key={e.id} className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {e.produto}
                    {e.principal && (
                      <Chip className="ml-2" tone="blue">
                        Principal
                      </Chip>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.papelTitular}: {e.titular} · {e.ac} · {e.modalidade}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm">
                    {e.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{e.condicaoComercial}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <EstadoChip estado={estadoDoCiclo(ciclo)} label={`Ciclo: ${rotuloCiclo[ciclo]}`} />
                <EstadoChip
                  estado={e.pagamento.estado}
                  label={`Pagamento: ${e.pagamento.detalhe}`}
                />
                <EstadoChip
                  estado={e.validacao}
                  label={`Validação: ${rotuloEstado[e.validacao]}`}
                />
                {!resumido && (
                  <>
                    <EstadoChip estado={e.dossie} label={`Dossiê: ${rotuloEstado[e.dossie]}`} />
                    <EstadoChip
                      estado={e.revogacao.estado}
                      label={`Revogação: ${e.revogacao.detalhe}`}
                    />
                  </>
                )}
              </div>

              {e.motivoElegibilidade && (
                <p className="text-[11px] text-muted-foreground">
                  Elegibilidade: {e.motivoElegibilidade}
                </p>
              )}

              {!resumido && reg && (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                  <p>
                    Registro: {reg.resultado} · AC {reg.ac} · protocolo {reg.protocoloExterno}
                    {reg.numeroSerie ? ` · série ${reg.numeroSerie}` : ""}
                  </p>
                  <p>
                    Por {reg.registradoPor.nome} em {reg.registradoPor.quando} · comprovante{" "}
                    {reg.comprovante}
                  </p>
                  {reg.conferencia && (
                    <p className={reg.conferencia.decisao === "devolvida" ? "text-alert" : ""}>
                      Conferência {reg.conferencia.decisao} por {reg.conferencia.por.nome} em{" "}
                      {reg.conferencia.por.quando}
                      {reg.conferencia.motivo ? ` · ${reg.conferencia.motivo}` : ""}
                    </p>
                  )}
                  {reg.entrega && (
                    <p>
                      Entrega: {modosEntrega.find((m) => m.id === reg.entrega!.modo)?.nome}
                      {reg.entrega.referencia ? ` · ${reg.entrega.referencia}` : ""}
                      {reg.entrega.falha ? ` · falha: ${reg.entrega.falha}` : ""}
                    </p>
                  )}
                  {reg.instalacao && (
                    <p>
                      Instalação confirmada por {reg.instalacao.nome} em {reg.instalacao.quando}
                    </p>
                  )}
                </div>
              )}

              {!resumido && (
                <div className="flex flex-wrap gap-1.5">
                  <AcaoEmissao
                    label="Registrar emissão manual"
                    permissao={registrar}
                    onClick={() => setDlg({ tipo: "registrar", emissaoId: e.id })}
                  />
                  <AcaoEmissao
                    label="Conferir emissão manual"
                    permissao={conferir}
                    onClick={() => setDlg({ tipo: "conferir", emissaoId: e.id })}
                  />
                  <AcaoEmissao
                    label="Definir entrega"
                    permissao={entregar}
                    onClick={() => setDlg({ tipo: "entrega", emissaoId: e.id })}
                  />
                  <AcaoEmissao
                    label="Registrar falha de envio"
                    permissao={entregue}
                    onClick={() => setDlg({ tipo: "falha", emissaoId: e.id })}
                  />
                  <AcaoEmissao
                    label="Confirmar entrega ao titular"
                    permissao={entregue}
                    onClick={() => setDlg({ tipo: "entregue", emissaoId: e.id })}
                  />
                  <AcaoEmissao
                    label="Confirmar instalação/ativação"
                    permissao={instalar}
                    onClick={() => setDlg({ tipo: "instalacao", emissaoId: e.id })}
                  />
                  <AcaoEmissao
                    label="Revogar certificado"
                    permissao={
                      ciclo === "em-uso"
                        ? { permitido: true }
                        : {
                            permitido: false,
                            motivo: "Só é possível revogar um certificado em uso.",
                          }
                    }
                    onClick={() => setDlg({ tipo: "revogar", emissaoId: e.id })}
                  />
                  <AcaoEmissao
                    label="Marcar em uso"
                    permissao={emUso}
                    onClick={() => {
                      store.confirmarEmUso(e.id);
                      toast.success("Certificado em uso", { description: e.produto });
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {dlg?.tipo === "registrar" && (
        <DialogoRegistrar
          open
          onClose={() => setDlg(null)}
          emissoes={emissoes}
          emissaoId={dlg.emissaoId}
          requestId={requestId}
        />
      )}
      {dlg?.tipo === "conferir" && store.emissoes[dlg.emissaoId] && (
        <DialogoConferir
          open
          onClose={() => setDlg(null)}
          registro={store.emissoes[dlg.emissaoId]!}
          produto={emissaoDoDlg?.produto ?? ""}
        />
      )}
      {dlg?.tipo === "entrega" && (
        <DialogoEntrega
          open
          onClose={() => setDlg(null)}
          emissaoId={dlg.emissaoId}
          produto={emissaoDoDlg?.produto ?? ""}
        />
      )}
      {dlg?.tipo === "falha" && (
        <DialogoTexto
          open
          onClose={() => setDlg(null)}
          titulo="Registrar falha de envio"
          hint="Abre tarefa manual para o suporte de entrega. A emissão continua Entrega pendente."
          rotulo="O que falhou (obrigatório)"
          obrigatorio
          acao={(t) => {
            store.registrarFalhaEntrega(dlg.emissaoId, t);
            toast.error("Falha registrada", {
              description: "Tarefa manual aberta para o suporte de entrega.",
            });
          }}
        />
      )}
      {dlg?.tipo === "entregue" && (
        <DialogoTexto
          open
          onClose={() => setDlg(null)}
          titulo="Confirmar entrega ao titular"
          hint="Confirma que o titular recebeu as instruções de acesso — não o arquivo do certificado."
          rotulo="Como foi confirmado"
          acao={(t) => {
            store.confirmarEntregue(dlg.emissaoId, t || undefined);
            toast.success("Entrega confirmada");
          }}
        />
      )}
      {dlg?.tipo === "revogar" && (
        <DialogoTexto
          open
          onClose={() => setDlg(null)}
          titulo="Revogar certificado desta emissão"
          hint="A revogação vale apenas para esta emissão e mantém o vínculo com o caso original. Renovação cria um caso novo relacionado."
          rotulo="Motivo da revogação (obrigatório)"
          obrigatorio
          acao={(t) => {
            store.revogarEmissao(dlg.emissaoId, t);
            toast.success("Revogação registrada");
          }}
        />
      )}
      {dlg?.tipo === "instalacao" && (
        <DialogoTexto
          open
          onClose={() => setDlg(null)}
          titulo="Confirmar instalação e funcionamento"
          hint="Registre o teste feito com o titular (assinatura de teste, acesso ao portal, leitura do token)."
          rotulo="Evidência do teste (obrigatório)"
          obrigatorio
          acao={(t) => {
            store.confirmarInstalacao(dlg.emissaoId, t);
            toast.success("Instalação confirmada");
          }}
        />
      )}
    </Panel>
  );
}

function AcaoEmissao({
  label,
  permissao,
  onClick,
}: {
  label: string;
  permissao: { permitido: boolean; motivo?: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!permissao.permitido}
      title={permissao.motivo ?? label}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {permissao.permitido ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <AlertTriangle className="size-3" />
      )}
      {label}
    </button>
  );
}
