import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Banknote, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { ExportMenu } from "@/components/export-menu";
import { FinanceTabs } from "@/components/finance-tabs";
import { Bar as MiniBar, Chip, Metric, Panel } from "@/components/ui-kit";
import type { Dataset } from "@/lib/export";
import { brl } from "@/lib/mock-data";
import {
  aging,
  brlFull,
  centrosCusto,
  comissoes,
  contas,
  contratos,
  dataBR,
  despesaPorGrupo,
  dre,
  indicadores,
  lancamentos,
  pagar,
  planos,
  projecaoCaixa,
  receber,
  receitaPorLinha,
  serieFinanceira,
} from "@/lib/finance-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro/")({
  head: () => ({
    meta: [
      { title: "BI financeiro — Certus AC" },
      {
        name: "description",
        content:
          "Painel de BI financeiro da autoridade certificadora: caixa, DRE, MRR, inadimplência, orçado x realizado e relatórios em CSV, XLSX e PDF.",
      },
      { property: "og:title", content: "BI financeiro — Certus AC" },
      {
        property: "og:description",
        content: "Caixa, DRE, MRR, inadimplência e relatórios exportáveis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FinanceiroBI,
});

const PIE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
};

function datasets(): Dataset[] {
  return [
    {
      nome: "Resumo",
      linhas: [
        { Indicador: "Saldo consolidado", Valor: indicadores.saldoTotal },
        { Indicador: "Receita do mês", Valor: indicadores.receitaMes },
        { Indicador: "Despesa do mês", Valor: indicadores.despesaMes },
        { Indicador: "EBITDA", Valor: indicadores.ebitda },
        { Indicador: "Margem EBITDA (%)", Valor: indicadores.margemEbitda },
        { Indicador: "MRR", Valor: indicadores.mrr },
        { Indicador: "Inadimplência (%)", Valor: indicadores.inadimplencia },
        { Indicador: "Runway (meses)", Valor: indicadores.runwayMeses },
        { Indicador: "PMR (dias)", Valor: indicadores.prazoMedioRecebimento },
        { Indicador: "PMP (dias)", Valor: indicadores.prazoMedioPagamento },
        { Indicador: "LTV/CAC", Valor: indicadores.ltvCac },
      ],
    },
    { nome: "DRE", linhas: dre.map((d) => ({ Linha: d.linha, Valor: d.valor })) },
    {
      nome: "Serie mensal",
      linhas: serieFinanceira.map((s) => ({
        Mês: s.mes,
        Receita: s.receita,
        Despesa: s.despesa,
        EBITDA: s.ebitda,
        Caixa: s.caixa,
      })),
    },
    {
      nome: "Contas",
      linhas: contas.map((c) => ({
        Conta: c.nome,
        Banco: c.banco,
        Tipo: c.tipo,
        Saldo: c.saldo,
        "Conciliado até": c.conciliadoAte,
      })),
    },
    {
      nome: "Lancamentos",
      linhas: lancamentos.map((l) => ({
        Data: l.data,
        Descrição: l.descricao,
        Contraparte: l.contraparte,
        Categoria: l.categoria,
        "Centro de custo": l.centroCusto,
        Conta: l.conta,
        Método: l.metodo,
        Tipo: l.tipo,
        Valor: l.tipo === "saida" ? -l.valor : l.valor,
        Conciliado: l.conciliado ? "sim" : "não",
        Documento: l.documento,
      })),
    },
    {
      nome: "A receber",
      linhas: receber.map((r) => ({
        Cliente: r.cliente,
        Documento: r.documento,
        Descrição: r.descricao,
        Origem: r.origem,
        Vencimento: r.vencimento,
        Valor: r.valor,
        Status: r.status,
        Método: r.metodo,
        Parcela: r.parcela,
        NF: r.nf,
      })),
    },
    {
      nome: "A pagar",
      linhas: pagar.map((p) => ({
        Fornecedor: p.fornecedor,
        Descrição: p.descricao,
        Categoria: p.categoria,
        "Centro de custo": p.centroCusto,
        Vencimento: p.vencimento,
        Valor: p.valor,
        Status: p.status,
        Aprovação: p.aprovacao,
        Documento: p.documento,
      })),
    },
    {
      nome: "Aging",
      linhas: aging.map((a) => ({ Faixa: a.faixa, Valor: a.valor, Títulos: a.titulos })),
    },
    {
      nome: "Planos",
      linhas: planos.map((p) => ({
        Plano: p.nome,
        Público: p.publico,
        Preço: p.preco,
        Ciclo: p.ciclo,
        Assinantes: p.assinantes,
        MRR: p.mrr,
        "Churn (%)": p.churn,
        "Margem (%)": p.margem,
      })),
    },
    {
      nome: "Contratos",
      linhas: contratos.map((c) => ({
        Cliente: c.cliente,
        Plano: c.plano,
        Início: c.inicio,
        Fim: c.fim,
        "Valor mensal": Math.round(c.valorMensal),
        Faturamento: c.faturamento,
        Status: c.status,
        Responsável: c.responsavel,
      })),
    },
    {
      nome: "Comissoes",
      linhas: comissoes.map((c) => ({
        Beneficiário: c.beneficiario,
        Tipo: c.tipo,
        Competência: c.competencia,
        Base: c.baseCalculo,
        "%": c.percentual,
        Valor: c.valor,
        Emissões: c.emissoes,
        Status: c.status,
        Pagamento: c.pagamento,
      })),
    },
    {
      nome: "Centros de custo",
      linhas: centrosCusto.map((c) => ({
        "Centro de custo": c.nome,
        Orçado: c.orcado,
        Realizado: c.realizado,
        "Variação (%)": Math.round(((c.realizado - c.orcado) / c.orcado) * 1000) / 10,
      })),
    },
  ];
}

function FinanceiroBI() {
  const aReceber = receber.filter((r) => r.status !== "recebido").reduce((s, r) => s + r.valor, 0);
  const aPagar = pagar.filter((p) => p.status !== "pago").reduce((s, p) => s + p.valor, 0);
  const vencidos = pagar.filter((p) => p.status === "vencido");
  const atrasados = receber.filter((r) => r.status === "em atraso");
  const comissoesAbertas = comissoes
    .filter((c) => c.status !== "paga")
    .reduce((s, c) => s + c.valor, 0);

  return (
    <AppShell
      title="Financeiro"
      subtitle="Agosto de 2026 · competência aberta · atualizado há 8 minutos"
      actions={
        <>
          <ExportMenu datasets={datasets} base="certus-financeiro" label="Relatórios" />
          <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep">
            Novo lançamento
          </button>
        </>
      }
    >
      <FinanceTabs />

      <div className="space-y-4">
        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Metric
            label="Saldo consolidado"
            value={brl(indicadores.saldoTotal)}
            hint={`${contas.length} contas`}
          />
          <Metric
            label="Receita do mês"
            value={brl(indicadores.receitaMes)}
            delta={indicadores.receitaVar}
            hint="vs. julho"
          />
          <Metric
            label="Despesa do mês"
            value={brl(indicadores.despesaMes)}
            delta={indicadores.despesaVar}
            hint="vs. julho"
          />
          <Metric
            label="EBITDA"
            value={brl(indicadores.ebitda)}
            delta={indicadores.margemVar}
            hint={`margem ${indicadores.margemEbitda}%`}
          />
          <Metric
            label="MRR contratado"
            value={brl(indicadores.mrr)}
            delta={indicadores.mrrVar}
            hint="planos + contratos"
          />
          <Metric
            label="Inadimplência"
            value={`${indicadores.inadimplencia}%`}
            delta={indicadores.inadimplenciaVar}
            hint="carteira total"
          />
        </div>

        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Metric
            label="A receber em aberto"
            value={brl(aReceber)}
            hint={`${receber.length - 1} títulos`}
          />
          <Metric
            label="A pagar em aberto"
            value={brl(aPagar)}
            hint={`${vencidos.length} vencido(s)`}
          />
          <Metric
            label="Comissões a liquidar"
            value={brl(comissoesAbertas)}
            hint="competência 07/2026"
          />
          <Metric
            label="PMR / PMP"
            value={`${indicadores.prazoMedioRecebimento}/${indicadores.prazoMedioPagamento}d`}
            hint="ciclo financeiro"
          />
          <Metric
            label="Runway"
            value={`${indicadores.runwayMeses} meses`}
            hint="com caixa atual"
          />
          <Metric
            label="LTV / CAC"
            value={`${indicadores.ltvCac}x`}
            hint={`CAC ${brl(indicadores.cac)}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Receita, despesa e EBITDA"
            hint="Últimos 6 meses"
            actions={
              <Chip tone="blue">
                <TrendingUp className="size-3" /> margem +2,4 p.p.
              </Chip>
            }
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serieFinanceira} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    name="Receita"
                    dataKey="receita"
                    fill="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    name="Despesa"
                    dataKey="despesa"
                    fill="var(--color-chart-4)"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Line
                    name="EBITDA"
                    type="monotone"
                    dataKey="ebitda"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Projeção de caixa" hint="Saldo previsto em 60 dias">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projecaoCaixa} margin={{ left: -8, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="cx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="dia"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    fill="url(#cx)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Receita por linha" hint="Mix de faturamento no mês">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={receitaPorLinha}
                    dataKey="valor"
                    nameKey="linha"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {receitaPorLinha.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Despesas por grupo" hint="Composição do custo total">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={despesaPorGrupo} layout="vertical" margin={{ left: 26, right: 12 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="grupo"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={86}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => brl(v)}
                  />
                  <Bar
                    dataKey="valor"
                    fill="var(--color-chart-2)"
                    radius={[0, 4, 4, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Aging da carteira"
            hint="Recebíveis por faixa de atraso"
            bodyClassName="p-4"
          >
            <div className="space-y-3">
              {aging.map((a, i) => (
                <div key={a.faixa}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className={cn("text-muted-foreground", i > 1 && "text-alert")}>
                      {a.faixa}
                    </span>
                    <span className="tabular font-medium">{brl(a.valor)}</span>
                  </div>
                  <div className="mt-1.5">
                    <MiniBar value={(a.valor / 38_141) * 100} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{a.titulos} título(s)</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="DRE gerencial" hint="Competência de julho/2026" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {dre.map((d) => (
                    <tr
                      key={d.linha}
                      className={cn(
                        d.tipo === "subtotal" && "bg-muted/40 font-medium",
                        d.tipo === "resultado" &&
                          "bg-primary-soft/60 font-semibold text-primary-deep",
                      )}
                    >
                      <td className="px-4 py-2">{d.linha}</td>
                      <td
                        className={cn("px-4 py-2 text-right tabular", d.valor < 0 && "text-alert")}
                      >
                        {brlFull(d.valor)}
                      </td>
                      <td className="w-20 px-4 py-2 text-right text-xs text-muted-foreground tabular">
                        {Math.round((Math.abs(d.valor) / 259_400) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Orçado x realizado"
            hint="Centros de custo — mês corrente"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Centro de custo</th>
                    <th className="px-4 py-2 font-medium">Orçado</th>
                    <th className="px-4 py-2 font-medium">Realizado</th>
                    <th className="px-4 py-2 font-medium">Var.</th>
                    <th className="px-4 py-2 font-medium">Consumo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {centrosCusto.map((c) => {
                    const varPct = ((c.realizado - c.orcado) / c.orcado) * 100;
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-2.5">{c.nome}</td>
                        <td className="px-4 py-2.5 tabular">{brl(c.orcado)}</td>
                        <td className="px-4 py-2.5 tabular">{brl(c.realizado)}</td>
                        <td
                          className={cn(
                            "px-4 py-2.5 tabular",
                            varPct > 0 ? "text-alert" : "text-primary",
                          )}
                        >
                          {varPct > 0 ? "+" : ""}
                          {varPct.toFixed(1)}%
                        </td>
                        <td className="w-32 px-4 py-2.5">
                          <MiniBar value={(c.realizado / c.orcado) * 100} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Alertas financeiros"
            hint="Ações que impactam caixa nos próximos dias"
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {vencidos.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-alert-soft text-alert">
                    <TrendingDown className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Pagamento vencido — {p.fornecedor}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.descricao} · venceu em {dataBR(p.vencimento)}
                    </p>
                  </div>
                  <span className="tabular text-sm font-medium">{brl(p.valor)}</span>
                  <Link
                    to="/financeiro/pagar"
                    className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
                  >
                    Tratar
                  </Link>
                </li>
              ))}
              {atrasados.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-deep">
                    <Banknote className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Recebível em atraso — {r.cliente}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.descricao} · venceu em {dataBR(r.vencimento)}
                    </p>
                  </div>
                  <span className="tabular text-sm font-medium">{brl(r.valor)}</span>
                  <Link
                    to="/financeiro/receber"
                    className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
                  >
                    Cobrar
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Saldos por conta"
            hint="Posição bancária consolidada"
            actions={
              <Link
                to="/financeiro/caixa"
                className="text-xs font-medium text-primary hover:underline"
              >
                Abrir caixa
              </Link>
            }
          >
            <div className="space-y-3">
              {contas.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-deep">
                    <Wallet className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.nome}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{c.banco}</p>
                  </div>
                  <span className="tabular text-sm font-medium">{brl(c.saldo)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowUpRight className="size-3.5" /> Dados fictícios de demonstração. Exportações em CSV,
          XLSX, JSON e PDF.
        </p>
      </div>
    </AppShell>
  );
}
