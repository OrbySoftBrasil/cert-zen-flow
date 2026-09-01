import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Bot, FileText, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { NovaCobrancaButton } from "@/components/finance-dialogs";
import { ConfirmDialog } from "@/components/forms";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ExportMenu } from "@/components/export-menu";
import { FinanceTabs } from "@/components/finance-tabs";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import type { Dataset } from "@/lib/export";
import { aging, dataBR, diasAte } from "@/lib/finance-data";
import { brl } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro/receber")({
  head: () => ({
    meta: [
      { title: "Contas a receber — Certus AC" },
      {
        name: "description",
        content: "Recebíveis, régua de cobrança automática, aging da carteira e baixa de títulos por cliente.",
      },
      { property: "og:title", content: "Contas a receber — Certus AC" },
      { property: "og:description", content: "Recebíveis, cobrança e aging da carteira." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Receber,
});

const tone = {
  "em aberto": "neutral",
  recebido: "deep",
  "em atraso": "alert",
  negociado: "blue",
} as const;

const regua = [
  { etapa: "D−3", canal: "WhatsApp", mensagem: "Lembrete amigável com link de pagamento Pix", icone: MessageSquare },
  { etapa: "D+1", canal: "E-mail", mensagem: "Aviso de vencimento e 2ª via do boleto", icone: FileText },
  { etapa: "D+5", canal: "WhatsApp + IA", mensagem: "Negociação assistida com parcelamento em até 3x", icone: Bot },
  { etapa: "D+15", canal: "Telefone", mensagem: "Contato do gestor da conta e proposta de acordo", icone: BellRing },
  { etapa: "D+30", canal: "Automático", mensagem: "Suspensão de emissões e envio para cobrança externa", icone: BellRing },
];

function Receber() {
  const { receber, updateReceber } = useStore();
  const [status, setStatus] = useState("todos");
  const [cobrados, setCobrados] = useState<string[]>([]);
  const [confirmar, setConfirmar] = useState<{ id: string; cliente: string; valor: number } | null>(null);
  const baixados = receber.filter((r) => r.status === "recebido").map((r) => r.id);

  const lista = receber.filter((r) => status === "todos" || (baixados.includes(r.id) ? "recebido" : r.status) === status);
  const emAberto = receber.filter((r) => r.status !== "recebido" && !baixados.includes(r.id));
  const atraso = receber.filter((r) => r.status === "em atraso" && !baixados.includes(r.id));

  const datasets = (): Dataset[] => [
    {
      nome: "A receber",
      linhas: lista.map((r) => ({
        Cliente: r.cliente,
        Documento: r.documento,
        Descrição: r.descricao,
        Origem: r.origem,
        Emissão: r.emissao,
        Vencimento: r.vencimento,
        Valor: r.valor,
        Status: baixados.includes(r.id) ? "recebido" : r.status,
        Método: r.metodo,
        Parcela: r.parcela,
        NF: r.nf,
      })),
    },
    { nome: "Aging", linhas: aging.map((a) => ({ Faixa: a.faixa, Valor: a.valor, Títulos: a.titulos })) },
  ];

  return (
    <AppShell
      title="Contas a receber"
      subtitle="Recebíveis, régua de cobrança e inadimplência"
      actions={
        <>
          <ExportMenu datasets={datasets} base="certus-a-receber" label="Relatórios" />
          <NovaCobrancaButton />
        </>
      }
    >
      <FinanceTabs />

      <div className="space-y-4">
        <div className="flex flex-wrap divide-border rounded-lg border border-border bg-card">
          <Metric label="Carteira em aberto" value={brl(emAberto.reduce((s, r) => s + r.valor, 0))} hint={`${emAberto.length} títulos`} />
          <Metric label="Em atraso" value={brl(atraso.reduce((s, r) => s + r.valor, 0))} hint={`${atraso.length} títulos`} />
          <Metric label="Recebido no mês" value={brl(214_800)} delta={7.9} hint="liquidações confirmadas" />
          <Metric label="Prazo médio (PMR)" value="21 dias" delta={-1.4} hint="meta 20 dias" />
          <Metric label="Recuperação de crédito" value="68%" delta={5.2} hint="régua automática" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Aging da carteira" hint="Distribuição por faixa de atraso">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aging} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="faixa" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }}
                    formatter={(v: number) => brl(v)}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={38}>
                    {aging.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "var(--color-chart-2)" : "var(--color-chart-4)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Régua de cobrança" hint="Automação por dias de vencimento">
            <ol className="space-y-3">
              {regua.map((r) => (
                <li key={r.etapa} className="flex gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-deep">
                    <r.icone className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {r.etapa} · <span className="text-muted-foreground">{r.canal}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">{r.mensagem}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <Panel
          title="Títulos a receber"
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
              <option value="em atraso">Em atraso</option>
              <option value="negociado">Negociado</option>
              <option value="recebido">Recebido</option>
            </select>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Origem</th>
                  <th className="px-4 py-2 font-medium">Vencimento</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                  <th className="px-4 py-2 font-medium">Método</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...lista]
                  .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
                  .map((r) => {
                    const recebido = r.status === "recebido" || baixados.includes(r.id);
                    const dias = diasAte(r.vencimento);
                    return (
                      <tr key={r.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-2.5">
                          <span className="block font-medium">{r.cliente}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {r.descricao} · {r.nf} · parcela {r.parcela}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{r.origem}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular">
                          {dataBR(r.vencimento)}
                          <span className={cn("ml-1.5 text-[11px]", dias < 0 ? "text-alert" : "text-muted-foreground")}>
                            {dias < 0 ? `${Math.abs(dias)}d atraso` : `em ${dias}d`}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular font-medium">{brl(r.valor)}</td>
                        <td className="px-4 py-2.5">
                          <Chip>{r.metodo}</Chip>
                        </td>
                        <td className="px-4 py-2.5">
                          <Chip tone={recebido ? "deep" : tone[r.status]}>{recebido ? "recebido" : r.status}</Chip>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          {recebido ? (
                            <span className="text-xs text-muted-foreground">liquidado</span>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setConfirmar({ id: r.id, cliente: r.cliente, valor: r.valor })}
                                className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
                              >
                                Baixar
                              </button>
                              <button
                                onClick={() => {
                                  setCobrados((v) => [...v, r.id]);
                                  toast.success("Cobrança enviada", {
                                    description: `${r.cliente} · link de pagamento por WhatsApp e e-mail`,
                                  });
                                }}
                                className={cn(
                                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                                  cobrados.includes(r.id)
                                    ? "bg-primary-soft text-primary-deep"
                                    : "border border-border hover:border-border-strong",
                                )}
                              >
                                {cobrados.includes(r.id) ? "Cobrança enviada" : "Cobrar"}
                              </button>
                            </div>
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
      <ConfirmDialog
        open={!!confirmar}
        title="Dar baixa no título"
        {...(confirmar ? { descricao: `${confirmar.cliente} · ${brl(confirmar.valor)}` } : {})}
        confirmLabel="Confirmar baixa"
        onCancel={() => setConfirmar(null)}
        onConfirm={() => {
          if (!confirmar) return;
          updateReceber(confirmar.id, { status: "recebido" });
          toast.success("Título liquidado", { description: `${confirmar.cliente} · ${brl(confirmar.valor)}` });
          setConfirmar(null);
        }}
      />
    </AppShell>
  );
}
