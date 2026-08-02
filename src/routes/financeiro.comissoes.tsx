import { createFileRoute } from "@tanstack/react-router";
import { Percent, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { ExportMenu } from "@/components/export-menu";
import { FinanceTabs } from "@/components/finance-tabs";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import type { Dataset } from "@/lib/export";
import { comissoes, dataBR, regrasComissao } from "@/lib/finance-data";
import { brl } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro/comissoes")({
  head: () => ({
    meta: [
      { title: "Comissões — Certus AC" },
      {
        name: "description",
        content: "Apuração de comissões de parceiros contábeis, revendas e vendedores internos, com regras, retenções e pagamentos.",
      },
      { property: "og:title", content: "Comissões — Certus AC" },
      { property: "og:description", content: "Apuração, aprovação e pagamento de comissões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Comissoes,
});

const tone = {
  prevista: "outline",
  apurada: "neutral",
  aprovada: "blue",
  paga: "deep",
  retida: "alert",
} as const;

function Comissoes() {
  const [competencia, setCompetencia] = useState("07/2026");
  const [pagas, setPagas] = useState<string[]>([]);

  const lista = comissoes.filter((c) => competencia === "todas" || c.competencia === competencia);
  const total = lista.reduce((s, c) => s + c.valor, 0);
  const aPagar = lista.filter((c) => c.status !== "paga" && !pagas.includes(c.id)).reduce((s, c) => s + c.valor, 0);
  const retidas = lista.filter((c) => c.status === "retida");

  const porTipo = ["Parceiro contábil", "Vendedor interno", "Revenda", "Indicação"].map((t) => ({
    tipo: t,
    valor: lista.filter((c) => c.tipo === t).reduce((s, c) => s + c.valor, 0),
  }));

  const datasets = (): Dataset[] => [
    {
      nome: "Comissoes",
      linhas: lista.map((c) => ({
        Beneficiário: c.beneficiario,
        Tipo: c.tipo,
        Competência: c.competencia,
        "Base de cálculo": c.baseCalculo,
        "Percentual (%)": c.percentual,
        Valor: c.valor,
        Emissões: c.emissoes,
        Status: pagas.includes(c.id) ? "paga" : c.status,
        Pagamento: c.pagamento,
      })),
    },
    {
      nome: "Regras",
      linhas: regrasComissao.map((r) => ({ Regra: r.nome, Cálculo: r.regra, Gatilho: r.gatilho, Carência: r.carencia, Teto: r.teto })),
    },
    { nome: "Por tipo", linhas: porTipo.map((p) => ({ Tipo: p.tipo, Valor: p.valor })) },
  ];

  return (
    <AppShell
      title="Comissões"
      subtitle="Apuração por parceiro, revenda e time comercial"
      actions={
        <>
          <ExportMenu datasets={datasets} base="certus-comissoes" label="Relatórios" />
          <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep">
            Fechar competência
          </button>
        </>
      }
    >
      <FinanceTabs />

      <div className="space-y-4">
        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Metric label="Comissões apuradas" value={brl(total)} delta={6.2} hint={`competência ${competencia}`} />
          <Metric label="A liquidar" value={brl(aPagar)} hint={`${lista.filter((c) => c.status !== "paga" && !pagas.includes(c.id)).length} beneficiários`} />
          <Metric label="Retidas" value={brl(retidas.reduce((s, c) => s + c.valor, 0))} hint="estorno ou revogação" />
          <Metric label="Emissões comissionadas" value={String(lista.reduce((s, c) => s + c.emissoes, 0))} hint="no período" />
          <Metric
            label="% sobre a receita"
            value={`${((total / 259_400) * 100).toFixed(1)}%`}
            hint="custo de aquisição indireto"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Comissão por tipo de canal" hint="Distribuição do custo comercial">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porTipo} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="tipo" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }}
                    formatter={(v: number) => brl(v)}
                  />
                  <Bar dataKey="valor" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Regras vigentes" hint="Política de comissionamento">
            <ul className="space-y-3">
              {regrasComissao.map((r) => (
                <li key={r.id} className="flex gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-deep">
                    {r.nome === "Estorno" ? <ShieldAlert className="size-3.5" /> : <Percent className="size-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{r.regra}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Gatilho: {r.gatilho} · Carência: {r.carencia} · Teto: {r.teto}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          title="Apuração"
          hint="Base de cálculo, percentual e status de pagamento"
          bodyClassName="p-0"
          actions={
            <select
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs print:hidden"
            >
              <option value="todas">Todas as competências</option>
              <option value="08/2026">08/2026</option>
              <option value="07/2026">07/2026</option>
              <option value="06/2026">06/2026</option>
            </select>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Beneficiário</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 text-right font-medium">Base</th>
                <th className="px-4 py-2 text-right font-medium">%</th>
                <th className="px-4 py-2 text-right font-medium">Comissão</th>
                <th className="px-4 py-2 font-medium">Pagamento</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((c) => {
                const paga = c.status === "paga" || pagas.includes(c.id);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <span className="block font-medium">{c.beneficiario}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {c.emissoes} emissões · {c.competencia}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.tipo}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular">{brl(c.baseCalculo)}</td>
                    <td className="px-4 py-2.5 text-right tabular">{c.percentual}%</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular font-medium">{brl(c.valor)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular text-muted-foreground">{dataBR(c.pagamento)}</td>
                    <td className="px-4 py-2.5">
                      <Chip tone={paga ? "deep" : tone[c.status]}>{paga ? "paga" : c.status}</Chip>
                    </td>
                    <td className="px-4 py-2.5">
                      {paga || c.status === "retida" ? (
                        <span className={cn("text-xs", c.status === "retida" ? "text-alert" : "text-muted-foreground")}>
                          {c.status === "retida" ? "em análise" : "liquidada"}
                        </span>
                      ) : (
                        <button
                          onClick={() => setPagas((v) => [...v, c.id])}
                          className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
                        >
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}
