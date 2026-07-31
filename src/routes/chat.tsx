import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot,
  Check,
  CheckCheck,
  FileText,
  Hand,
  Info,
  Mail,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Search,
  SendHorizonal,
  Smile,
  Sparkles,
  Ticket,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Panel } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { conversations as seed, type Conversation } from "@/lib/mock-data";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — atendimento com IA | Certus AC" },
      {
        name: "description",
        content:
          "Central de chat multicanal da autoridade certificadora: fila, resumo automático, intenção detectada, sugestões de resposta e transferência do assistente para o humano.",
      },
      { property: "og:title", content: "Chat — atendimento com IA | Certus AC" },
      {
        property: "og:description",
        content: "Conversas multicanal com copiloto de IA, resumo automático e handoff em um clique.",
      },
    ],
  }),
  component: Chat,
});

const statusTone = { bot: "outline", fila: "alert", humano: "blue", resolvido: "neutral" } as const;
const statusLabel = { bot: "Assistente", fila: "Na fila", humano: "Humano", resolvido: "Resolvido" } as const;
const canalIcon: Record<string, typeof MessageCircle> = {
  WhatsApp: MessageCircle,
  Site: Bot,
  "E-mail": Mail,
  Telefone: Phone,
};

const filtros = [
  { id: "todas", label: "Todas" },
  { id: "fila", label: "Fila" },
  { id: "bot", label: "Assistente" },
  { id: "humano", label: "Minhas" },
  { id: "resolvido", label: "Resolvidas" },
] as const;

function iniciais(nome: string) {
  return nome
    .replace(/\b(LTDA|S\/A|ME|EIRELI)\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();
}

function Avatar({ nome, size = 40, canal }: { nome: string; size?: number; canal?: string }) {
  const Icon = canal ? (canalIcon[canal] ?? MessageCircle) : null;
  return (
    <div className="relative shrink-0">
      <div
        className="grid place-items-center rounded-full bg-primary-soft font-semibold text-primary-deep"
        style={{ width: size, height: size, fontSize: size / 3 }}
      >
        {iniciais(nome)}
      </div>
      {Icon && (
        <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-card bg-card text-primary">
          <Icon className="size-2.5" />
        </span>
      )}
    </div>
  );
}

function Chat() {
  const [convs, setConvs] = useState<Conversation[]>(seed);
  const [ativoId, setAtivoId] = useState(seed[0]!.id);
  const [rascunho, setRascunho] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof filtros)[number]["id"]>("todas");
  const [painel, setPainel] = useState(true);
  const fimRef = useRef<HTMLDivElement>(null);

  const ativo = convs.find((c) => c.id === ativoId)!;

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [ativoId, ativo.mensagens.length]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return convs
      .filter((c) => (filtro === "todas" ? true : c.status === filtro))
      .filter(
        (c) =>
          !termo ||
          c.cliente.toLowerCase().includes(termo) ||
          c.intencao.toLowerCase().includes(termo) ||
          (c.protocolo ?? "").toLowerCase().includes(termo),
      )
      .sort((a, b) => Number(!!b.fixada) - Number(!!a.fixada));
  }, [convs, filtro, busca]);

  function abrir(id: string) {
    setAtivoId(id);
    setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, naoLidas: 0 } : c)));
  }

  function enviar(texto: string) {
    if (!texto.trim()) return;
    setConvs((prev) =>
      prev.map((c) =>
        c.id === ativoId
          ? {
              ...c,
              status: c.status === "resolvido" ? c.status : "humano",
              aguardandoMin: 0,
              mensagens: [
                ...c.mensagens,
                {
                  id: `m${c.mensagens.length + 90}`,
                  de: "agente" as const,
                  autor: "Marina Duarte",
                  quando: "agora",
                  texto,
                  lida: false,
                },
              ],
            }
          : c,
      ),
    );
    setRascunho("");
  }

  const naFila = convs.filter((c) => c.status === "fila").length;
  const comBot = convs.filter((c) => c.status === "bot").length;
  const CanalIcon = canalIcon[ativo.canal] ?? MessageCircle;

  return (
    <AppShell
      title="Chat"
      subtitle={`${naFila} na fila · assistente ativo em ${comBot} conversas · tempo médio de 1ª resposta 42s`}
      actions={
        <button
          onClick={() => setPainel((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary"
        >
          <Sparkles className="size-3.5 text-primary" /> {painel ? "Ocultar copiloto" : "Mostrar copiloto"}
        </button>
      }
    >
      <div
        className={cn(
          "grid h-[calc(100vh-13rem)] min-h-[560px] gap-0 overflow-hidden rounded-lg border border-border bg-card",
          painel ? "lg:grid-cols-[320px_1fr_320px]" : "lg:grid-cols-[320px_1fr]",
        )}
      >
        {/* ---------- lista de conversas ---------- */}
        <aside className="flex min-h-0 flex-col border-r border-border">
          <div className="border-b border-border p-3">
            <div className="flex h-9 items-center gap-2 rounded-full bg-muted px-3">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar conversa ou protocolo"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {busca && (
                <button onClick={() => setBusca("")} className="text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="mt-2.5 flex gap-1 overflow-x-auto">
              {filtros.map((f) => {
                const total = f.id === "todas" ? convs.length : convs.filter((c) => c.status === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFiltro(f.id)}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs transition-colors",
                      filtro === f.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.label} {total > 0 && <span className="tabular opacity-80">{total}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {lista.map((c) => {
              const ultima = c.mensagens[c.mensagens.length - 1];
              const ativoItem = c.id === ativoId;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => abrir(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left transition-colors hover:bg-muted/60",
                      ativoItem && "bg-primary-soft/60",
                    )}
                  >
                    <Avatar nome={c.cliente} canal={c.canal} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium">{c.cliente}</p>
                        <span className="tabular shrink-0 text-[11px] text-muted-foreground">{ultima?.quando}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {ultima?.de !== "cliente" && (
                          <span className="shrink-0 text-primary">
                            {ultima?.lida ? <CheckCheck className="size-3.5" /> : <Check className="size-3.5" />}
                          </span>
                        )}
                        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{ultima?.texto}</p>
                        {c.naoLidas ? (
                          <span className="tabular grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                            {c.naoLidas}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1">
                        {c.fixada && <Pin className="size-3 text-muted-foreground" />}
                        <Chip tone={statusTone[c.status]}>{statusLabel[c.status]}</Chip>
                        {c.aguardandoMin > 0 && (
                          <span className="tabular text-[11px] text-alert">{c.aguardandoMin} min</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {lista.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">Nenhuma conversa neste filtro.</li>
            )}
          </ul>
        </aside>

        {/* ---------- conversa ---------- */}
        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="flex items-center gap-3 border-b border-border px-4 py-2.5">
            <Avatar nome={ativo.cliente} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{ativo.cliente}</p>
              <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                <CanalIcon className="size-3" /> {ativo.canal}
                {ativo.protocolo && <> · {ativo.protocolo}</>} · {ativo.intencao}
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <button title="Iniciar videochamada" className="grid size-8 place-items-center rounded-full hover:bg-muted hover:text-foreground">
                <Video className="size-4" />
              </button>
              <button title="Buscar na conversa" className="grid size-8 place-items-center rounded-full hover:bg-muted hover:text-foreground">
                <Search className="size-4" />
              </button>
              <button
                title="Copiloto"
                onClick={() => setPainel((v) => !v)}
                className="grid size-8 place-items-center rounded-full hover:bg-muted hover:text-foreground"
              >
                <Info className="size-4" />
              </button>
              <button className="grid size-8 place-items-center rounded-full hover:bg-muted hover:text-foreground">
                <MoreVertical className="size-4" />
              </button>
            </div>
          </header>

          <div
            className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4 sm:px-8"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 1px, transparent 1px), radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 12px 12px",
              color: "color-mix(in oklab, var(--color-primary) 8%, transparent)",
            }}
          >
            <div className="mb-3 flex justify-center">
              <span className="rounded-full bg-card px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm">Hoje</span>
            </div>

            {ativo.mensagens.map((m, i) => {
              const meu = m.de !== "cliente";
              const anterior = ativo.mensagens[i - 1];
              const agrupada = anterior?.de === m.de;
              return (
                <div key={m.id} className={cn("flex text-foreground", meu ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[78%] px-3 py-2 text-sm shadow-sm",
                      meu
                        ? m.de === "bot"
                          ? "rounded-2xl border border-dashed border-primary/40 bg-primary-soft text-primary-deep"
                          : "rounded-2xl bg-primary text-primary-foreground"
                        : "rounded-2xl bg-card",
                      meu ? (agrupada ? "rounded-br-2xl" : "rounded-br-sm") : agrupada ? "rounded-bl-2xl" : "rounded-bl-sm",
                    )}
                  >
                    {!agrupada && (
                      <p
                        className={cn(
                          "mb-0.5 text-[11px] font-medium",
                          m.de === "agente" ? "text-primary-foreground/75" : "text-muted-foreground",
                        )}
                      >
                        {m.de === "bot" && <Bot className="mr-1 inline size-3" />}
                        {m.autor}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                    {m.anexo && (
                      <div
                        className={cn(
                          "mt-1.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                          meu && m.de === "agente" ? "bg-primary-foreground/15" : "bg-muted",
                        )}
                      >
                        <FileText className="size-4 shrink-0" />
                        <span className="min-w-0">
                          <span className="block truncate">{m.anexo.nome}</span>
                          <span className="opacity-70">{m.anexo.tipo}</span>
                        </span>
                      </div>
                    )}
                    <p
                      className={cn(
                        "tabular mt-0.5 flex items-center justify-end gap-1 text-[10px]",
                        m.de === "agente" ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {m.quando}
                      {meu && (m.lida ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
                    </p>
                  </div>
                </div>
              );
            })}

            {ativo.status === "bot" && (
              <div className="flex justify-end">
                <div className="flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-primary-soft px-3 py-1.5">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                  <span className="ml-1 text-[11px] text-primary-deep">assistente digitando</span>
                </div>
              </div>
            )}
            <div ref={fimRef} />
          </div>

          <footer className="border-t border-border bg-card px-3 py-2.5">
            {ativo.status !== "humano" && ativo.status !== "resolvido" && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-primary/30 bg-primary-soft/60 px-3 py-2">
                <Sparkles className="size-4 shrink-0 text-primary" />
                <p className="min-w-0 flex-1 text-xs text-primary-deep">
                  O assistente está conduzindo esta conversa. Assuma para responder como humano.
                </p>
                <button
                  onClick={() =>
                    setConvs((prev) =>
                      prev.map((c) => (c.id === ativoId ? { ...c, status: "humano", aguardandoMin: 0 } : c)),
                    )
                  }
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
                >
                  <Hand className="size-3.5" /> Assumir
                </button>
              </div>
            )}

            {ativo.sugestoes.length > 0 && (
              <div className="mb-2 flex gap-1.5 overflow-x-auto">
                {ativo.sugestoes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setRascunho(s)}
                    title="Usar sugestão do copiloto"
                    className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary-deep"
                  >
                    <Sparkles className="mr-1 inline size-3 text-primary" />
                    {s.length > 48 ? `${s.slice(0, 48)}…` : s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/50 px-2 py-1.5">
              <button className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                <Smile className="size-4" />
              </button>
              <button className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                <Paperclip className="size-4" />
              </button>
              <textarea
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar(rascunho);
                  }
                }}
                rows={1}
                placeholder="Escreva uma mensagem"
                className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => enviar(rascunho)}
                disabled={!rascunho.trim()}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-40"
              >
                <SendHorizonal className="size-4" />
              </button>
            </div>
          </footer>
        </section>

        {/* ---------- copiloto ---------- */}
        {painel && (
          <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto border-l border-border bg-muted/30 p-3 lg:flex">
            <Panel title="Resumo do copiloto" hint="Gerado automaticamente" actions={<Sparkles className="size-4 text-primary" />}>
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
                {ativo.protocolo && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Protocolo</span>
                    <Chip tone="outline">{ativo.protocolo}</Chip>
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-md border border-dashed border-primary/40 bg-primary-soft/50 p-2.5">
                <p className="text-[11px] uppercase tracking-wide text-primary-deep">Próxima ação sugerida</p>
                <p className="mt-0.5 text-sm">{ativo.proximaAcao}</p>
              </div>
            </Panel>

            {ativo.tags && ativo.tags.length > 0 && (
              <Panel title="Etiquetas">
                <div className="flex flex-wrap gap-1.5">
                  {ativo.tags.map((t) => (
                    <Chip key={t} tone="outline">
                      {t}
                    </Chip>
                  ))}
                </div>
              </Panel>
            )}

            <Panel title="Ações rápidas" bodyClassName="grid gap-1.5 p-3">
              <Link
                to="/clientes/$id"
                params={{ id: ativo.clienteId }}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm transition-colors hover:border-primary"
              >
                <FileText className="size-4 text-primary" /> Abrir dossiê do cliente
              </Link>
              <Link
                to="/operacao"
                className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm transition-colors hover:border-primary"
              >
                <Ticket className="size-4 text-primary" /> Converter em solicitação
              </Link>
              <Link
                to="/agenda"
                className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm transition-colors hover:border-primary"
              >
                <Video className="size-4 text-primary" /> Agendar videoconferência
              </Link>
              <button
                onClick={() =>
                  setConvs((prev) => prev.map((c) => (c.id === ativoId ? { ...c, status: "resolvido", aguardandoMin: 0 } : c)))
                }
                className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left text-sm transition-colors hover:border-primary"
              >
                <CheckCheck className="size-4 text-primary" /> Marcar como resolvida
              </button>
            </Panel>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
