import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Building2,
  Handshake,
  FileText,
  MessageSquare,
  Receipt,
  ScrollText,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Bar, Chip, Panel } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { contadorDoCliente } from "@/lib/contadores-data";
import { brl, clientById as seedClientById, conversations } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import {
  NovaSolicitacaoButton,
  NovoAgendamentoButton,
  NovoChamadoButton,
} from "@/components/dialogs";
import { Btn, ConfirmDialog, EmptyState, Field, TextArea } from "@/components/forms";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes/$id")({
  loader: ({ params }) => {
    const cliente = seedClientById(params.id);
    if (!cliente) throw notFound();
    return { nome: cliente.nome };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.nome} — Dossiê do cliente` : "Cliente não encontrado" },
      {
        name: "description",
        content:
          "Dossiê 360º do cliente: certificados, documentos, solicitações, conversas, financeiro e trilha de auditoria.",
      },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.nome} — Dossiê 360º` : "Cliente",
      },
      {
        property: "og:description",
        content: "Certificados, documentos, financeiro e histórico em uma visão.",
      },
    ],
  }),
  component: Dossie,
});

const abas = [
  { id: "certificados", label: "Certificados", icon: ShieldCheck },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "solicitacoes", label: "Solicitações", icon: ScrollText },
  { id: "conversas", label: "Conversas", icon: MessageSquare },
  { id: "financeiro", label: "Financeiro", icon: Receipt },
] as const;

const statusTone = {
  ativo: "blue",
  "a vencer": "alert",
  revogado: "neutral",
  expirado: "outline",
  aprovado: "blue",
  "em análise": "neutral",
  reprovado: "alert",
  pago: "blue",
  aberto: "neutral",
  vencido: "alert",
} as const;

function Dossie() {
  const { id } = Route.useParams();
  const { clients, requests, setDocumentStatus, revokeCertificate, addClientNote } = useStore();
  const cliente = clients.find((c) => c.id === id) ?? seedClientById(id)!;
  const [aba, setAba] = useState<(typeof abas)[number]["id"]>("certificados");
  const [nota, setNota] = useState("");
  const [reprovando, setReprovando] = useState<{ docId: string; nome: string } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [revogando, setRevogando] = useState<{ certId: string; serie: string } | null>(null);
  const [motivoRevog, setMotivoRevog] = useState("");
  const solicitacoes = requests.filter((r) => r.clienteId === id);
  const conversas = conversations.filter((c) => c.clienteId === id);
  const contador = contadorDoCliente(id);

  return (
    <AppShell
      title={cliente.nome}
      subtitle={`${cliente.documento} · cliente desde ${cliente.desde}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <NovaSolicitacaoButton clienteId={cliente.id} />
          <NovoAgendamentoButton />
          <NovoChamadoButton clienteId={cliente.id} />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="grid size-12 place-items-center rounded-md bg-primary-soft text-primary-deep">
              {cliente.tipoPessoa === "PJ" ? (
                <Building2 className="size-5" />
              ) : (
                <User className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold">{cliente.nome}</p>
              <p className="text-xs text-muted-foreground">
                {cliente.email} · {cliente.telefone} · {cliente.cidade}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Handshake className="size-3" />
                {contador ? (
                  <>
                    Indicado por{" "}
                    <Link
                      to="/contadores/$id"
                      params={{ id: contador.id }}
                      className="text-primary hover:underline"
                    >
                      {contador.nome}
                    </Link>
                    <Chip tone="outline">{contador.tier}</Chip>
                  </>
                ) : (
                  <>Cliente direto (sem contador parceiro)</>
                )}
              </p>
            </div>
            <div className="ml-auto flex gap-6 text-right">
              <div>
                <p className="text-[11px] uppercase text-muted-foreground">LTV</p>
                <p className="tabular font-display text-lg font-semibold">{brl(cliente.ltv)}</p>
              </div>
              <div className="w-32">
                <p className="text-[11px] uppercase text-muted-foreground">Saúde</p>
                <p className="tabular font-display text-lg font-semibold">{cliente.saude}</p>
                <Bar value={cliente.saude} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border">
            {abas.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                  aba === a.id
                    ? "border-primary font-medium text-primary-deep"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <a.icon className="size-4" /> {a.label}
              </button>
            ))}
          </div>

          {aba === "certificados" && (
            <Panel bodyClassName="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Série</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium">Emissão</th>
                      <th className="px-4 py-2 font-medium">Validade</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cliente.certificados.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2.5 tabular">{c.serie}</td>
                        <td className="px-4 py-2.5">{c.tipo}</td>
                        <td className="px-4 py-2.5 tabular text-muted-foreground">{c.emitidoEm}</td>
                        <td className="px-4 py-2.5 tabular text-muted-foreground">{c.validoAte}</td>
                        <td className="px-4 py-2.5">
                          <Chip tone={statusTone[c.status]}>{c.status}</Chip>
                        </td>
                        <td className="px-4 py-2.5">
                          {c.status === "revogado" ? (
                            <span className="text-xs text-muted-foreground">revogado</span>
                          ) : (
                            <button
                              onClick={() => {
                                setRevogando({ certId: c.id, serie: c.serie });
                                setMotivoRevog("");
                              }}
                              className="rounded-md border border-border px-2.5 py-1 text-xs text-alert transition-colors hover:border-alert"
                            >
                              Revogar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {cliente.certificados.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          Nenhum certificado emitido para este titular.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {aba === "documentos" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {cliente.documentos.map((d) => (
                <Panel key={d.id} bodyClassName="p-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-16 w-12 shrink-0 place-items-center rounded border border-border bg-muted text-muted-foreground">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.tipo} · enviado em {d.enviadoEm}
                      </p>
                      <div className="mt-1.5">
                        <Chip tone={statusTone[d.status]}>{d.status}</Chip>
                      </div>
                      {d.motivo && <p className="mt-1 text-xs text-alert">{d.motivo}</p>}
                      {d.status !== "aprovado" && (
                        <div className="mt-2 flex gap-1.5">
                          <button
                            onClick={() => {
                              setDocumentStatus(cliente.id, d.id, "aprovado");
                              toast.success("Documento aprovado", { description: d.nome });
                            }}
                            className="rounded border border-border px-2 py-1 text-[11px] transition-colors hover:border-primary"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => {
                              setReprovando({ docId: d.id, nome: d.nome });
                              setMotivo("");
                            }}
                            className="rounded border border-border px-2 py-1 text-[11px] text-alert transition-colors hover:border-alert"
                          >
                            Reprovar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              ))}
              {cliente.documentos.length === 0 && (
                <div className="sm:col-span-2">
                  <EmptyState
                    titulo="Nenhum documento enviado"
                    descricao="Os documentos aparecem aqui quando o titular envia pelo portal ou pelo parceiro contábil."
                  />
                </div>
              )}
            </div>
          )}

          {aba === "solicitacoes" && (
            <Panel bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {solicitacoes.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/solicitacoes/$id"
                        params={{ id: r.id }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {r.protocolo}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {r.tipo} · {r.canal} · aberto em {r.abertoEm}
                      </p>
                    </div>
                    <Chip tone="blue">{r.stage}</Chip>
                    <span className="tabular text-sm">{brl(r.valor)}</span>
                  </li>
                ))}
                {solicitacoes.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Sem solicitações
                  </li>
                )}
              </ul>
            </Panel>
          )}

          {aba === "conversas" && (
            <div className="space-y-3">
              {conversas.map((c) => (
                <Panel key={c.id} bodyClassName="p-4">
                  <div className="flex items-center gap-2">
                    <Chip tone="blue">{c.canal}</Chip>
                    <Chip tone="outline">{c.intencao}</Chip>
                    <Link to="/chat" className="ml-auto text-xs text-primary hover:underline">
                      Abrir na central
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.resumo}</p>
                </Panel>
              ))}
              {conversas.length === 0 && (
                <Panel>
                  <p className="text-center text-sm text-muted-foreground">
                    Sem conversas registradas
                  </p>
                </Panel>
              )}
            </div>
          )}

          {aba === "financeiro" && (
            <Panel bodyClassName="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Descrição</th>
                      <th className="px-4 py-2 font-medium">Vencimento</th>
                      <th className="px-4 py-2 font-medium">Método</th>
                      <th className="px-4 py-2 font-medium">Valor</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cliente.faturas.map((f) => (
                      <tr key={f.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2.5">{f.descricao}</td>
                        <td className="px-4 py-2.5 tabular text-muted-foreground">
                          {f.vencimento}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{f.metodo}</td>
                        <td className="px-4 py-2.5 tabular">{brl(f.valor)}</td>
                        <td className="px-4 py-2.5">
                          <Chip tone={statusTone[f.status]}>{f.status}</Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-4">
          <Panel title="Resumo da conta">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Gestor</dt>
                <dd>{cliente.gestor}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd>{cliente.tipoPessoa}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Certificados</dt>
                <dd className="tabular">{cliente.certificados.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Faturas em aberto</dt>
                <dd className="tabular">
                  {cliente.faturas.filter((f) => f.status !== "pago").length}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Notas internas">
            <ul className="space-y-3">
              {cliente.notas.map((n) => (
                <li key={n.id} className="border-l-2 border-primary-soft pl-3">
                  <p className="text-sm">{n.texto}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {n.autor} · {n.quando}
                  </p>
                </li>
              ))}
              {cliente.notas.length === 0 && (
                <li className="text-sm text-muted-foreground">Sem notas.</li>
              )}
            </ul>
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <Field label="Nova nota interna">
                <TextArea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Registre um contexto relevante para a equipe"
                />
              </Field>
              <Btn
                className="w-full"
                disabled={!nota.trim()}
                onClick={() => {
                  addClientNote(cliente.id, nota.trim());
                  setNota("");
                  toast.success("Nota registrada no dossiê");
                }}
              >
                Adicionar nota
              </Btn>
            </div>
          </Panel>
        </aside>
      </div>
      <ConfirmDialog
        open={!!reprovando}
        title="Reprovar documento"
        {...(reprovando ? { descricao: reprovando.nome } : {})}
        confirmLabel="Reprovar"
        destructive
        onCancel={() => setReprovando(null)}
        onConfirm={() => {
          if (!reprovando || !motivo.trim()) {
            toast.error("Informe o motivo da reprovação.");
            return;
          }
          setDocumentStatus(cliente.id, reprovando.docId, "reprovado", motivo.trim());
          toast.success("Documento reprovado", {
            description: "O titular será notificado para reenvio.",
          });
          setReprovando(null);
        }}
      >
        <Field label="Motivo da reprovação">
          <TextArea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: imagem ilegível"
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!revogando}
        title="Revogar certificado"
        {...(revogando ? { descricao: `Série ${revogando.serie} — ação irreversível` } : {})}
        confirmLabel="Revogar certificado"
        destructive
        onCancel={() => setRevogando(null)}
        onConfirm={() => {
          if (!revogando || !motivoRevog.trim()) {
            toast.error("Informe o motivo da revogação.");
            return;
          }
          revokeCertificate(cliente.id, revogando.certId, motivoRevog.trim());
          toast.success("Certificado revogado", {
            description: "Publicado na LCR e registrado na auditoria.",
          });
          setRevogando(null);
        }}
      >
        <Field label="Motivo da revogação">
          <TextArea
            value={motivoRevog}
            onChange={(e) => setMotivoRevog(e.target.value)}
            placeholder="Ex.: comprometimento de chave privada"
          />
        </Field>
      </ConfirmDialog>
    </AppShell>
  );
}
