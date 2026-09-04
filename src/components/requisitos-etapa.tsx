// Requisitos da etapa com gate de evidência: nenhum item é concluído sem a
// ação correspondente (anexo, pagamento, parecer, agendamento...).
// Usado tanto no painel do caso na Operação quanto no Workspace da solicitação,
// lendo e escrevendo no mesmo estado global.
import { CheckCircle2, ClipboardList, Lock, Paperclip, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Btn, Field, Modal, TextArea, TextInput } from "@/components/forms";
import type { ChecklistItem, Request } from "@/lib/mock-data";
import { regraDoRequisito, resumoEvidencia, type CampoEvidencia } from "@/lib/requisitos";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Valores = Partial<Record<CampoEvidencia["id"], string>>;

function CampoInput({
  campo,
  valor,
  onChange,
}: {
  campo: CampoEvidencia;
  valor: string;
  onChange: (v: string) => void;
}) {
  if (campo.tipo === "arquivo") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary hover:bg-primary-soft/40 focus-within:ring-2 focus-within:ring-primary">
          <Paperclip className="size-3.5" /> Escolher arquivo
          <input
            type="file"
            className="sr-only"
            onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
          />
        </label>
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {valor || "Nenhum arquivo selecionado"}
        </span>
      </div>
    );
  }
  if (campo.tipo === "textarea") {
    return <TextArea rows={3} value={valor} onChange={(e) => onChange(e.target.value)} />;
  }
  if (campo.tipo === "data") {
    return <TextInput type="datetime-local" value={valor} onChange={(e) => onChange(e.target.value)} />;
  }
  if (campo.tipo === "moeda") {
    return (
      <TextInput
        inputMode="decimal"
        placeholder="0,00"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return <TextInput value={valor} onChange={(e) => onChange(e.target.value)} />;
}

function faltando(campo: CampoEvidencia, valor: string) {
  if (!campo.obrigatorio) return null;
  const v = valor.trim();
  if (!v) return campo.tipo === "arquivo" ? "Anexe o arquivo para concluir." : "Campo obrigatório.";
  if (campo.tipo === "textarea" && v.length < 20) return "Descreva com pelo menos 20 caracteres.";
  return null;
}

function DialogoEvidencia({
  r,
  item,
  onClose,
}: {
  r: Request;
  item: ChecklistItem;
  onClose: () => void;
}) {
  const store = useStore();
  const regra = regraDoRequisito(item);
  const [valores, setValores] = useState<Valores>({});
  const [tentou, setTentou] = useState(false);

  const erros = useMemo(
    () =>
      Object.fromEntries(
        regra.campos.map((c) => [c.id, faltando(c, valores[c.id] ?? "")]),
      ) as Record<string, string | null>,
    [regra, valores],
  );
  const valido = regra.campos.every((c) => !erros[c.id]);

  const confirmar = () => {
    setTentou(true);
    if (!valido) return;
    store.cumprirRequisito(r.id, item.id, {
      tipo: regra.tipo,
      ...(valores.referencia ? { referencia: valores.referencia.trim() } : {}),
      ...(valores.arquivo ? { arquivo: valores.arquivo } : {}),
      ...(valores.valor ? { valor: valores.valor.trim() } : {}),
      ...(valores.quando ? { quando: valores.quando } : {}),
      ...(valores.observacao ? { observacao: valores.observacao.trim() } : {}),
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={regra.titulo}
      hint={`${item.label} · ${r.protocolo}`}
      width="max-w-lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={confirmar}>Concluir requisito</Btn>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">{regra.exigencia}</p>
        </div>
        {regra.campos.map((c) => {
          const erro = tentou ? erros[c.id] : null;
          return (
            <Field
              key={c.id}
              label={c.obrigatorio ? c.label : `${c.label} · opcional`}
              {...(c.hint ? { hint: c.hint } : {})}
              {...(erro ? { error: erro } : {})}
            >
              <CampoInput
                campo={c}
                valor={valores[c.id] ?? ""}
                onChange={(v) => setValores((s) => ({ ...s, [c.id]: v }))}
              />
            </Field>
          );
        })}
        {!valido && tentou && (
          <p className="text-xs text-alert">
            Faltam informações obrigatórias — o requisito continua pendente até que a ação seja registrada.
          </p>
        )}
      </div>
    </Modal>
  );
}

function DialogoReabrir({
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
  return (
    <Modal
      open
      onClose={onClose}
      title="Reabrir requisito"
      hint={`${item.label} — a evidência registrada será descartada.`}
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
      <Field label="Motivo" hint="Fica registrado na trilha de auditoria.">
        <TextArea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Field>
    </Modal>
  );
}

export function RequisitosEtapa({ r, compacto = false }: { r: Request; compacto?: boolean }) {
  const [cumprindo, setCumprindo] = useState<ChecklistItem | null>(null);
  const [reabrindo, setReabrindo] = useState<ChecklistItem | null>(null);

  const feitos = r.checklist.filter((c) => c.done).length;
  const total = r.checklist.length;
  const pct = total ? Math.round((feitos / total) * 100) : 100;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <ClipboardList className="size-3.5" /> Requisitos da etapa
        </p>
        <span className="tabular text-[11px] text-muted-foreground">
          {feitos}/{total} com evidência · {pct}%
        </span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      {total === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum requisito pendente nesta etapa.</p>
      ) : (
        <ul className="space-y-1.5">
          {r.checklist.map((c) => {
            const regra = regraDoRequisito(c);
            const resumo = resumoEvidencia(c);
            return (
              <li
                key={c.id}
                className={cn(
                  "rounded-md border border-border px-2.5 py-2",
                  c.done && "border-primary/40 bg-primary-soft/30",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-medium">
                      {c.done ? (
                        <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                      ) : (
                        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className={cn(c.done && "text-muted-foreground")}>{c.label}</span>
                    </p>
                    {c.done ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {c.evidencia
                          ? `${resumo} · ${c.evidencia.por} · ${c.evidencia.registradoEm}`
                          : "Concluído antes do controle de evidências."}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {compacto ? regra.acao : regra.exigencia}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {c.done ? (
                      <button
                        onClick={() => setReabrindo(c)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        <RotateCcw className="size-3" /> Reabrir
                      </button>
                    ) : (
                      <button
                        onClick={() => setCumprindo(c)}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        {regra.acao}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {cumprindo && <DialogoEvidencia r={r} item={cumprindo} onClose={() => setCumprindo(null)} />}
      {reabrindo && <DialogoReabrir r={r} item={reabrindo} onClose={() => setReabrindo(null)} />}
    </div>
  );
}
