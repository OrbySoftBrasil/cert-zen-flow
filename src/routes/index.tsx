import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarX2,
  FileWarning,
  LifeBuoy,
  Send,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Bar as MiniBar, Chip, Metric, Panel, SlaBadge } from "@/components/ui-kit";
import { AppShell } from "@/components/app-shell";
import { ExportMenu } from "@/components/export-menu";
import type { Dataset } from "@/lib/export";
import {
  agentById,
  agents,
  appointments,
  brl,
  emissoesPorTipo,
  kpis,
  receitaSerie,
  renovacoes,
  requests,
  stages,
  ticketCategorias,
  tickets,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard executivo e operacional — Certus AC" },
      {
        name: "description",
        content:
          "Visão geral da operação da autoridade certificadora: receita, emissões, backlog por etapa, chamados, SLA, agenda e renovações com exportação em CSV, XLSX e JSON.",
      },
      { property: "og:title", content: "Dashboard executivo e operacional — Certus AC" },
      {
        property: "og:description",
        content: "Receita, emissões, chamados, SLA, agenda e renovações em uma visão única da operação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const CHART = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
} as const;

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "alert" | "ok" | undefined;
}) {
  return (
    <div className="min-w-0 flex-1 border-border px-4 py-3 not-last:border-r">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={
          "mt-1 font-display text-2xl font-semibold tabular " +
          (tone === "alert" ? "text-alert" : tone === "ok" ? "text-primary" : "")
        }
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function Dashboard() {
  const hoje = new Date().toISOString().slice(0, 10);

  const criticos = requests.filter((r) => r.slaRestanteHoras < 0 || r.stage === "bloqueado");
  const abertos = requests.filter((r) => r.stage !== "concluido");
  const slaRisco = abertos.filter((r) => r.slaRestanteHoras >= 0 && r.slaRestanteHoras <= 4).length;
  const slaEstourado = abertos.filter((r) => r.slaRestanteHoras < 0).length;
  const pipelineValor = abertos.reduce((s, r) => s + r.valor, 0);

  const chamadosAbertos = tickets.filter((t) => t.status !== "resolvido" && t.status !== "fechado");
  const chamadosSlaEstourado = chamadosAbertos.filter((t) => t.slaRestanteHoras < 0).length;
  const respostas = tickets.filter((t) => t.primeiraRespostaMin !== undefined);
  const primeiraResposta = Math.round(
    respostas.reduce((s, t) => s + (t.primeiraRespostaMin ?? 0), 0) / Math.max(1, respostas.length),
  );
  const avaliados = tickets.filter((t) => t.satisfacao !== undefined);
  const csat = (avaliados.reduce((s, t) => s + (t.satisfacao ?? 0), 0) / Math.max(1, avaliados.length)).toFixed(1);

  const agHoje = appointments.filter((a) => a.dia === hoje);
  const agPendentes = agHoje.filter((a) => a.status === "pendente").length;

  const backlog = useMemo(
    () =>
      stages
        .filter((s) => s.id !== "concluido")
        .map((s) => {
          const rs = requests.filter((r) => r.stage === s.id);
          return {
            etapa: s.nome,
            total: rs.length,
            risco: rs.filter((r) => r.slaRestanteHoras <= 4).length,
            valor: rs.reduce((acc, r) => acc + r.valor, 0),
          };
        }),
    [],
  );

  const porCategoria = useMemo(
    () =>
      ticketCategorias
        .map((c) => ({
          categoria: c.nome,
          total: tickets.filter((t) => t.categoria === c.nome).length,
          abertos: chamadosAbertos.filter((t) => t.categoria === c.nome).length,
        }))
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total),
    [chamadosAbertos],
  );

  const porCanal = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of requests) map.set(r.canal, (map.get(r.canal) ?? 0) + 1);
    return [...map.entries()].map(([canal, total]) => ({ canal, total }));
  }, []);

  const cargaEquipe = useMemo(
    () =>
      agents.map((a) => ({
        ...a,
        solicitacoes: requests.filter((r) => r.responsavelId === a.id && r.stage !== "concluido").length,
        chamados: chamadosAbertos.filter((t) => t.responsavelId === a.id).length,
      })),
    [chamadosAbertos],
  );

  const slaSerie = useMemo(
    () =>
      receitaSerie.map((m, i) => ({
        mes: m.mes,
        slaOk: 88 + ((i * 7) % 9),
        noShow: 11 - i * 0.6,
      })),
    [],
  );

  const datasets = (): Dataset[] => [
    {
      nome: "Resumo",
      linhas: [
        { Indicador: "Receita do mês", Valor: kpis.receitaMes, Variação: kpis.receitaVar },
        { Indicador: "MRR de renovação", Valor: kpis.mrrRenovacao, Variação: kpis.mrrVar },
        { Indicador: "Emissões", Valor: kpis.emissoes, Variação: kpis.emissoesVar },
        { Indicador: "Ticket médio", Valor: kpis.ticketMedio, Variação: kpis.ticketVar },
        { Indicador: "Conversão (%)", Valor: kpis.conversao, Variação: kpis.conversaoVar },
        { Indicador: "No-show (%)", Valor: kpis.noShow, Variação: kpis.noShowVar },
        { Indicador: "Solicitações em aberto", Valor: abertos.length, Variação: "" },
        { Indicador: "SLA estourado (solicitações)", Valor: slaEstourado, Variação: "" },
        { Indicador: "Chamados abertos", Valor: chamadosAbertos.length, Variação: "" },
        { Indicador: "1ª resposta média (min)", Valor: primeiraResposta, Variação: "" },
        { Indicador: "CSAT", Valor: csat, Variação: "" },
      ],
    },
    {
      nome: "Solicitações",
      linhas: requests.map((r) => ({
        Protocolo: r.protocolo,
        Cliente: r.cliente,
        Documento: r.documento,
        Tipo: r.tipo,
        Etapa: r.stage,
        Canal: r.canal,
        Prioridade: r.prioridade,
        Responsável: agentById(r.responsavelId).nome,
        Valor: r.valor,
        "SLA restante (h)": r.slaRestanteHoras,
        "Aberto em": r.abertoEm,
      })),
    },
    {
      nome: "Chamados",
      linhas: tickets.map((t) => ({
        Número: t.numero,
        Cliente: t.cliente,
        Assunto: t.assunto,
        Categoria: t.categoria,
        Subcategoria: t.subcategoria,
        Canal: t.canal,
        Prioridade: t.prioridade,
        Status: t.status,
        Responsável: agentById(t.responsavelId).nome,
        "SLA restante (h)": t.slaRestanteHoras,
        "1ª resposta (min)": t.primeiraRespostaMin ?? "",
        CSAT: t.satisfacao ?? "",
        "Aberto em": t.abertoEm,
      })),
    },
    {
      nome: "Backlog por etapa",
      linhas: backlog.map((b) => ({ Etapa: b.etapa, Total: b.total, "Em risco": b.risco, "Valor em pipeline": b.valor })),
    },
    {
      nome: "Agenda",
      linhas: appointments.map((a) => ({
        Dia: a.dia,
        Hora: a.hora,
        Cliente: a.cliente,
        Tipo: a.tipo,
        Agente: agentById(a.agenteId).nome,
        Sala: a.sala,
        Status: a.status,
      })),
    },
    {
      nome: "Equipe",
      linhas: cargaEquipe.map((a) => ({
        Agente: a.nome,
        Papel: a.papel,
        Emissões: a.emissoes,
        "Tempo médio (min)": a.tempoMedioMin,
        "Solicitações em aberto": a.solicitacoes,
        "Chamados em aberto": a.chamados,
      })),
    },
    {
      nome: "Renovações",
      linhas: renovacoes.map((r) => ({ Janela: r.janela, Quantidade: r.quantidade, "Receita potencial": r.receita })),
    },
  ];

  return (
    <AppShell
      title="Dashboard executivo"
      subtitle="Julho de 2026 · atualizado há 4 minutos"
      actions={
        <>
          <ExportMenu datasets={datasets} base="certus-operacao" />
          <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep print:hidden">
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

        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Kpi label="Solicitações em aberto" value={String(abertos.length)} hint={`${brl(pipelineValor)} em pipeline`} />
          <Kpi
            label="SLA em risco"
            value={String(slaRisco + slaEstourado)}
            hint={`${slaEstourado} estourado(s) · ${slaRisco} em risco`}
            tone={slaEstourado > 0 ? "alert" : undefined}
          />
          <Kpi
            label="Chamados abertos"
            value={String(chamadosAbertos.length)}
            hint={`${chamadosSlaEstourado} fora do SLA`}
            tone={chamadosSlaEstourado > 0 ? "alert" : undefined}
          />
          <Kpi label="1ª resposta média" value={`${primeiraResposta} min`} hint="meta: 30 min" tone="ok" />
          <Kpi label="CSAT" value={`${csat}/5`} hint={`${avaliados.length} avaliações`} tone="ok" />
          <Kpi
            label="Agenda de hoje"
            value={String(agHoje.length)}
            hint={`${agPendentes} sem confirmação`}
            tone={agPendentes > 0 ? "alert" : undefined}
          />
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
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => (n === "receita" ? brl(v) : v)} />
                  <Area type="monotone" dataKey="receita" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#rev)" />
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
                  <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} />
                  <Bar dataKey="total" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            title="Backlog por etapa"
            hint="Solicitações no funil operacional"
            actions={
              <Link to="/operacao" className="text-xs font-medium text-primary hover:underline">
                Kanban
              </Link>
            }
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={backlog} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="etapa"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={54}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                  <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} />
                  <Bar dataKey="total" name="Total" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="risco" name="Em risco" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Chamados por categoria"
            hint="Helpdesk · volume total x abertos"
            actions={
              <Link to="/chamados" className="text-xs font-medium text-primary hover:underline">
                Fila
              </Link>
            }
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porCategoria} layout="vertical" margin={{ left: 34, right: 12 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={110}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} />
                  <Bar dataKey="total" name="Total" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="abertos" name="Abertos" fill="var(--color-chart-4)" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Origem das solicitações" hint="Distribuição por canal de entrada">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={porCanal} dataKey="total" nameKey="canal" innerRadius={44} outerRadius={72} paddingAngle={2}>
                    {porCanal.map((_, i) => (
                      <Cell key={i} fill={CHART[i % CHART.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
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
              {chamadosAbertos
                .filter((t) => t.slaRestanteHoras <= 4)
                .map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-md bg-alert-soft text-alert">
                      <LifeBuoy className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.assunto}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.numero} · {t.cliente} · {t.categoria}
                      </p>
                    </div>
                    <SlaBadge horas={t.slaRestanteHoras} />
                    <Link
                      to="/chamados/$id"
                      params={{ id: t.id }}
                      className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
                    >
                      Abrir
                    </Link>
                  </li>
                ))}
              <li className="flex items-center gap-3 px-4 py-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-alert-soft text-alert">
                  <CalendarX2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{agPendentes} videoconferências sem confirmação para hoje</p>
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
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep print:hidden">
                <Send className="size-3.5" /> Disparar campanha
              </button>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Últimos chamados"
            hint="Helpdesk · atualizações recentes"
            actions={
              <Link to="/chamados" className="text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            }
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Chamado</th>
                    <th className="px-4 py-2 font-medium">Categoria</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Responsável</th>
                    <th className="px-4 py-2 font-medium">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.slice(0, 6).map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-2.5">
                        <Link to="/chamados/$id" params={{ id: t.id }} className="hover:underline">
                          <span className="block truncate font-medium">{t.assunto}</span>
                          <span className="text-xs text-muted-foreground">
                            {t.numero} · {t.cliente}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{t.categoria}</td>
                      <td className="px-4 py-2.5">
                        <Chip tone={t.status === "resolvido" || t.status === "fechado" ? "neutral" : "blue"}>{t.status}</Chip>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{agentById(t.responsavelId).nome}</td>
                      <td className="px-4 py-2.5">
                        <SlaBadge horas={t.slaRestanteHoras} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Qualidade operacional" hint="SLA cumprido x no-show (%)">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={slaSerie} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="slaOk" name="SLA cumprido" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="noShow" name="No-show" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Produtividade e carga da equipe" hint="Emissões, solicitações e chamados em aberto" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Agente</th>
                    <th className="px-4 py-2 font-medium">Papel</th>
                    <th className="px-4 py-2 font-medium">Emissões</th>
                    <th className="px-4 py-2 font-medium">Tempo médio</th>
                    <th className="px-4 py-2 font-medium">Solicitações</th>
                    <th className="px-4 py-2 font-medium">Chamados</th>
                    <th className="px-4 py-2 font-medium">Carga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cargaEquipe.map((a) => (
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
                      <td className="px-4 py-2.5 tabular">{a.solicitacoes}</td>
                      <td className="px-4 py-2.5 tabular">{a.chamados}</td>
                      <td className="w-40 px-4 py-2.5">
                        <MiniBar value={(a.emissoes / 148) * 100} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Agenda de hoje"
            hint="Videoconferências de validação"
            actions={
              <Link to="/agenda" className="text-xs font-medium text-primary hover:underline">
                Abrir agenda
              </Link>
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {agHoje.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">Sem agendamentos hoje.</li>}
              {agHoje.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="tabular text-sm font-medium">{a.hora}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{a.cliente}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.tipo} · {agentById(a.agenteId).nome}
                    </p>
                  </div>
                  <Chip tone={a.status === "no-show" ? "alert" : a.status === "confirmado" ? "blue" : "outline"}>{a.status}</Chip>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          title="Rede de contadores parceiros"
          hint="Emissões indicadas, comissão apurada e clientes vinculados no mês"
          actions={
            <Link to="/contadores" className="text-xs font-medium text-primary hover:underline">
              Abrir rede
            </Link>
          }
          bodyClassName="p-0"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Parceiro</th>
                <th className="px-4 py-2 font-medium">Tier</th>
                <th className="px-4 py-2 font-medium">Clientes</th>
                <th className="px-4 py-2 font-medium">Emissões</th>
                <th className="px-4 py-2 text-right font-medium">Receita</th>
                <th className="px-4 py-2 text-right font-medium">Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...contadores]
                .sort((a, b) => b.emissoesMes - a.emissoesMes)
                .slice(0, 5)
                .map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <Link to="/contadores/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">
                        {c.nome}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{c.cidade}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Chip tone={c.status === "ativo" ? "blue" : c.status === "suspenso" ? "alert" : "outline"}>
                        {c.tier}
                      </Chip>
                    </td>
                    <td className="px-4 py-2.5 tabular">{c.carteira.length}</td>
                    <td className="px-4 py-2.5 tabular">
                      {c.emissoesMes}
                      <span className="text-xs text-muted-foreground"> / {c.metaMes}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular">{brl(c.receitaMes)}</td>
                    <td className="px-4 py-2.5 text-right tabular">{brl(c.comissaoMes)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowUpRight className="size-3.5" /> Dados fictícios de demonstração. Exportações geram arquivos reais em CSV, XLSX e JSON.
        </p>
      </div>
    </AppShell>
  );
}
