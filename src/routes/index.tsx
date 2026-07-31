import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarX2,
  FileWarning,
  Send,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Bar as MiniBar, Chip, Metric, Panel, SlaBadge } from "@/components/ui-kit";
import { AppShell } from "@/components/app-shell";
import {
  agents,
  brl,
  emissoesPorTipo,
  kpis,
  receitaSerie,
  renovacoes,
  requests,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard executivo — Certus AC" },
      {
        name: "description",
        content:
          "Painel executivo da autoridade certificadora: receita, emissões, pendências críticas e renovações em uma única visão.",
      },
      { property: "og:title", content: "Dashboard executivo — Certus AC" },
      {
        property: "og:description",
        content: "Receita, emissões, SLA e renovações da autoridade certificadora.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const criticos = requests.filter((r) => r.slaRestanteHoras < 0 || r.stage === "bloqueado");

  return (
    <AppShell
      title="Dashboard executivo"
      subtitle="Julho de 2026 · atualizado há 4 minutos"
      actions={
        <>
          <button className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground">
            Exportar
          </button>
          <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep">
            Nova solicitação
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Metric label="Receita do mês" value={brl(kpis.receitaMes)} delta={kpis.receitaVar} hint="vs. junho" />
          <Metric label="MRR de renovação" value={brl(kpis.mrrRenovacao)} delta={kpis.mrrVar} hint="recorrente" />
          <Metric label="Emissões" value={String(kpis.emissoes)} delta={kpis.emissoesVar} hint="no mês" />
          <Metric label="Ticket médio" value={brl(kpis.ticketMedio)} delta={kpis.ticketVar} />
          <Metric label="Conversão" value={`${kpis.conversao}%`} delta={kpis.conversaoVar} hint="lead → emissão" />
          <Metric label="No-show" value={`${kpis.noShow}%`} delta={kpis.noShowVar} hint="videoconferências" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Receita e emissões"
            hint="Últimos 6 meses"
            actions={
              <Chip tone="blue">
                <TrendingUp className="size-3" /> +9,6%
              </Chip>
            }
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={receitaSerie} margin={{ left: -12, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                    formatter={(v: number, n) => (n === "receita" ? brl(v) : v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Emissões por tipo" hint="Mix de produto no mês">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissoesPorTipo} layout="vertical" margin={{ left: 22, right: 12 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="tipo"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={78}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Pendências críticas"
            hint="Requerem ação imediata"
            actions={
              <Link to="/operacao" className="text-xs font-medium text-primary hover:underline">
                Abrir central operacional
              </Link>
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {criticos.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-alert-soft text-alert">
                    {r.stage === "bloqueado" ? <FileWarning className="size-4" /> : <AlertTriangle className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.cliente}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.protocolo} · {r.tipo} · {r.canal}
                    </p>
                  </div>
                  <SlaBadge horas={r.slaRestanteHoras} />
                  <Link
                    to="/solicitacoes/$id"
                    params={{ id: r.id }}
                    className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
                  >
                    Tratar
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-3 px-4 py-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-alert-soft text-alert">
                  <CalendarX2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">3 videoconferências sem confirmação para hoje</p>
                  <p className="text-xs text-muted-foreground">Risco de no-show acima da média do mês</p>
                </div>
                <Link
                  to="/agenda"
                  className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
                >
                  Ver agenda
                </Link>
              </li>
            </ul>
          </Panel>

          <Panel
            title="Funil de renovações"
            hint="Receita potencial em aberto"
            actions={
              <Link to="/renovacoes" className="text-xs font-medium text-primary hover:underline">
                Detalhar
              </Link>
            }
          >
            <div className="space-y-4">
              {renovacoes.map((r, i) => (
                <div key={r.janela}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">{r.janela}</span>
                    <span className="tabular font-medium">{r.quantidade}</span>
                  </div>
                  <div className="mt-1.5">
                    <MiniBar value={100 - i * 22} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground tabular">{brl(r.receita)} em potencial</p>
                </div>
              ))}
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep">
                <Send className="size-3.5" /> Disparar campanha
              </button>
            </div>
          </Panel>
        </div>

        <Panel title="Produtividade da equipe" hint="Volume e tempo médio de validação" bodyClassName="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Agente</th>
                <th className="px-4 py-2 font-medium">Papel</th>
                <th className="px-4 py-2 font-medium">Emissões</th>
                <th className="px-4 py-2 font-medium">Tempo médio</th>
                <th className="px-4 py-2 font-medium">Carga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agents.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary-deep">
                        {a.iniciais}
                      </span>
                      {a.nome}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.papel}</td>
                  <td className="px-4 py-2.5 tabular">{a.emissoes}</td>
                  <td className="px-4 py-2.5 tabular">{a.tempoMedioMin} min</td>
                  <td className="w-40 px-4 py-2.5">
                    <MiniBar value={(a.emissoes / 148) * 100} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowUpRight className="size-3.5" /> Dados fictícios de demonstração.
        </p>
      </div>
    </AppShell>
  );
}
