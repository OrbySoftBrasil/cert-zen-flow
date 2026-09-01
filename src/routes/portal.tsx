import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, LifeBuoy, Paperclip, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Chip } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { baseConhecimento, ticketCategorias, type TicketCategoria } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Portal do cliente — Abrir chamado | Certus AC" },
      {
        name: "description",
        content:
          "Abra um chamado de suporte para seu certificado digital, acompanhe protocolos e consulte artigos de ajuda no portal do cliente Certus AC.",
      },
      { property: "og:title", content: "Portal do cliente — Abrir chamado | Certus AC" },
      { property: "og:description", content: "Abertura e acompanhamento de chamados de suporte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Portal,
});

const prioridades = ["baixa", "normal", "alta", "critica"] as const;

function Portal() {
  const { tickets, addTicket } = useStore();
  const meus = tickets.filter((t) => t.clienteId === "c1");
  const [categoria, setCategoria] = useState<TicketCategoria>("Instalação e uso");
  const [sub, setSub] = useState(ticketCategorias[0]!.sub[0]!);
  const [prioridade, setPrioridade] = useState<(typeof prioridades)[number]>("normal");
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [protocolo, setProtocolo] = useState<string | null>(null);

  const subs = ticketCategorias.find((c) => c.nome === categoria)?.sub ?? [];
  const sugestoes = baseConhecimento.filter((a) => a.categoria === categoria);

  function enviar() {
    if (!assunto.trim() || !descricao.trim()) return;
    const novo = addTicket({
      clienteId: "c1",
      assunto: assunto.trim(),
      categoria,
      subcategoria: sub,
      canal: "Site",
      prioridade,
      responsavelId: "a1",
      descricao: descricao.trim(),
    });
    setProtocolo(novo.numero);
    toast.success("Chamado aberto", { description: `Protocolo ${novo.numero} — acompanhe por aqui e por e-mail.` });
    setAssunto("");
    setDescricao("");
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-4">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Certus AC · Portal do cliente</p>
            <p className="text-[11px] text-muted-foreground">Construtora Vale Norte LTDA</p>
          </div>
          <Link to="/chamados" className="ml-auto text-xs text-primary hover:underline">
            Voltar ao sistema interno
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Como podemos ajudar?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Abra um chamado e acompanhe o andamento. Suporte das 8h às 20h em dias úteis.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-sm font-semibold">Novo chamado</h2>

            {protocolo && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-primary-soft px-3 py-2.5 text-sm text-primary-deep">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <p>
                  Chamado <strong>{protocolo}</strong> registrado. Você receberá as atualizações por e-mail e poderá
                  acompanhar abaixo. Primeira resposta prevista em até 2 horas úteis.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-muted-foreground">Categoria</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ticketCategorias.map((c) => (
                    <button
                      key={c.nome}
                      onClick={() => {
                        setCategoria(c.nome);
                        setSub(c.sub[0]!);
                      }}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-xs transition-colors",
                        categoria === c.nome
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:border-primary",
                      )}
                    >
                      {c.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Assunto específico</span>
                  <select
                    value={sub}
                    onChange={(e) => setSub(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                  >
                    {subs.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Urgência</span>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as (typeof prioridades)[number])}
                    className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm capitalize outline-none focus:border-primary"
                  >
                    {prioridades.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-muted-foreground">Título do chamado</span>
                <input
                  value={assunto}
                  maxLength={120}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex.: certificado não aparece no e-CAC"
                  className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Descrição</span>
                <textarea
                  value={descricao}
                  maxLength={2000}
                  rows={5}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o que aconteceu, mensagens de erro e o que já tentou."
                  className="mt-1 w-full resize-none rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                />
                <span className="text-[11px] text-muted-foreground tabular">{descricao.length}/2000</span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary">
                  <Paperclip className="size-3.5" /> Anexar print ou documento
                </button>
                <button
                  onClick={enviar}
                  disabled={!assunto.trim() || !descricao.trim()}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Abrir chamado
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-display text-sm font-semibold">Talvez resolva agora</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {(sugestoes.length ? sugestoes : baseConhecimento.slice(0, 3)).map((a) => (
                  <li key={a.id} className="flex items-start gap-2">
                    <LifeBuoy className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span className="leading-snug">{a.titulo}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-display text-sm font-semibold">Meus chamados</h2>
              <ul className="mt-2 space-y-3">
                {meus.map((t) => (
                  <li key={t.id} className="border-b border-border pb-2.5 last:border-0 last:pb-0">
                    <p className="text-sm leading-snug">{t.assunto}</p>
                    <p className="text-[11px] text-muted-foreground tabular">
                      {t.numero} · atualizado {t.atualizadoEm}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Chip tone="blue">{t.categoria}</Chip>
                      <Chip tone={t.status === "resolvido" || t.status === "fechado" ? "neutral" : "deep"}>
                        {t.status}
                      </Chip>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
