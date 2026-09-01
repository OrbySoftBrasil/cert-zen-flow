import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileCheck2,
  Lock,
  MessageSquarePlus,
  Signature,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { NovoAgendamentoDialog } from "@/components/dialogs";
import { Btn, ConfirmDialog, Field, SelectInput, TextArea } from "@/components/forms";
import { Chip, Panel, SlaBadge } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { agentById, agents, brl, requestById, stages, type StageId } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/solicitacoes/$id")({
  loader: ({ params }) => {
    const r = requestById(params.id);
    return { protocolo: r?.protocolo ?? "Solicitação", cliente: r?.cliente ?? "" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.protocolo} — Solicitação` : "Solicitação" },
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

const ordem: StageId[] = ["novo", "documentacao", "validacao", "agendamento", "videoconferencia", "emissao", "concluido"];

function Solicitacao() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const store = useStore();
  const solicitacao = store.requests.find((r) => r.id === id);
  const cliente = store.clients.find((c) => c.id === solicitacao?.clienteId);

  const [confirmar, setConfirmar] = useState<null | "emitir" | "revogar" | "bloquear">(null);
  const [motivo, setMotivo] = useState("");
  const [docId, setDocId] = useState("");
  const [reprovando, setReprovando] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [nota, setNota] = useState("");

  if (!solicitacao) {
    return (
      <AppShell title="Solicitação não encontrada" subtitle="O protocolo pode ter sido removido do protótipo">
        <Panel>
          <p className="text-sm text-muted-foreground">
            Não localizamos esta solicitação.{" "}
            <Link to="/solicitacoes" className="text-primary hover:underline">
              Ver todas as solicitações
            </Link>
            .
          </p>
        </Panel>
      </AppShell>
    );
  }

  const checklist = solicitacao.checklist;
  const feitos = checklist.filter((c) => c.done).length;
  const pendentes = checklist.length - feitos;
  const idx = ordem.indexOf(solicitacao.stage);
  const proxima = idx >= 0 && idx < ordem.length - 1 ? ordem[idx + 1] : undefined;
  const anterior = idx > 0 ? ordem[idx - 1] : undefined;
  const certificadoAtivo = cliente?.certificados.find((c) => c.status === "ativo" || c.status === "a vencer");
  const docsEmAnalise = cliente?.documentos.filter((d) => d.status === "em análise") ?? [];

  function avancar() {
    if (!proxima) return;
    if (pendentes > 0) {
      toast.error("Checklist pendente", { description: `${pendentes} item(ns) precisam ser concluídos antes de avançar.` });
      return;
    }
    store.moveRequest(solicitacao!.id, proxima);
    toast.success(`Etapa avançada para ${stages.find((s) => s.id === proxima)?.nome}`);
  }

  function aprovarDocumentos() {
    if (!cliente) return;
    if (docsEmAnalise.length === 0) {
      toast.info("Nenhum documento em análise para este titular.");
      return;
    }
    docsEmAnalise.forEach((d) => store.setDocumentStatus(cliente.id, d.id, "aprovado"));
    store.logRequest(solicitacao!.id, `Documentos aprovados (${docsEmAnalise.length})`, "Análise documental concluída");
    toast.success(`${docsEmAnalise.length} documento(s) aprovado(s)`);
  }

  function reprovarDocumento() {
    if (!cliente || !docId || motivo.trim().length < 4) {
      toast.error("Selecione o documento e descreva o motivo.");
      return;
    }
    store.setDocumentStatus(cliente.id, docId, "reprovado", motivo);
    store.moveRequest(solicitacao!.id, "documentacao", `Documento reprovado: ${motivo}`);
    store.logRequest(solicitacao!.id, "Documento reprovado", motivo, "alerta");
    setReprovando(false);
    setMotivo("");
    setDocId("");
    toast.warning("Documento reprovado", { description: "Solicitação retornou para Documentação." });
  }

  function escalar() {
    store.updateRequest(solicitacao!.id, { responsavelId: "a5", prioridade: "critica" });
    store.logRequest(solicitacao!.id, "Escalado para compliance", "Responsável: Helena Prado", "alerta");
    toast.success("Escalado para compliance");
  }

  function emitir() {
    const cert = store.issueCertificate(solicitacao!.id);
    setConfirmar(null);
    if (cert) toast.success("Certificado emitido", { description: `Série ${cert.serie} · válido até ${cert.validoAte}` });
  }

  function revogar() {
    if (!cliente || !certificadoAtivo) return;
    store.revokeCertificate(cliente.id, certificadoAtivo.id, motivo || "Solicitação do titular");
    store.logRequest(solicitacao!.id, "Certificado revogado", motivo || "Solicitação do titular", "alerta");
    setConfirmar(null);
    setMotivo("");
    toast.warning("Certificado revogado", { description: `Série ${certificadoAtivo.serie}` });
  }

  return (
    <AppShell
      title={`${solicitacao.protocolo} · ${solicitacao.tipo}`}
      subtitle={`${solicitacao.cliente} · aberto em ${solicitacao.abertoEm}`}
      actions={
        <>
          <Link
            to="/solicitacoes"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Todas as solicitações
          </Link>
          {anterior && (
            <Btn variant="ghost" onClick={() => store.moveRequest(solicitacao.id, anterior)}>
              Retornar etapa
            </Btn>
          )}
          {proxima && (
            <Btn onClick={avancar} disabled={pendentes > 0} title={pendentes > 0 ? "Conclua o checklist" : undefined}>
              {pendentes > 0 ? <Lock className="size-3.5" /> : <ArrowRight className="size-3.5" />}
              Avançar para {stages.find((s) => s.id === proxima)?.nome}
            </Btn>
          )}
        </>
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
                    <button
                      onClick={() => store.moveRequest(solicitacao.id, s.id, "Ajuste manual de etapa")}
                      className={cn(
                        "rounded px-2 py-1 text-xs transition-colors",
                        atual
                          ? "bg-primary font-medium text-primary-foreground"
                          : passou
                            ? "bg-primary-soft text-primary-deep hover:bg-primary-soft/70"
                            : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {s.nome}
                    </button>
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
                    onClick={() => store.toggleChecklist(solicitacao.id, c.id)}
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

          <Panel
            title="Timeline"
            hint="Registro auditável de todos os eventos"
            bodyClassName="p-0"
            actions={
              <div className="flex items-center gap-2">
                <input
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Registrar nota interna"
                  className="w-48 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                />
                <Btn
                  variant="ghost"
                  disabled={nota.trim().length < 3}
                  onClick={() => {
                    store.logRequest(solicitacao.id, "Nota interna", nota);
                    setNota("");
                    toast.success("Nota registrada na timeline");
                  }}
                >
                  <MessageSquarePlus className="size-3.5" /> Registrar
                </Btn>
              </div>
            }
          >
            <ol className="relative space-y-0">
              {solicitacao.timeline.map((e, i) => (
                <li key={e.id} className="flex gap-3 px-4 py-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1 size-2.5 rounded-full",
                        e.tipo === "alerta" ? "bg-alert" : e.tipo === "cliente" ? "bg-primary-soft" : "bg-primary",
                      )}
                    />
                    {i < solicitacao.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
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
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Responsável</dt>
                <dd>
                  <SelectInput
                    value={solicitacao.responsavelId}
                    onChange={(e) => {
                      store.updateRequest(solicitacao.id, { responsavelId: e.target.value });
                      store.logRequest(solicitacao.id, `Responsável alterado para ${agentById(e.target.value).nome}`);
                      toast.success("Responsável atualizado");
                    }}
                    className="w-40 px-1.5 py-1 text-xs"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </SelectInput>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Prioridade</dt>
                <dd>
                  <SelectInput
                    value={solicitacao.prioridade}
                    onChange={(e) => {
                      store.updateRequest(solicitacao.id, { prioridade: e.target.value as typeof solicitacao.prioridade });
                      toast.success("Prioridade atualizada");
                    }}
                    className="w-28 px-1.5 py-1 text-xs"
                  >
                    {["baixa", "normal", "alta", "critica"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </SelectInput>
                </dd>
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

          <Panel title="Ações da etapa" hint="Cada ação altera o estado e fica na trilha de auditoria">
            <div className="grid gap-1.5">
              <AcaoBtn icon={FileCheck2} onClick={aprovarDocumentos} label={`Aprovar documentos (${docsEmAnalise.length})`} />
              <AcaoBtn icon={AlertTriangle} onClick={() => setReprovando(true)} label="Reprovar documento" />
              <AcaoBtn icon={CalendarClock} onClick={() => setAgendando(true)} label="Agendar / reagendar videoconferência" />
              <AcaoBtn icon={UserCog} onClick={escalar} label="Escalar para compliance" />
              <AcaoBtn
                icon={Signature}
                onClick={() => setConfirmar("emitir")}
                label="Emitir certificado"
                disabled={solicitacao.stage === "concluido"}
              />
              <AcaoBtn
                icon={Ban}
                onClick={() => setConfirmar("revogar")}
                label="Revogar certificado"
                disabled={!certificadoAtivo}
              />
            </div>
          </Panel>

          {cliente && (
            <Panel title="Documentos do titular" bodyClassName="p-0">
              <ul className="divide-y divide-border text-sm">
                {cliente.documentos.length === 0 && (
                  <li className="px-4 py-3 text-xs text-muted-foreground">Nenhum documento enviado.</li>
                )}
                {cliente.documentos.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <span className="min-w-0 truncate">{d.nome}</span>
                    <Chip tone={d.status === "aprovado" ? "blue" : d.status === "reprovado" ? "alert" : "outline"}>
                      {d.status}
                    </Chip>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmar === "emitir"}
        title="Emitir certificado"
        descricao={`${solicitacao.tipo} para ${solicitacao.cliente}`}
        confirmLabel="Emitir agora"
        onCancel={() => setConfirmar(null)}
        onConfirm={emitir}
      >
        <p className="text-sm text-muted-foreground">
          A emissão gera a série, adiciona o certificado ao dossiê do titular e conclui a solicitação.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmar === "revogar"}
        title="Revogar certificado"
        {...(certificadoAtivo ? { descricao: `Série ${certificadoAtivo.serie} · ${certificadoAtivo.tipo}` } : {})}
        confirmLabel="Revogar"
        destructive
        onCancel={() => setConfirmar(null)}
        onConfirm={revogar}
      >
        <Field label="Motivo da revogação">
          <TextArea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Perda do token, comprometimento, solicitação do titular…" />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={reprovando}
        title="Reprovar documento"
        confirmLabel="Reprovar"
        destructive
        onCancel={() => setReprovando(false)}
        onConfirm={reprovarDocumento}
      >
        <div className="space-y-3">
          <Field label="Documento">
            <SelectInput value={docId} onChange={(e) => setDocId(e.target.value)}>
              <option value="">Selecione…</option>
              {cliente?.documentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Motivo da reprovação">
            <TextArea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </Field>
        </div>
      </ConfirmDialog>

      <NovoAgendamentoDialog
        open={agendando}
        onClose={() => setAgendando(false)}
        clienteId={solicitacao.clienteId}
        onCriado={() => {
          store.moveRequest(solicitacao.id, "agendamento", "Videoconferência agendada");
          navigate({ to: "/agenda" });
        }}
      />
    </AppShell>
  );
}

function AcaoBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof FileCheck2;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary-soft/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-transparent"
    >
      <Icon className="size-4 text-primary" /> {label}
    </button>
  );
}
