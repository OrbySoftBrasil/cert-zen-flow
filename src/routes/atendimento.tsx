import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Hand, SendHorizonal, Sparkles, Ticket } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Panel } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { conversations as seed, type Conversation } from "@/lib/mock-data";

export const Route = createFileRoute("/atendimento")({
  head: () => ({
    meta: [
      { title: "Central de atendimento com IA — Certus AC" },
      {
        name: "description",
        content:
          "Fila de conversas com resumo automático, intenção detectada, sugestões de resposta e transferência do bot para o humano.",
      },
      { property: "og:title", content: "Central de atendimento com IA — Certus AC" },
      { property: "og:description", content: "Resumo automático, intenção e assumir atendimento em um clique." },
    ],
  }),
  component: Atendimento,
});

const statusTone = { bot: "outline", fila: "alert", humano: "blue", resolvido: "neutral" } as const;

function Atendimento() {
  const [convs, setConvs] = useState<Conversation[]>(seed);
  const [ativoId, setAtivoId] = useState(seed[0]!.id);
  const [rascunho, setRascunho] = useState("");
  const ativo = convs.find((c) => c.id === ativoId)!;

  function enviar(texto: string) {
    if (!texto.trim()) return;
    setConvs((prev) =>
      prev.map((c) =>
        c.id === ativoId
          ? {
              ...c,
              status: "humano",
              mensagens: [
                ...c.mensagens,
                { id: `m${c.mensagens.length + 90}`, de: "agente", autor: "Marina Duarte", quando: "agora", texto },
              ],
            }
          : c,
      ),
    );
    setRascunho("");
  }

  return (
    <AppShell
      title="Central de atendimento"
      subtitle={`${convs.filter((c) => c.status === "fila").length} na fila · assistente ativo em ${convs.filter((c) => c.status === "bot").length} conversas`}
    >
      <div className="grid gap-4 lg:grid-cols-[280px_1fr_300px]">
        <Panel bodyClassName="p-0" title="Conversas">
          <ul className="divide-y divide-border">
            {convs.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setAtivoId(c.id)}
                  className={cn(
                    "w-full px-3 py-3 text-left transition-colors hover:bg-muted/60",
                    c.id === ativoId && "bg-primary-soft/50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{c.cliente}</p>
                    <Chip tone={statusTone[c.status]}>{c.status}</Chip>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.canal} · {c.intencao}
                  </p>
                  {c.aguardandoMin > 0 && (
                    <p className="mt-1 tabular text-[11px] text-alert">aguardando {c.aguardandoMin} min</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel bodyClassName="flex h-[560px] flex-col p-0" title={ativo.cliente} hint={`${ativo.canal} · ${ativo.intencao}`}>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {ativo.mensagens.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.de === "cliente" ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[76%] rounded-lg px-3 py-2 text-sm",
                    m.de === "cliente"
                      ? "bg-muted"
                      : m.de === "bot"
                        ? "border border-dashed border-primary/40 bg-primary-soft/50 text-primary-deep"
                        : "bg-primary text-primary-foreground",
                  )}
                >
                  <p className="mb-0.5 text-[11px] opacity-70">
                    {m.autor} · {m.quando}
                  </p>
                  {m.texto}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3">
            {ativo.status !== "humano" && ativo.status !== "resolvido" && (
              <button
                onClick={() =>
                  setConvs((prev) =>
                    prev.map((c) => (c.id === ativoId ? { ...c, status: "humano", aguardandoMin: 0 } : c)),
                  )
                }
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
              >
                <Hand className="size-4" /> Assumir atendimento (pausa o assistente)
              </button>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                rows={2}
                placeholder="Escreva uma resposta..."
                className="flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => enviar(rascunho)}
                className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-deep"
              >
                <SendHorizonal className="size-4" />
              </button>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Copiloto"
            hint="Resumo gerado automaticamente"
            actions={<Sparkles className="size-4 text-primary" />}
          >
            <p className="text-sm text-muted-foreground">{ativo.resumo}</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Intenção</span>
                <Chip tone="blue">{ativo.intencao}</Chip>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Sentimento</span>
                <Chip tone={ativo.sentimento === "frustrado" ? "alert" : "neutral"}>{ativo.sentimento}</Chip>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Canal</span>
                <Chip tone="outline">{ativo.canal}</Chip>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-dashed border-primary/40 bg-primary-soft/40 p-2.5">
              <p className="text-[11px] uppercase tracking-wide text-primary-deep">Próxima ação sugerida</p>
              <p className="mt-0.5 text-sm">{ativo.proximaAcao}</p>
            </div>
          </Panel>

          <Panel title="Respostas sugeridas">
            <div className="space-y-1.5">
              {ativo.sugestoes.map((s) => (
                <button
                  key={s}
                  onClick={() => setRascunho(s)}
                  className="w-full rounded-md border border-border px-2.5 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary-soft/40"
                >
                  {s}
                </button>
              ))}
              {ativo.sugestoes.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem sugestões para esta conversa.</p>
              )}
            </div>
          </Panel>

          <Panel title="Ações">
            <div className="grid gap-1.5">
              <Link
                to="/clientes/$id"
                params={{ id: ativo.clienteId }}
                className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm transition-colors hover:border-primary"
              >
                <Bot className="size-4 text-primary" /> Abrir dossiê do cliente
              </Link>
              <Link
                to="/operacao"
                className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm transition-colors hover:border-primary"
              >
                <Ticket className="size-4 text-primary" /> Converter em solicitação
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
