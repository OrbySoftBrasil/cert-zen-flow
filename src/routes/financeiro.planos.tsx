import { createFileRoute } from "@tanstack/react-router";
import { Check, Pencil, Repeat, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { ExportMenu } from "@/components/export-menu";
import { FinanceTabs } from "@/components/finance-tabs";
import { Bar as MiniBar, Chip, Metric, Panel } from "@/components/ui-kit";
import type { Dataset } from "@/lib/export";
import { brlFull, dataBR, diasAte } from "@/lib/finance-data";
import { brl } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { NovoContratoButton, NovoPlanoDialog } from "@/components/finance-dialogs";
import { ConfirmDialog } from "@/components/forms";
import { Paginacao, usePaginacao } from "@/components/pagination";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/financeiro/planos")({
  head: () => ({
    meta: [
      { title: "Planos e contratos — Certus AC" },
      {
        name: "description",
        content:
          "Catálogo de planos e pacotes de certificados, MRR por produto, churn e gestão de contratos recorrentes.",
      },
      { property: "og:title", content: "Planos e contratos — Certus AC" },
      { property: "og:description", content: "Pacotes, assinaturas, MRR e contratos vigentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planos,
});

const statusTone = {
  ativo: "blue",
  "em renovação": "neutral",
  inadimplente: "alert",
  encerrado: "outline",
} as const;

function Planos() {
  const { planos, contratos, removePlano, updateContrato } = useStore();
  const [aba, setAba] = useState<"planos" | "contratos">("planos");
  const [editar, setEditar] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [excluir, setExcluir] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativo" | "em renovação" | "inadimplente" | "encerrado"
  >("todos");
  const contratosFiltrados = contratos.filter(
    (c) => filtroStatus === "todos" || c.status === filtroStatus,
  );
  const pag = usePaginacao(contratosFiltrados, 10);
  const mrrTotal = planos.reduce((s, p) => s + p.mrr, 0);
  const assinantes = planos.reduce((s, p) => s + p.assinantes, 0);
  const churnMedio = planos.reduce((s, p) => s + p.churn * p.assinantes, 0) / assinantes;

  const datasets = (): Dataset[] => [
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
        Inclui: p.inclui.join(" | "),
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
        Reajuste: c.reajuste,
        Faturamento: c.faturamento,
        Status: c.status,
        Responsável: c.responsavel,
        "Consumo (%)": c.consumo,
      })),
    },
  ];

  return (
    <AppShell
      title="Planos e contratos"
      subtitle="Pacotes, assinaturas recorrentes e contratos corporativos"
      actions={
        <>
          <ExportMenu datasets={datasets} base="certus-planos" label="Relatórios" />
          <NovoContratoButton />
          <button
            onClick={() => setNovo(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
          >
            Novo plano
          </button>
        </>
      }
    >
      <FinanceTabs />

      <div className="space-y-4">
        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Metric label="MRR total" value={brl(mrrTotal)} delta={4.8} hint="receita recorrente" />
          <Metric label="ARR projetado" value={brl(mrrTotal * 12)} delta={5.3} hint="12 meses" />
          <Metric
            label="Assinantes ativos"
            value={String(assinantes)}
            delta={3.1}
            hint="todos os planos"
          />
          <Metric
            label="Churn ponderado"
            value={`${churnMedio.toFixed(1)}%`}
            delta={-0.7}
            hint="mensal"
          />
          <Metric
            label="Contratos vigentes"
            value={String(contratos.filter((c) => c.status !== "encerrado").length)}
            hint={`${contratos.filter((c) => c.status === "em renovação").length} em renovação`}
          />
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 print:hidden">
          {(["planos", "contratos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                aba === t
                  ? "bg-primary-soft font-medium text-primary-deep"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t === "planos" ? "Catálogo de planos" : "Contratos ativos"}
            </button>
          ))}
        </div>

        {aba === "planos" ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {planos.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-col rounded-lg border bg-card p-4",
                    p.destaque ? "border-primary" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold">{p.nome}</h3>
                      <p className="text-xs text-muted-foreground">{p.publico}</p>
                    </div>
                    {p.destaque && (
                      <Chip tone="deep">
                        <Sparkles className="size-3" /> mais vendido
                      </Chip>
                    )}
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold tabular">
                    {p.preco === 0 ? "Sem mensalidade" : brlFull(p.preco)}
                    {p.preco > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        /{p.ciclo === "pacote" ? "pacote" : p.ciclo === "anual" ? "ano" : "mês"}
                      </span>
                    )}
                  </p>
                  <ul className="mt-3 flex-1 space-y-1.5">
                    {p.inclui.map((i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                        {i}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Assinantes</p>
                      <p className="tabular text-sm font-medium">{p.assinantes}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">MRR</p>
                      <p className="tabular text-sm font-medium">{brl(p.mrr)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Churn</p>
                      <p className={cn("tabular text-sm font-medium", p.churn > 6 && "text-alert")}>
                        {p.churn}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="mb-1 text-[11px] text-muted-foreground">
                      Margem de contribuição · {p.margem}%
                    </p>
                    <MiniBar value={p.margem} />
                  </div>
                  <div className="mt-3 flex gap-2 print:hidden">
                    <button
                      onClick={() => setEditar(p.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
                    >
                      <Pencil className="size-3" /> Editar
                    </button>
                    <button
                      onClick={() => setExcluir(p.id)}
                      aria-label={`Excluir ${p.nome}`}
                      className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-alert hover:text-alert"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Panel title="MRR por plano" hint="Contribuição de cada produto na recorrência">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planos} margin={{ left: -8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis
                      dataKey="nome"
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
                    <Tooltip
                      cursor={{ fill: "var(--color-muted)" }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-card)",
                        fontSize: 12,
                      }}
                      formatter={(v: number) => brl(v)}
                    />
                    <Bar
                      dataKey="mrr"
                      fill="var(--color-chart-2)"
                      radius={[4, 4, 0, 0]}
                      barSize={34}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </>
        ) : (
          <Panel
            title="Contratos"
            hint="Vigência, faturamento e consumo do escopo"
            bodyClassName="p-0"
            actions={
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value as typeof filtroStatus);
                  pag.setPagina(1);
                }}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs print:hidden"
              >
                <option value="todos">Todos os status</option>
                {["ativo", "em renovação", "inadimplente", "encerrado"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Plano</th>
                    <th className="px-4 py-2 font-medium">Vigência</th>
                    <th className="px-4 py-2 text-right font-medium">Mensal</th>
                    <th className="px-4 py-2 font-medium">Faturamento</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Consumo</th>
                    <th className="px-4 py-2 font-medium print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pag.visiveis.map((c) => {
                    const dias = diasAte(c.fim);
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-2.5">
                          <span className="block font-medium">{c.cliente}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {c.responsavel} · {c.reajuste}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{c.plano}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular">
                          {dataBR(c.inicio)} → {dataBR(c.fim)}
                          <span
                            className={cn(
                              "ml-1.5 text-[11px]",
                              dias < 30 ? "text-alert" : "text-muted-foreground",
                            )}
                          >
                            {dias < 0 ? "vencido" : `${dias}d`}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular font-medium">
                          {brl(c.valorMensal)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Chip>
                            <Repeat className="size-3" /> {c.faturamento}
                          </Chip>
                        </td>
                        <td className="px-4 py-2.5">
                          <Chip tone={statusTone[c.status]}>{c.status}</Chip>
                        </td>
                        <td className="w-36 px-4 py-2.5">
                          <MiniBar value={c.consumo} />
                          <span className="mt-1 block text-[11px] text-muted-foreground tabular">
                            {c.consumo}% do escopo
                          </span>
                        </td>
                        <td className="px-4 py-2.5 print:hidden">
                          <select
                            value={c.status}
                            onChange={(e) => {
                              updateContrato(c.id, { status: e.target.value as typeof c.status });
                              toast.success("Contrato atualizado", {
                                description: `${c.cliente} · ${e.target.value}`,
                              });
                            }}
                            className="rounded-md border border-border bg-card px-2 py-1 text-xs"
                          >
                            {["ativo", "em renovação", "inadimplente", "encerrado"].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginacao {...pag} rotulo="contratos" className="border-t border-border px-4 py-2" />
          </Panel>
        )}
      </div>

      {novo && <NovoPlanoDialog open onClose={() => setNovo(false)} />}
      {editar && <NovoPlanoDialog open onClose={() => setEditar(null)} planoId={editar} />}
      <ConfirmDialog
        open={!!excluir}
        title="Excluir plano"
        descricao="O plano sai do catálogo. Contratos existentes não são alterados."
        confirmLabel="Excluir"
        destructive
        onCancel={() => setExcluir(null)}
        onConfirm={() => {
          if (excluir) removePlano(excluir);
          setExcluir(null);
          toast.success("Plano excluído do catálogo");
        }}
      />
    </AppShell>
  );
}
