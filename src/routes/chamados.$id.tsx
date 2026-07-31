import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bot, Paperclip, Send, User2 } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Panel, SlaBadge } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import {
  agentById,
  agents,
  ticketStatuses,
  tickets,
  type TicketMessage,
  type TicketStatus,
} from "@/lib/mock-data";
import { prioridadeTone, statusTone } from "./chamados.index";

export const Route = createFileRoute("/chamados/$id")({
  loader: ({ params }) => {
    const ticket = tickets.find((t) => t.id === params.id);
    if (!ticket) throw notFound();
    return { ticket };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Chamado não encontrado — Certus AC" }, { name: "robots", content: "noindex" }] };
    }
    const t = loaderData.ticket;
    return {
      meta: [
        { title: `${t.numero} · ${t.assunto} — Certus AC` },
        { name: "description", content: `Chamado ${t.numero} de ${t.cliente}: ${t.categoria} / ${t.subcategoria}.` },
        { property: "og:title", content: `${t.numero} — ${t.assunto}` },
        { property: "og:description", content: `Helpdesk Certus AC · ${t.cliente}` },
      ],
    };
  },
  component: ChamadoDetalhe,
  notFoundComponent: ChamadoNaoEncontrado,
});

function ChamadoNaoEncontrado() {
  return (
    <AppShell title="Chamado não encontrado" subtitle="O número informado não existe na base">
      <Link to="/chamados" className="text-sm text-primary hover:underline">
        Voltar para a fila
      </Link>
    </AppShell>
  );
}

function ChamadoDetalhe() {
  const { ticket } = Route.useLoaderData();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [responsavel, setResponsavel] = useState(ticket.responsavelId);
  const [mensagens, setMensagens] = useState<TicketMessage[]>(ticket.mensagens);
  const [texto, setTexto] = useState("");
  const [interna, setInterna] = useState(false);

  function enviar() {
    if (!texto.trim()) return;
    setMensagens((m) => [
      ...m,
      {
        id: `novo-${m.length}`,
        autor: interna ? "Nota interna · Marina Duarte" : "Marina Duarte",
        papel: interna ? "sistema" : "suporte",
        quando: "agora",
        texto: texto.trim(),
      },
    ]);
    setTexto("");
  }

  return (
    <AppShell
      title={`${ticket.numero} · ${ticket.assunto}`}
      subtitle={`${ticket.cliente} · ${ticket.canal} · aberto em ${ticket.abertoEm}`}
      actions={
        <Link
          to="/chamados"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary"
        >
          <ArrowLeft className="size-3.5" /> Fila
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Conversa com o cliente" bodyClassName="p-0">
          <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
            {mensagens.map((m) => {
              const cliente = m.papel === "cliente";
              const sistema = m.papel === "sistema";
              return (
                <div key={m.id} className={cn("flex", cliente ? "justify-start" : "justify-end")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                      sistema
                        ? "w-full bg-muted text-center text-xs text-muted-foreground"
                        : cliente
                          ? "border border-border bg-card"
                          : "bg-primary text-primary-foreground",
                    )}
                  >
                    {!sistema && (
                      <p
                        className={cn(
                          "mb-0.5 flex items-center gap-1 text-[11px] font-medium",
                          cliente ? "text-muted-foreground" : "opacity-80",
                        )}
                      >
                        {cliente ? <User2 className="size-3" /> : <Bot className="size-3" />}
                        {m.autor}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-snug">{m.texto}</p>
                    {m.anexo && (
                      <span
                        className={cn(
                          "mt-1.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]",
                          cliente ? "border-border text-muted-foreground" : "border-primary-foreground/40",
                        )}
                      >
                        <Paperclip className="size-3" /> {m.anexo.nome}
                      </span>
                    )}
                    {!sistema && (
                      <p className={cn("mt-1 text-[10px] tabular", cliente ? "text-muted-foreground" : "opacity-70")}>
                        {m.quando}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex items-center gap-2 text-xs">
              <button
                onClick={() => setInterna(false)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  !interna ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
                )}
              >
                Resposta ao cliente
              </button>
              <button
                onClick={() => setInterna(true)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  interna ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
                )}
              >
                Nota interna
              </button>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar();
                  }
                }}
                rows={2}
                placeholder={interna ? "Nota visível apenas para a equipe" : "Escreva a resposta ao cliente"}
                className="min-h-[56px] flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={enviar}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Send className="size-4" /> Enviar
              </button>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Atendimento">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">SLA</span>
                <SlaBadge horas={ticket.slaRestanteHoras} />
              </div>
              <label className="block">
                <span className="text-xs text-muted-foreground">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm capitalize outline-none focus:border-primary"
                >
                  {ticketStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Responsável</span>
                <select
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm outline-none focus:border-primary"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-[11px] text-muted-foreground">
                Atualmente com {agentById(responsavel).nome} · {agentById(responsavel).papel}
              </p>
            </div>
          </Panel>

          <Panel title="Classificação">
            <div className="flex flex-wrap gap-1.5">
              <Chip tone="blue">{ticket.categoria}</Chip>
              <Chip tone="outline">{ticket.subcategoria}</Chip>
              <Chip tone={statusTone(status)}>{status}</Chip>
              <Chip tone={prioridadeTone(ticket.prioridade)}>prioridade {ticket.prioridade}</Chip>
              {ticket.tags.map((t: string) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </Panel>

          <Panel title="Cliente">
            <div className="space-y-1.5 text-sm">
              <Link to="/clientes/$id" params={{ id: ticket.clienteId }} className="text-primary hover:underline">
                {ticket.cliente}
              </Link>
              <p className="text-xs text-muted-foreground">{ticket.contato}</p>
              <p className="text-xs text-muted-foreground">
                Última atualização: <span className="tabular">{ticket.atualizadoEm}</span>
              </p>
              {ticket.satisfacao && (
                <p className="text-xs text-muted-foreground">Satisfação: {"★".repeat(ticket.satisfacao)}</p>
              )}
              <Link to="/chat" className="inline-block pt-1 text-xs text-primary hover:underline">
                Abrir conversa no chat
              </Link>
            </div>
          </Panel>

          <Panel title="Outros chamados do cliente">
            <ul className="space-y-1.5 text-sm">
              {tickets
                .filter((t) => t.clienteId === ticket.clienteId && t.id !== ticket.id)
                .map((t) => (
                  <li key={t.id}>
                    <Link to="/chamados/$id" params={{ id: t.id }} className="text-primary hover:underline">
                      {t.numero}
                    </Link>{" "}
                    <span className="text-xs text-muted-foreground">{t.assunto}</span>
                  </li>
                ))}
              {tickets.filter((t) => t.clienteId === ticket.clienteId && t.id !== ticket.id).length === 0 && (
                <li className="text-xs text-muted-foreground">Nenhum outro chamado.</li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
