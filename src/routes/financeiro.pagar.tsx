import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { NovaDespesaButton } from "@/components/finance-dialogs";
import { ConfirmDialog } from "@/components/forms";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ExportMenu } from "@/components/export-menu";
import { FinanceTabs } from "@/components/finance-tabs";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import type { Dataset } from "@/lib/export";
import { dataBR, diasAte } from "@/lib/finance-data";
import { brl } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro/pagar")({
  head: () => ({
    meta: [
      { title: "Contas a pagar — Certus AC" },
      {
        name: "description",
        content:
          "Títulos a pagar, aprovações, agendamentos e calendário de vencimentos por fornecedor e centro de custo.",
      },
      { property: "og:title", content: "Contas a pagar — Certus AC" },
      { property: "og:description", content: "Aprovação, agendamento e liquidação de títulos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagar,
});

const statusTone = {
  "em aberto": "neutral",
  agendado: "blue",
  pago: "deep",
  vencido: "alert",
} as const;

function Pagar() {
  const { pagar, updatePagar } = useStore();
  const [status, setStatus] = useState("todos");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [confirmar, setConfirmar] = useState<{ ids: string[]; total: number } | null>(null);
  const pagos = pagar.filter((p) => p.status === "pago").map((p) => p.id);

  function liquidar(ids: string[]) {
    ids.forEach((id) => updatePagar(id, { status: "pago", aprovacao: "aprovado" }));
    toast.success(ids.length > 1 ? `${ids.length} títulos liquidados` : "Título liquidado", {
      description: "Movimento lançado no caixa e na trilha de auditoria.",
    });
    setSelecionados([]);
    setConfirmar(null);
  }

  const lista = pagar.filter(
    (p) => status === "todos" || (pagos.includes(p.id) ? "pago" : p.status) === status,
  );
  const total = pagar
    .filter((p) => p.status !== "pago" && !pagos.includes(p.id))
    .reduce((s, p) => s + p.valor, 0);
  const vencidos = pagar.filter((p) => p.status === "vencido" && !pagos.includes(p.id));
  const semana = pagar.filter((p) => diasAte(p.vencimento) >= 0 && diasAte(p.vencimento) <= 7);
  const aprovacao = pagar.filter((p) => p.aprovacao === "pendente");
  const selecionadoTotal = pagar
    .filter((p) => selecionados.includes(p.id))
    .reduce((s, p) => s + p.valor, 0);

  const datasets = (): Dataset[] => [
    {
      nome: "A pagar",
      linhas: lista.map((p) => ({
        Fornecedor: p.fornecedor,
        Descrição: p.descricao,
        Categoria: p.categoria,
        "Centro de custo": p.centroCusto,
        Emissão: p.emissao,
        Vencimento: p.vencimento,
        Valor: p.valor,
        Status: pagos.includes(p.id) ? "pago" : p.status,
        Método: p.metodo,
        Recorrente: p.recorrente ? "sim" : "não",
        Aprovação: p.aprovacao,
        Documento: p.documento,
      })),
    },
  ];

  return (
    <AppShell
      title="Contas a pagar"
      subtitle="Aprovação, agendamento e liquidação de títulos"
      actions={
        <>
          <ExportMenu datasets={datasets} base="certus-a-pagar" label="Relatórios" />
          <NovaDespesaButton />
        </>
      }
    >
      <FinanceTabs />

      <div className="space-y-4">
        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Metric
            label="Total em aberto"
            value={brl(total)}
            hint={`${pagar.length - pagos.length} títulos`}
          />
          <Metric
            label="Vence em 7 dias"
            value={brl(semana.reduce((s, p) => s + p.valor, 0))}
            hint={`${semana.length} títulos`}
          />
          <Metric
            label="Vencidos"
            value={brl(vencidos.reduce((s, p) => s + p.valor, 0))}
            hint={`${vencidos.length} títulos`}
          />
          <Metric
            label="Aguardando aprovação"
            value={String(aprovacao.length)}
            hint={brl(aprovacao.reduce((s, p) => s + p.valor, 0))}
          />
          <Metric
            label="Recorrentes"
            value={String(pagar.filter((p) => p.recorrente).length)}
            hint="contratos fixos"
          />
        </div>

        {selecionados.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/40 bg-primary-soft px-4 py-3 text-sm print:hidden">
            <span className="font-medium text-primary-deep">
              {selecionados.length} título(s) selecionado(s) · {brl(selecionadoTotal)}
            </span>
            <button
              onClick={() => setConfirmar({ ids: selecionados, total: selecionadoTotal })}
              className="ml-auto rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              Gerar lote de pagamento
            </button>
            <button
              onClick={() => setSelecionados([])}
              className="rounded-md border border-border-strong px-3 py-1.5 text-xs transition-colors hover:bg-card"
            >
              Limpar
            </button>
          </div>
        )}

        <Panel
          title="Títulos a pagar"
          hint="Ordenados por vencimento"
          bodyClassName="p-0"
          actions={
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs print:hidden"
            >
              <option value="todos">Todos os status</option>
              <option value="em aberto">Em aberto</option>
              <option value="agendado">Agendado</option>
              <option value="vencido">Vencido</option>
              <option value="pago">Pago</option>
            </select>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-8 px-4 py-2" />
                  <th className="px-4 py-2 font-medium">Fornecedor</th>
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 font-medium">Vencimento</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Aprovação</th>
                  <th className="px-4 py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...lista]
                  .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
                  .map((p) => {
                    const pago = p.status === "pago" || pagos.includes(p.id);
                    const dias = diasAte(p.vencimento);
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-2.5">
                          {!pago && (
                            <input
                              type="checkbox"
                              checked={selecionados.includes(p.id)}
                              onChange={(e) =>
                                setSelecionados((v) =>
                                  e.target.checked ? [...v, p.id] : v.filter((i) => i !== p.id),
                                )
                              }
                              className="size-3.5 accent-[var(--color-primary)]"
                            />
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="block font-medium">{p.fornecedor}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {p.descricao} · {p.documento}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          <span className="block">{p.categoria}</span>
                          <span className="block text-[11px]">{p.centroCusto}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular">
                          {dataBR(p.vencimento)}
                          <span
                            className={cn(
                              "ml-1.5 text-[11px]",
                              dias < 0 ? "text-alert" : "text-muted-foreground",
                            )}
                          >
                            {dias < 0 ? `${Math.abs(dias)}d atraso` : `em ${dias}d`}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular font-medium">
                          {brl(p.valor)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Chip tone={pago ? "deep" : statusTone[p.status]}>
                            {pago ? "pago" : p.status}
                          </Chip>
                        </td>
                        <td className="px-4 py-2.5">
                          {p.aprovacao === "pendente" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-alert">
                              <AlertTriangle className="size-3.5" /> pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle2 className="size-3.5 text-primary" /> aprovado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {pago ? (
                            <span className="text-xs text-muted-foreground">liquidado</span>
                          ) : (
                            <button
                              onClick={() => setConfirmar({ ids: [p.id], total: p.valor })}
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
          </div>
        </Panel>

        <Panel title="Calendário de desembolso" hint="Próximos 30 dias por semana">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((w) => {
              const itens = pagar.filter((p) => {
                const d = diasAte(p.vencimento);
                return d >= w * 7 && d < (w + 1) * 7;
              });
              const soma = itens.reduce((s, p) => s + p.valor, 0);
              return (
                <div key={w} className="rounded-lg border border-border p-3">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                    <CalendarClock className="size-3.5" /> Semana {w + 1}
                  </p>
                  <p className="mt-1.5 font-display text-lg font-semibold tabular">{brl(soma)}</p>
                  <ul className="mt-2 space-y-1">
                    {itens.map((p) => (
                      <li key={p.id} className="truncate text-[11px] text-muted-foreground">
                        {dataBR(p.vencimento)} · {p.fornecedor}
                      </li>
                    ))}
                    {itens.length === 0 && (
                      <li className="text-[11px] text-muted-foreground">Sem títulos</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      <ConfirmDialog
        open={!!confirmar}
        title={
          confirmar && confirmar.ids.length > 1 ? "Gerar lote de pagamento" : "Liquidar título"
        }
        {...(confirmar
          ? { descricao: `${confirmar.ids.length} título(s) · ${brl(confirmar.total)}` }
          : {})}
        confirmLabel="Confirmar pagamento"
        onCancel={() => setConfirmar(null)}
        onConfirm={() => confirmar && liquidar(confirmar.ids)}
      />
    </AppShell>
  );
}
