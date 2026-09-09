import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Circle, Wallet } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { ExportMenu } from "@/components/export-menu";
import { FinanceTabs } from "@/components/finance-tabs";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import type { Dataset } from "@/lib/export";
import { contas, dataBR, lancamentos, projecaoCaixa } from "@/lib/finance-data";
import { brl } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro/caixa")({
  head: () => ({
    meta: [
      { title: "Caixa e bancos — Certus AC" },
      {
        name: "description",
        content:
          "Fluxo de caixa diário, saldos por conta, conciliação bancária e projeção de saldo da autoridade certificadora.",
      },
      { property: "og:title", content: "Caixa e bancos — Certus AC" },
      { property: "og:description", content: "Movimentações, conciliação e projeção de caixa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Caixa,
});

function Caixa() {
  const [conta, setConta] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [conciliados, setConciliados] = useState<string[]>([]);

  const filtrados = lancamentos.filter(
    (l) => (conta === "todas" || l.conta === conta) && (tipo === "todos" || l.tipo === tipo),
  );
  const entradas = filtrados.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
  const saidas = filtrados.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
  const pendentes = lancamentos.filter((l) => !l.conciliado && !conciliados.includes(l.id));

  const datasets = (): Dataset[] => [
    {
      nome: "Lancamentos",
      linhas: filtrados.map((l) => ({
        Data: l.data,
        Descrição: l.descricao,
        Contraparte: l.contraparte,
        Categoria: l.categoria,
        "Centro de custo": l.centroCusto,
        Conta: l.conta,
        Método: l.metodo,
        Tipo: l.tipo,
        Valor: l.tipo === "saida" ? -l.valor : l.valor,
        Conciliado: l.conciliado || conciliados.includes(l.id) ? "sim" : "não",
        Documento: l.documento,
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
      nome: "Projecao",
      linhas: projecaoCaixa.map((p) => ({
        Horizonte: p.dia,
        Saldo: p.saldo,
        Entradas: p.entradas,
        Saídas: p.saidas,
      })),
    },
  ];

  return (
    <AppShell
      title="Caixa e bancos"
      subtitle="Movimentações, conciliação e projeção de saldo"
      actions={
        <>
          <ExportMenu datasets={datasets} base="certus-caixa" label="Relatórios" />
          <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep">
            Lançar movimento
          </button>
        </>
      }
    >
      <FinanceTabs />

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {contas.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary-deep">
                  <Wallet className="size-3.5" />
                </span>
                <p className="truncate text-sm font-medium">{c.nome}</p>
              </div>
              <p className="mt-2 font-display text-xl font-semibold tabular">{brl(c.saldo)}</p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{c.banco}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Conciliado até {dataBR(c.conciliadoAte)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Metric
            label="Entradas no período"
            value={brl(entradas)}
            hint={`${filtrados.filter((l) => l.tipo === "entrada").length} lançamentos`}
          />
          <Metric
            label="Saídas no período"
            value={brl(saidas)}
            hint={`${filtrados.filter((l) => l.tipo === "saida").length} lançamentos`}
          />
          <Metric
            label="Resultado de caixa"
            value={brl(entradas - saidas)}
            hint="entradas − saídas"
          />
          <Metric
            label="Pendentes de conciliação"
            value={String(pendentes.length)}
            hint="exigem checagem"
          />
        </div>

        <Panel title="Projeção de saldo" hint="Cenário base com títulos em aberto">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projecaoCaixa} margin={{ left: -8, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="cxp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="dia"
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
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => brl(v)}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fill="url(#cxp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Extrato de movimentações"
          hint="Livro caixa consolidado"
          bodyClassName="p-0"
          actions={
            <div className="flex flex-wrap gap-2 print:hidden">
              <select
                value={conta}
                onChange={(e) => setConta(e.target.value)}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs"
              >
                <option value="todas">Todas as contas</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs"
              >
                <option value="todos">Entradas e saídas</option>
                <option value="entrada">Somente entradas</option>
                <option value="saida">Somente saídas</option>
              </select>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Descrição</th>
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 font-medium">Conta</th>
                  <th className="px-4 py-2 font-medium">Método</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                  <th className="px-4 py-2 font-medium">Conciliação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.map((l) => {
                  const ok = l.conciliado || conciliados.includes(l.id);
                  return (
                    <tr key={l.id} className="transition-colors hover:bg-muted/50">
                      <td className="whitespace-nowrap px-4 py-2.5 tabular text-muted-foreground">
                        {dataBR(l.data)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded",
                              l.tipo === "entrada"
                                ? "bg-primary-soft text-primary-deep"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {l.tipo === "entrada" ? (
                              <ArrowDownLeft className="size-3.5" />
                            ) : (
                              <ArrowUpRight className="size-3.5" />
                            )}
                          </span>
                          <span>
                            <span className="block">{l.descricao}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {l.contraparte} · {l.documento}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{l.categoria}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{l.conta}</td>
                      <td className="px-4 py-2.5">
                        <Chip>{l.metodo}</Chip>
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-2.5 text-right tabular font-medium",
                          l.tipo === "saida" && "text-alert",
                        )}
                      >
                        {l.tipo === "saida" ? "−" : "+"}
                        {brl(l.valor)}
                      </td>
                      <td className="px-4 py-2.5">
                        {ok ? (
                          <span className="inline-flex items-center gap-1 text-xs text-primary">
                            <CheckCircle2 className="size-3.5" /> conciliado
                          </span>
                        ) : (
                          <button
                            onClick={() => setConciliados((v) => [...v, l.id])}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-border-strong"
                          >
                            <Circle className="size-3" /> conciliar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
