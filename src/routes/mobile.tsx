import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building2,
  CalendarClock,
  ChevronRight,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Search,
  Signal,
  TrendingUp,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MCard, MiniBar, ReadOnlyBadge, Row, StatTile } from "@/components/mobile-kit";
import { Chip, SlaBadge } from "@/components/ui-kit";
import { contadores, rankingMensal } from "@/lib/contadores-data";
import {
  aging,
  brlFull,
  dre,
  indicadores,
  projecaoCaixa,
  receitaPorLinha,
  serieFinanceira,
} from "@/lib/finance-data";
import {
  agentById,
  appointments,
  auditTrail,
  brl,
  clients,
  emissoesPorTipo,
  kpis,
  receitaSerie,
  renovacoes,
  requests,
  stages,
  tickets,
  type Request,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile")({
  head: () => ({
    meta: [
      { title: "Certus Executivo — app mobile da diretoria" },
      {
        name: "description",
        content:
          "App mobile executivo da Certus AC: visão consolidada da operação, dashboards, clientes, pedidos, chamados, agenda, financeiro e rede de parceiros em modo somente leitura.",
      },
      { property: "og:title", content: "Certus Executivo — app mobile da diretoria" },
      {
        property: "og:description",
        content: "Acompanhe toda a operação da autoridade certificadora pelo celular, em modo somente leitura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MobileExecutivo,
});

type TabId = "inicio" | "operacao" | "clientes" | "financeiro" | "rede";

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "inicio", label: "Início", icon: LayoutDashboard },
  { id: "operacao", label: "Operação", icon: KanbanSquare },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "rede", label: "Rede", icon: Handshake },
];

const hojeISO = new Date().toISOString().slice(0, 10);
const axis = { fontSize: 10, fill: "var(--muted-foreground)" } as const;
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 11,
} as const;

function MobileExecutivo() {
  const [tab, setTab] = useState<TabId>("inicio");
  const [alertasAbertos, setAlertasAbertos] = useState(false);
  const [clienteSel, setClienteSel] = useState<string | null>(null);
  const [pedidoSel, setPedidoSel] = useState<string | null>(null);

  const criticos = useMemo(
    () => [
      ...requests
        .filter((r) => r.slaRestanteHoras <= 4 || r.stage === "bloqueado")
        .map((r) => ({
          id: r.id,
          titulo: `${r.protocolo} · ${r.cliente}`,
          detalhe: r.stage === "bloqueado" ? "Pedido bloqueado" : `SLA ${r.slaRestanteHoras}h`,
          tipo: "pedido" as const,
          grave: r.slaRestanteHoras < 0 || r.stage === "bloqueado",
        })),
      ...tickets
        .filter((t) => t.slaRestanteHoras <= 4 && t.status !== "resolvido" && t.status !== "fechado")
        .map((t) => ({
          id: t.id,
          titulo: `${t.numero} · ${t.cliente}`,
          detalhe: `Chamado — ${t.assunto}`,
          tipo: "chamado" as const,
          grave: t.slaRestanteHoras < 0,
        })),
      ...appointments
        .filter((a) => a.dia === hojeISO && a.status === "pendente")
        .map((a) => ({
          id: a.id,
          titulo: `${a.hora} · ${a.cliente}`,
          detalhe: "Videoconferência não confirmada",
          tipo: "agenda" as const,
          grave: false,
        })),
    ],
    [],
  );

  const clienteAberto = clientes.find((c) => c.id === clienteSel);
  const pedidoAberto = requests.find((r) => r.id === pedidoSel);

  return (
    <div className="min-h-screen bg-muted/50 lg:flex lg:items-center lg:justify-center lg:gap-10 lg:p-10">
      <aside className="hidden max-w-sm lg:block">
        <p className="font-display text-2xl font-semibold">Certus Executivo</p>
        <p className="mt-2 text-sm text-muted-foreground">
          App do dono da empresa. Toda a operação da autoridade certificadora na palma da mão — dashboards,
          pedidos, clientes, chamados, agenda, financeiro e rede de parceiros.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <ReadOnlyBadge />
          <span className="text-xs text-muted-foreground">nenhuma ação é executada pelo celular</span>
        </div>
      </aside>

      <div className="mx-auto w-full lg:w-[400px] lg:shrink-0 lg:rounded-[2.5rem] lg:border-8 lg:border-foreground/90 lg:shadow-2xl">
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background lg:h-[820px] lg:rounded-[2rem]">
          {/* status bar */}
          <div className="flex items-center justify-between bg-primary-deep px-5 pb-1 pt-2 text-[10px] font-medium text-primary-foreground tabular">
            <span>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="flex items-center gap-1">
              <Signal className="size-3" />
              <Wifi className="size-3" />
              <span>92%</span>
            </span>
          </div>

          {/* header */}
          <header className="bg-primary-deep px-5 pb-4 pt-2 text-primary-foreground">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-primary-foreground/70">Boa noite, Ricardo</p>
                <h1 className="truncate font-display text-lg font-semibold">Certus AC · Diretoria</h1>
              </div>
              <button
                type="button"
                onClick={() => setAlertasAbertos(true)}
                className="relative grid size-9 shrink-0 place-items-center rounded-full bg-primary-foreground/10"
                aria-label="Ver alertas críticos"
              >
                <Bell className="size-4" />
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-alert text-[9px] font-bold text-primary-foreground">
                  {criticos.length}
                </span>
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                <Lock className="size-3" /> Somente leitura
              </span>
              <span className="text-[10px] text-primary-foreground/70">
                sincronizado às{" "}
                {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </header>

          {/* content */}
          <main className="flex-1 overflow-y-auto overscroll-contain bg-muted/40 px-3 py-3 pb-24">
            {tab === "inicio" && <TabInicio onPedido={setPedidoSel} onVerAlertas={() => setAlertasAbertos(true)} />}
            {tab === "operacao" && <TabOperacao onPedido={setPedidoSel} />}
            {tab === "clientes" && <TabClientes onCliente={setClienteSel} />}
            {tab === "financeiro" && <TabFinanceiro />}
            {tab === "rede" && <TabRede />}
          </main>

          {/* bottom nav */}
          <nav className="absolute inset-x-0 bottom-0 grid grid-cols-5 border-t border-border bg-card/95 pb-2 pt-1.5 backdrop-blur lg:rounded-b-[2rem]">
            {tabs.map((t) => {
              const ativo = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id);
                    setClienteSel(null);
                    setPedidoSel(null);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium",
                    ativo ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full transition-colors",
                      ativo && "bg-primary-soft",
                    )}
                  >
                    <t.icon className="size-4" />
                  </span>
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* overlays */}
          {alertasAbertos && (
            <Sheet titulo="Alertas críticos" onFechar={() => setAlertasAbertos(false)}>
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  {criticos.length} pontos de atenção agora. Acompanhamento apenas — as tratativas seguem com a
                  operação.
                </p>
                <MCard bodyClassName="p-0">
                  {criticos.map((c) => (
                    <Row
                      key={`${c.tipo}-${c.id}`}
                      title={c.titulo}
                      subtitle={c.detalhe}
                      right={
                        <Chip tone={c.grave ? "alert" : "blue"}>
                          {c.tipo === "pedido" ? "Pedido" : c.tipo === "chamado" ? "Chamado" : "Agenda"}
                        </Chip>
                      }
                    />
                  ))}
                </MCard>
              </div>
            </Sheet>
          )}

          {clienteAberto && (
            <Sheet titulo={clienteAberto.nome} onFechar={() => setClienteSel(null)}>
              <ClienteDetalhe id={clienteAberto.id} onPedido={(id) => { setClienteSel(null); setPedidoSel(id); }} />
            </Sheet>
          )}

          {pedidoAberto && (
            <Sheet titulo={pedidoAberto.protocolo} onFechar={() => setPedidoSel(null)}>
              <PedidoDetalhe pedido={pedidoAberto} />
            </Sheet>
          )}
        </div>
      </div>
    </div>
  );
}

const clientes = clients;

function Sheet({
  titulo,
  onFechar,
  children,
}: {
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-background lg:rounded-[2rem]">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button
          type="button"
          onClick={onFechar}
          className="grid size-8 place-items-center rounded-full bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h2 className="truncate font-display text-sm font-semibold">{titulo}</h2>
        <ReadOnlyBadge />
      </header>
      <div className="flex-1 overflow-y-auto bg-muted/40 px-3 py-3 pb-8">{children}</div>
    </div>
  );
}

/* ------------------------------- Início ---------------------------------- */

function TabInicio({
  onPedido,
  onVerAlertas,
}: {
  onPedido: (id: string) => void;
  onVerAlertas: () => void;
}) {
  const emAberto = requests.filter((r) => r.stage !== "concluido");
  const slaRisco = requests.filter((r) => r.slaRestanteHoras <= 4).length;
  const chamadosAbertos = tickets.filter((t) => t.status !== "resolvido" && t.status !== "fechado").length;
  const csat =
    tickets.filter((t) => t.satisfacao).reduce((s, t) => s + (t.satisfacao ?? 0), 0) /
    Math.max(1, tickets.filter((t) => t.satisfacao).length);
  const agendaHoje = appointments.filter((a) => a.dia === hojeISO);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Receita do mês" value={brl(kpis.receitaMes)} delta={kpis.receitaVar} tone="primary" />
        <StatTile label="Emissões" value={String(kpis.emissoes)} delta={kpis.emissoesVar} hint="no mês" />
        <StatTile label="MRR renovação" value={brl(kpis.mrrRenovacao)} delta={kpis.mrrVar} />
        <StatTile label="Ticket médio" value={brl(kpis.ticketMedio)} delta={kpis.ticketVar} />
      </div>

      <MCard title="Receita e emissões" hint="últimos 6 meses">
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={receitaSerie} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="mes" tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
            <Area type="monotone" dataKey="receita" stroke="var(--primary)" strokeWidth={2} fill="url(#mg)" />
          </AreaChart>
        </ResponsiveContainer>
      </MCard>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Pedidos em aberto" value={String(emAberto.length)} hint="na esteira" />
        <StatTile label="SLA em risco" value={String(slaRisco)} tone={slaRisco ? "alert" : "default"} hint="≤ 4h" />
        <StatTile label="Chamados abertos" value={String(chamadosAbertos)} />
        <StatTile label="CSAT" value={`${csat.toFixed(1)}/5`} hint="chamados avaliados" />
      </div>

      <MCard
        title="Pontos de atenção"
        hint="acompanhamento executivo"
        right={
          <button type="button" onClick={onVerAlertas} className="text-[11px] font-medium text-primary">
            ver todos
          </button>
        }
        bodyClassName="p-0"
      >
        {requests
          .filter((r) => r.slaRestanteHoras <= 6 || r.stage === "bloqueado")
          .slice(0, 4)
          .map((r) => (
            <Row
              key={r.id}
              title={r.cliente}
              subtitle={`${r.protocolo} · ${stages.find((s) => s.id === r.stage)?.nome}`}
              right={<SlaBadge horas={r.slaRestanteHoras} />}
              onClick={() => onPedido(r.id)}
            />
          ))}
      </MCard>

      <MCard title="Mix de emissões" hint="por tipo de certificado">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={emissoesPorTipo} layout="vertical" margin={{ left: 8, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="tipo" tick={axis} axisLine={false} tickLine={false} width={70} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="total" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </MCard>

      <MCard title="Agenda de hoje" hint={`${agendaHoje.length} validações`} bodyClassName="p-0">
        {agendaHoje.map((a) => (
          <Row
            key={a.id}
            title={`${a.hora} · ${a.cliente}`}
            subtitle={`${a.tipo} · ${agentById(a.agenteId).nome}`}
            right={
              <Chip tone={a.status === "no-show" ? "alert" : a.status === "confirmado" ? "blue" : "outline"}>
                {a.status}
              </Chip>
            }
          />
        ))}
      </MCard>

      <MCard title="Renovações na janela" bodyClassName="p-0">
        {renovacoes.map((r) => (
          <Row
            key={r.janela}
            title={r.janela}
            subtitle={`${r.quantidade} certificados`}
            right={<span className="text-[12px] font-semibold tabular">{brl(r.receita)}</span>}
          />
        ))}
      </MCard>
    </div>
  );
}

/* ------------------------------ Operação --------------------------------- */

function TabOperacao({ onPedido }: { onPedido: (id: string) => void }) {
  const [sub, setSub] = useState<"pedidos" | "chamados" | "agenda" | "equipe">("pedidos");
  const backlog = stages
    .filter((s) => s.id !== "concluido")
    .map((s) => ({ etapa: s.nome, qtd: requests.filter((r) => r.stage === s.id).length }));
  const maxBacklog = Math.max(...backlog.map((b) => b.qtd), 1);

  return (
    <div className="space-y-3">
      <SegNav
        value={sub}
        onChange={(v) => setSub(v as typeof sub)}
        items={[
          { id: "pedidos", label: "Pedidos" },
          { id: "chamados", label: "Chamados" },
          { id: "agenda", label: "Agenda" },
          { id: "equipe", label: "Equipe" },
        ]}
      />

      {sub === "pedidos" && (
        <>
          <MCard title="Backlog por etapa">
            <div className="space-y-2.5">
              {backlog.map((b) => (
                <div key={b.etapa}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="truncate">{b.etapa}</span>
                    <span className="tabular font-semibold">{b.qtd}</span>
                  </div>
                  <MiniBar value={(b.qtd / maxBacklog) * 100} tone={b.etapa === "Bloqueado" ? "alert" : "primary"} />
                </div>
              ))}
            </div>
          </MCard>
          <MCard title="Pedidos em andamento" hint={`${requests.length} no período`} bodyClassName="p-0">
            {requests.map((r) => (
              <Row
                key={r.id}
                title={r.cliente}
                subtitle={`${r.protocolo} · ${r.tipo} · ${brl(r.valor)}`}
                meta={
                  <>
                    <Chip tone={r.stage === "bloqueado" ? "alert" : "blue"}>
                      {stages.find((s) => s.id === r.stage)?.nome}
                    </Chip>
                    <SlaBadge horas={r.slaRestanteHoras} />
                    <Chip tone="outline">{agentById(r.responsavelId).iniciais}</Chip>
                  </>
                }
                onClick={() => onPedido(r.id)}
              />
            ))}
          </MCard>
        </>
      )}

      {sub === "chamados" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Abertos" value={String(tickets.filter((t) => t.status === "aberto").length)} />
            <StatTile
              label="Em andamento"
              value={String(tickets.filter((t) => t.status === "em andamento").length)}
            />
            <StatTile
              label="SLA risco"
              value={String(tickets.filter((t) => t.slaRestanteHoras <= 4).length)}
              tone="alert"
            />
          </div>
          <MCard title="Fila de chamados" bodyClassName="p-0">
            {tickets.map((t) => (
              <Row
                key={t.id}
                title={t.assunto}
                subtitle={`${t.numero} · ${t.cliente}`}
                meta={
                  <>
                    <Chip tone={t.status === "resolvido" || t.status === "fechado" ? "neutral" : "blue"}>
                      {t.status}
                    </Chip>
                    <Chip tone="outline">{t.categoria}</Chip>
                    <SlaBadge horas={t.slaRestanteHoras} />
                  </>
                }
              />
            ))}
          </MCard>
        </>
      )}

      {sub === "agenda" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Hoje" value={String(appointments.filter((a) => a.dia === hojeISO).length)} />
            <StatTile
              label="Confirmados"
              value={String(appointments.filter((a) => a.status === "confirmado").length)}
            />
            <StatTile
              label="No-show"
              value={String(appointments.filter((a) => a.status === "no-show").length)}
              tone="alert"
            />
          </div>
          <MCard title="Próximas validações" bodyClassName="p-0">
            {appointments
              .filter((a) => a.dia >= hojeISO)
              .slice(0, 12)
              .map((a) => (
                <Row
                  key={a.id}
                  title={`${a.dia.split("-").reverse().join("/")} · ${a.hora}`}
                  subtitle={`${a.cliente} · ${a.tipo}`}
                  right={
                    <Chip tone={a.status === "no-show" ? "alert" : a.status === "confirmado" ? "blue" : "outline"}>
                      {a.status}
                    </Chip>
                  }
                />
              ))}
          </MCard>
        </>
      )}

      {sub === "equipe" && (
        <MCard title="Produtividade da equipe" hint="emissões e tempo médio" bodyClassName="p-0">
          {["a1", "a2", "a3", "a4", "a5"].map((id) => {
            const a = agentById(id);
            const carga = requests.filter((r) => r.responsavelId === id && r.stage !== "concluido").length;
            return (
              <div key={id} className="px-4 py-3 not-last:border-b not-last:border-border">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{a.nome}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{a.papel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold tabular">{a.emissoes}</p>
                    <p className="text-[10px] text-muted-foreground">{a.tempoMedioMin} min/emissão</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <MiniBar value={(a.emissoes / 148) * 100} />
                  <span className="shrink-0 text-[10px] text-muted-foreground">carga {carga}</span>
                </div>
              </div>
            );
          })}
        </MCard>
      )}
    </div>
  );
}

/* ------------------------------ Clientes ---------------------------------- */

function TabClientes({ onCliente }: { onCliente: (id: string) => void }) {
  const [busca, setBusca] = useState("");
  const lista = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.documento.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente ou documento"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Clientes" value={String(clientes.length)} />
        <StatTile
          label="Certificados"
          value={String(clientes.reduce((s, c) => s + c.certificados.length, 0))}
        />
        <StatTile
          label="LTV médio"
          value={brl(clientes.reduce((s, c) => s + c.ltv, 0) / clientes.length)}
        />
      </div>

      <MCard title="Carteira" hint={`${lista.length} clientes`} bodyClassName="p-0">
        {lista.map((c) => {
          const abertos = requests.filter((r) => r.clienteId === c.id && r.stage !== "concluido").length;
          return (
            <Row
              key={c.id}
              title={c.nome}
              subtitle={`${c.documento} · ${c.cidade}`}
              meta={
                <>
                  <Chip tone={c.saude >= 70 ? "blue" : "alert"}>saúde {c.saude}</Chip>
                  <Chip tone="outline">LTV {brl(c.ltv)}</Chip>
                  {abertos > 0 && <Chip tone="neutral">{abertos} em aberto</Chip>}
                </>
              }
              onClick={() => onCliente(c.id)}
            />
          );
        })}
      </MCard>
    </div>
  );
}

function ClienteDetalhe({ id, onPedido }: { id: string; onPedido: (id: string) => void }) {
  const c = clientes.find((x) => x.id === id);
  if (!c) return null;
  const pedidos = requests.filter((r) => r.clienteId === id);
  const chamados = tickets.filter((t) => t.clienteId === id);
  const emAberto = c.faturas.filter((f) => f.status !== "paga");

  return (
    <div className="space-y-3">
      <MCard>
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{c.nome}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {c.documento} · {c.tipoPessoa} · {c.cidade}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatTile label="LTV" value={brl(c.ltv)} />
          <StatTile label="Saúde" value={String(c.saude)} tone={c.saude >= 70 ? "primary" : "alert"} />
          <StatTile label="Cliente desde" value={c.desde.split("-").reverse().join("/")} />
        </div>
      </MCard>

      <MCard title="Certificados" bodyClassName="p-0">
        {c.certificados.map((cert) => (
          <Row
            key={cert.id}
            title={cert.tipo}
            subtitle={`${cert.serie ?? cert.id} · válido até ${String(cert.validade).split("-").reverse().join("/")}`}
            right={<Chip tone={cert.status === "ativo" ? "blue" : "alert"}>{cert.status}</Chip>}
          />
        ))}
      </MCard>

      <MCard title="Pedidos" hint={`${pedidos.length} registros`} bodyClassName="p-0">
        {pedidos.length === 0 && <p className="px-4 py-3 text-[12px] text-muted-foreground">Sem pedidos ativos.</p>}
        {pedidos.map((r) => (
          <Row
            key={r.id}
            title={r.protocolo}
            subtitle={`${r.tipo} · ${stages.find((s) => s.id === r.stage)?.nome}`}
            right={<SlaBadge horas={r.slaRestanteHoras} />}
            onClick={() => onPedido(r.id)}
          />
        ))}
      </MCard>

      <MCard title="Chamados" bodyClassName="p-0">
        {chamados.length === 0 && <p className="px-4 py-3 text-[12px] text-muted-foreground">Nenhum chamado.</p>}
        {chamados.map((t) => (
          <Row key={t.id} title={t.assunto} subtitle={`${t.numero} · ${t.categoria}`} right={<Chip tone="outline">{t.status}</Chip>} />
        ))}
      </MCard>

      <MCard title="Financeiro" hint={`${emAberto.length} título(s) em aberto`} bodyClassName="p-0">
        {c.faturas.map((f) => (
          <Row
            key={f.id}
            title={brl(f.valor)}
            subtitle={`vencimento ${String(f.vencimento).split("-").reverse().join("/")}`}
            right={<Chip tone={f.status === "paga" ? "blue" : "alert"}>{f.status}</Chip>}
          />
        ))}
      </MCard>
    </div>
  );
}

function PedidoDetalhe({ pedido }: { pedido: Request }) {
  const etapa = stages.find((s) => s.id === pedido.stage);
  const feitos = pedido.checklist.filter((i) => i.feito).length;
  return (
    <div className="space-y-3">
      <MCard>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={pedido.stage === "bloqueado" ? "alert" : "deep"}>{etapa?.nome}</Chip>
          <SlaBadge horas={pedido.slaRestanteHoras} />
          <Chip tone="outline">{pedido.canal}</Chip>
          <Chip tone="neutral">prioridade {pedido.prioridade}</Chip>
        </div>
        <p className="mt-3 font-display text-base font-semibold">{pedido.cliente}</p>
        <p className="text-[11px] text-muted-foreground">
          {pedido.documento} · {pedido.tipo} · {brl(pedido.valor)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatTile label="Responsável" value={agentById(pedido.responsavelId).iniciais} hint={agentById(pedido.responsavelId).nome} />
          <StatTile label="Checklist" value={`${feitos}/${pedido.checklist.length}`} />
        </div>
      </MCard>

      <MCard title="Checklist da etapa" bodyClassName="p-0">
        {pedido.checklist.map((i) => (
          <Row
            key={i.id}
            title={i.label}
            right={<Chip tone={i.feito ? "blue" : "outline"}>{i.feito ? "ok" : "pendente"}</Chip>}
          />
        ))}
      </MCard>

      <MCard title="Linha do tempo">
        <ol className="space-y-3">
          {pedido.timeline.map((e) => (
            <li key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="text-[12px] font-medium">{e.titulo}</p>
                <p className="text-[11px] text-muted-foreground">
                  {e.quando} · {e.autor}
                </p>
                {e.detalhe && <p className="mt-0.5 text-[11px] text-muted-foreground">{e.detalhe}</p>}
              </div>
            </li>
          ))}
        </ol>
      </MCard>
    </div>
  );
}

/* ----------------------------- Financeiro --------------------------------- */

function TabFinanceiro() {
  const [sub, setSub] = useState<"visao" | "caixa" | "dre">("visao");
  return (
    <div className="space-y-3">
      <SegNav
        value={sub}
        onChange={(v) => setSub(v as typeof sub)}
        items={[
          { id: "visao", label: "Visão" },
          { id: "caixa", label: "Caixa" },
          { id: "dre", label: "DRE" },
        ]}
      />

      {sub === "visao" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="MRR" value={brl(indicadores.mrr)} delta={indicadores.mrrVar} tone="primary" />
            <StatTile label="EBITDA" value={brl(indicadores.ebitda)} hint={`margem ${indicadores.margemEbitda}%`} />
            <StatTile label="Receita mês" value={brl(indicadores.receitaMes)} delta={indicadores.receitaVar} />
            <StatTile
              label="Inadimplência"
              value={`${indicadores.inadimplencia}%`}
              delta={indicadores.inadimplenciaVar}
              tone={indicadores.inadimplencia > 5 ? "alert" : "default"}
            />
          </div>
          <MCard title="Receita × despesa × EBITDA">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={serieFinanceira} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brlFull(v)} />
                <Line dataKey="receita" stroke="var(--primary)" strokeWidth={2} dot={false} />
                <Line dataKey="despesa" stroke="var(--muted-foreground)" strokeWidth={1.5} dot={false} />
                <Line dataKey="ebitda" stroke="var(--primary-deep)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </MCard>
          <MCard title="Receita por linha">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={receitaPorLinha} dataKey="valor" nameKey="linha" innerRadius={38} outerRadius={62}>
                  {receitaPorLinha.map((_, i) => (
                    <Cell key={i} fill={`color-mix(in oklab, var(--primary) ${100 - i * 16}%, white)`} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brlFull(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1">
              {receitaPorLinha.map((l) => (
                <div key={l.linha} className="flex items-center justify-between text-[11px]">
                  <span className="truncate text-muted-foreground">{l.linha}</span>
                  <span className="tabular font-medium">{brl(l.valor)}</span>
                </div>
              ))}
            </div>
          </MCard>
        </>
      )}

      {sub === "caixa" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Saldo consolidado" value={brl(indicadores.saldoTotal)} tone="primary" />
            <StatTile label="Runway" value={`${indicadores.runwayMeses} meses`} />
          </div>
          <MCard title="Projeção de caixa" hint="próximos 60 dias">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={projecaoCaixa} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="cx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dia" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brlFull(v)} />
                <Area type="monotone" dataKey="saldo" stroke="var(--primary)" strokeWidth={2} fill="url(#cx)" />
              </AreaChart>
            </ResponsiveContainer>
          </MCard>
          <MCard title="Aging do contas a receber" bodyClassName="p-0">
            {aging.map((a) => (
              <Row
                key={a.faixa}
                title={a.faixa}
                subtitle={`${a.titulos} título(s)`}
                right={
                  <span className={cn("text-[12px] font-semibold tabular", a.faixa === "60+ dias" && "text-alert")}>
                    {brl(a.valor)}
                  </span>
                }
              />
            ))}
          </MCard>
        </>
      )}

      {sub === "dre" && (
        <MCard title="DRE gerencial" hint="mês corrente" bodyClassName="p-0">
          {dre.map((l) => (
            <div
              key={l.linha}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-2.5 not-last:border-b not-last:border-border",
                (l.tipo === "subtotal" || l.tipo === "resultado") && "bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "truncate text-[12px]",
                  l.tipo === "resultado" ? "font-semibold text-primary-deep" : "text-muted-foreground",
                )}
              >
                {l.linha}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[12px] tabular font-medium",
                  l.valor < 0 ? "text-alert" : l.tipo === "resultado" ? "text-primary" : "",
                )}
              >
                {brlFull(l.valor)}
              </span>
            </div>
          ))}
        </MCard>
      )}
    </div>
  );
}

/* -------------------------------- Rede ------------------------------------ */

function TabRede() {
  const ativos = contadores.filter((c) => c.status === "ativo");
  const receitaRede = contadores.reduce((s, c) => s + c.receitaMes, 0);
  const comissoes = contadores.reduce((s, c) => s + c.comissaoMes, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Parceiros ativos" value={String(ativos.length)} hint={`${contadores.length} na base`} />
        <StatTile label="Receita da rede" value={brl(receitaRede)} tone="primary" />
        <StatTile label="Comissões do mês" value={brl(comissoes)} />
        <StatTile
          label="Emissões via rede"
          value={String(contadores.reduce((s, c) => s + c.emissoesMes, 0))}
        />
      </div>

      <MCard title="Ranking de parceiros" hint="emissões no mês" bodyClassName="p-0">
        {rankingMensal.map((r, i) => (
          <Row
            key={r.nome}
            title={`${i + 1}. ${r.nome}`}
            subtitle={`${r.emissoes} emissões · comissão ${brl(r.comissao)}`}
            right={<span className="text-[12px] font-semibold tabular">{brl(r.receita)}</span>}
          />
        ))}
      </MCard>

      <MCard title="Desempenho por parceiro" bodyClassName="p-0">
        {contadores.map((c) => {
          const atingimento = Math.round((c.emissoesMes / Math.max(1, c.metaMes)) * 100);
          return (
            <div key={c.id} className="px-4 py-3 not-last:border-b not-last:border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{c.nome}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {c.cidade} · {c.carteira.length} clientes · NPS {c.nps}
                  </p>
                </div>
                <Chip tone={c.status === "ativo" ? "blue" : c.status === "suspenso" ? "alert" : "outline"}>
                  {c.tier}
                </Chip>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <MiniBar value={atingimento} tone={atingimento < 60 ? "alert" : "primary"} />
                <span className="shrink-0 text-[10px] tabular text-muted-foreground">{atingimento}% da meta</span>
              </div>
            </div>
          );
        })}
      </MCard>

      <MCard title="Trilha de auditoria" hint="eventos recentes" bodyClassName="p-0">
        {auditTrail.map((a) => (
          <Row key={a.id} title={a.acao} subtitle={`${a.quando} · ${a.ator} · ${a.alvo}`} />
        ))}
      </MCard>

      <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-muted-foreground">
        <Activity className="size-3" /> Dados de operação em tempo real · visualização executiva
      </div>
    </div>
  );
}

/* ------------------------------- Helpers ---------------------------------- */

function SegNav({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { id: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-full border border-border bg-card p-1">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => onChange(i.id)}
          className={cn(
            "flex-1 rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors",
            value === i.id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/* referências usadas nos ícones do cabeçalho da lista */
export const _icons = { AlertTriangle, CalendarClock, ChevronRight, LifeBuoy, TrendingUp };
