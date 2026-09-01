import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { KpiCard, Spark, StatusDot } from "@/components/admin-kit";
import { Paginacao, usePaginacao } from "@/components/pagination";
import { Chip, Panel } from "@/components/ui-kit";
import { integracoes, moeda, numero, rotuloPlano } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/faturamento")({
  head: () => ({
    meta: [
      { title: "Faturamento SaaS — receita por tenant | Admin Center" },
      { name: "description", content: "MRR, ARR, churn, expansão, custo de infraestrutura e faturas por tenant com exportação em CSV, XLSX e PDF." },
      { property: "og:title", content: "Faturamento SaaS — receita por tenant" },
      { property: "og:description", content: "MRR, ARR, churn, margem e faturas por tenant do SaaS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaturamentoPage,
});

function FaturamentoPage() {
  const { tenants, planos } = useAdmin();
  const [filtro, setFiltro] = useState<"todas" | "aberta" | "vencida" | "paga">("todas");

  const mrr = tenants.reduce((s, t) => s + (t.status === "ativo" ? t.mrr : 0), 0);
  const custo = integracoes.reduce((s, i) => s + i.custoMes, 0) + 4200;
  const serie = tenants[0]?.serie.map((_, i) => tenants.reduce((s, t) => s + (t.serie[i]?.mrr ?? 0), 0)) ?? [];

  const faturas = useMemo(
    () =>
      tenants
        .flatMap((t) => t.faturas.map((f) => ({ ...f, tenant: t.nome, plano: rotuloPlano[t.plano], tenantId: t.id })))
        .filter((f) => filtro === "todas" || f.status === filtro)
        .sort((a, b) => (a.status === "vencida" ? -1 : 1)),
    [tenants, filtro],
  );

  const pag = usePaginacao(faturas, 10);
  const aReceber = faturas.filter((f) => f.status !== "paga").reduce((s, f) => s + f.valor, 0);
  const vencido = faturas.filter((f) => f.status === "vencida").reduce((s, f) => s + f.valor, 0);

  const porPlano = planos.map((p) => ({
    plano: p.nome,
    clientes: tenants.filter((t) => t.plano === p.id && t.status === "ativo").length,
    receita: tenants.filter((t) => t.plano === p.id && t.status === "ativo").reduce((s, t) => s + t.mrr, 0),
  }));

  return (
    <AdminShell
      title="Faturamento SaaS"
      subtitle="Receita recorrente, margem por tenant e cobrança da plataforma"
      actions={
        <ExportMenu
          base="admin-faturamento"
          datasets={() => [
            { nome: "Faturas", linhas: faturas.map((f) => ({ Tenant: f.tenant, Plano: f.plano, Competência: f.competencia, Vencimento: f.vencimento, Valor: f.valor, Status: f.status })) },
            { nome: "Receita por plano", linhas: porPlano.map((p) => ({ Plano: p.plano, Clientes: p.clientes, MRR: p.receita })) },
            { nome: "Receita por tenant", linhas: tenants.map((t) => ({ Tenant: t.nome, Status: t.status, MRR: t.mrr, ARR: t.mrr * 12, "Custo IA": t.consumoIa })) },
          ]}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="MRR" value={moeda(mrr)} delta={8} hint={`ARR ${moeda(mrr * 12)}`} />
        <KpiCard label="Margem bruta" value={`${Math.round(((mrr - custo) / Math.max(mrr, 1)) * 100)}%`} hint={`custo ${moeda(custo)}/mês`} />
        <KpiCard label="A receber" value={moeda(aReceber)} hint={`${faturas.filter((f) => f.status !== "paga").length} faturas em aberto`} />
        <KpiCard label="Vencido" value={moeda(vencido)} tone={vencido > 0 ? "alert" : "default"} hint="inadimplência da plataforma" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Receita recorrente" hint="MRR consolidado dos últimos 7 meses" className="xl:col-span-2">
          <Spark values={serie} className="h-24" />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            {tenants[0]?.serie.map((s) => <span key={s.mes}>{s.mes}</span>)}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Novo MRR</p><p className="tabular mt-1 font-display text-lg font-semibold">{moeda(7800)}</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Expansão</p><p className="tabular mt-1 font-display text-lg font-semibold">{moeda(3400)}</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Contração</p><p className="tabular mt-1 font-display text-lg font-semibold text-alert">-{moeda(900)}</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Churn</p><p className="tabular mt-1 font-display text-lg font-semibold text-alert">-{moeda(1490)}</p></div>
          </div>
        </Panel>

        <Panel title="Receita por plano">
          <ul className="space-y-3">
            {porPlano.map((p) => (
              <li key={p.plano}>
                <div className="flex items-center justify-between text-xs">
                  <span>{p.plano} <span className="text-muted-foreground">· {p.clientes} tenants</span></span>
                  <span className="tabular font-medium">{moeda(p.receita)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(p.receita / Math.max(mrr, 1)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <p className="flex justify-between"><span>Custo de APIs</span><span className="tabular text-foreground">{moeda(integracoes.reduce((s, i) => s + i.custoMes, 0))}</span></p>
            <p className="flex justify-between"><span>Infra & hospedagem</span><span className="tabular text-foreground">{moeda(4200)}</span></p>
            <p className="flex justify-between"><span>Custo por tenant ativo</span><span className="tabular text-foreground">{moeda(Math.round(custo / Math.max(tenants.filter((t) => t.status === "ativo").length, 1)))}</span></p>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Faturas dos tenants"
        actions={
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)} className="h-8 rounded-md border border-border bg-card px-2 text-xs">
            <option value="todas">Todas</option>
            <option value="aberta">Em aberto</option>
            <option value="vencida">Vencidas</option>
            <option value="paga">Pagas</option>
          </select>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Tenant</th>
                <th className="px-4 py-2">Plano</th>
                <th className="px-4 py-2">Competência</th>
                <th className="px-4 py-2">Vencimento</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2 text-right">Status</th>
                <th className="px-4 py-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {pag.visiveis.map((f) => (
                <tr key={`${f.tenantId}-${f.id}`} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-2 font-medium">{f.tenant}</td>
                  <td className="px-4 py-2 text-muted-foreground">{f.plano}</td>
                  <td className="px-4 py-2">{f.competencia}</td>
                  <td className="px-4 py-2 text-muted-foreground">{f.vencimento}</td>
                  <td className="tabular px-4 py-2 text-right">{moeda(f.valor)}</td>
                  <td className="px-4 py-2 text-right">
                    {f.status === "vencida" ? <Chip tone="alert">vencida</Chip> : <StatusDot status={f.status} />}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => toast.success(`Cobrança reenviada para ${f.tenant}.`)}
                      className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      Reenviar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginacao {...pag} rotulo="faturas" />
      </Panel>

      <Panel className="mt-4" title="Consumo faturável por tenant" hint="Excedentes e uso de IA no ciclo atual" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Tenant</th>
                <th className="px-4 py-2 text-right">Emissões</th>
                <th className="px-4 py-2 text-right">Excedente</th>
                <th className="px-4 py-2 text-right">IA</th>
                <th className="px-4 py-2 text-right">WhatsApp</th>
                <th className="px-4 py-2 text-right">E-mails</th>
                <th className="px-4 py-2 text-right">Total variável</th>
              </tr>
            </thead>
            <tbody>
              {tenants.filter((t) => t.status !== "cancelado").map((t) => {
                const plano = planos.find((p) => p.id === t.plano);
                const exc = Math.max(0, t.emissoesMes - t.emissoesLimite);
                const valorExc = exc * (plano?.excedenteEmissao ?? 0);
                return (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{t.nome}</td>
                    <td className="tabular px-4 py-2 text-right">{numero(t.emissoesMes)}</td>
                    <td className={`tabular px-4 py-2 text-right ${exc ? "text-alert" : ""}`}>{numero(exc)}</td>
                    <td className="tabular px-4 py-2 text-right">{moeda(t.consumoIa)}</td>
                    <td className="tabular px-4 py-2 text-right">{numero(t.mensagensWhats)}</td>
                    <td className="tabular px-4 py-2 text-right">{numero(t.emailsEnviados)}</td>
                    <td className="tabular px-4 py-2 text-right font-medium">{moeda(valorExc + t.consumoIa)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </AdminShell>
  );
}
