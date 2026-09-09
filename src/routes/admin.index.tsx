import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Cpu,
  TrendingUp,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { Gauge, KpiCard, Spark, StatusDot } from "@/components/admin-kit";
import { Panel } from "@/components/ui-kit";
import { moeda, numero, rotuloPlano, servicos } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Center — visão geral da plataforma | Certus SaaS" },
      {
        name: "description",
        content:
          "Plano de controle do SaaS: tenants ativos, MRR, saúde das APIs, incidentes e consumo de infraestrutura em tempo real.",
      },
      { property: "og:title", content: "Admin Center — visão geral da plataforma | Certus SaaS" },
      {
        property: "og:description",
        content:
          "Plano de controle do SaaS: tenants ativos, MRR, saúde das APIs, incidentes e consumo de infraestrutura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { tenants, incidentes, integracoes } = useAdmin();

  const ativos = tenants.filter((t) => t.status === "ativo");
  const mrr = tenants.reduce((s, t) => s + (t.status === "ativo" ? t.mrr : 0), 0);
  const trials = tenants.filter((t) => t.status === "trial").length;
  const inadimplentes = tenants.filter((t) => t.inadimplente);
  const usuarios = tenants.reduce((s, t) => s + t.usuarios, 0);
  const emissoes = tenants.reduce((s, t) => s + t.emissoesMes, 0);
  const custoApis = integracoes.reduce((s, i) => s + i.custoMes, 0);
  const abertos = incidentes.filter((i) => i.status !== "resolvido");
  const uptime = (servicos.reduce((s, x) => s + x.uptime30d, 0) / servicos.length).toFixed(2);

  const serieMrr =
    tenants[0]?.serie.map((_, i) => tenants.reduce((s, t) => s + (t.serie[i]?.mrr ?? 0), 0)) ?? [];

  const ranking = [...tenants].sort((a, b) => b.mrr - a.mrr).slice(0, 6);

  return (
    <AdminShell
      title="Visão geral da plataforma"
      subtitle="Saúde comercial, operacional e de infraestrutura de todos os tenants"
      actions={
        <ExportMenu
          base="admin-visao-geral"
          datasets={() => [
            {
              nome: "Tenants",
              linhas: tenants.map((t) => ({
                Tenant: t.nome,
                Status: t.status,
                Plano: rotuloPlano[t.plano],
                MRR: t.mrr,
                Usuários: t.usuarios,
                Emissões: t.emissoesMes,
                Saúde: t.saudeScore,
              })),
            },
            {
              nome: "Serviços",
              linhas: servicos.map((s) => ({
                Serviço: s.nome,
                Status: s.status,
                "Uptime 30d": s.uptime30d,
                P95: s.p95,
                "Erro %": s.erroPct,
              })),
            },
            {
              nome: "Integrações",
              linhas: integracoes.map((i) => ({
                Integração: i.nome,
                Status: i.status,
                "Chamadas 30d": i.chamadas30d,
                "Custo mês": i.custoMes,
              })),
            },
          ]}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="MRR consolidado"
          value={moeda(mrr)}
          delta={8}
          hint={`ARR ${moeda(mrr * 12)}`}
          icon={<CircleDollarSign className="size-4" />}
        />
        <KpiCard
          label="Tenants ativos"
          value={String(ativos.length)}
          hint={`${trials} em trial · ${tenants.length} no total`}
          icon={<Boxes className="size-4" />}
        />
        <KpiCard
          label="Usuários na plataforma"
          value={numero(usuarios)}
          delta={4}
          hint={`${numero(emissoes)} emissões no mês`}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Uptime médio 30d"
          value={`${uptime}%`}
          hint={`${abertos.length} incidente(s) em aberto`}
          tone={abertos.length > 0 ? "alert" : "default"}
          icon={<Activity className="size-4" />}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Custo de APIs no mês"
          value={moeda(custoApis)}
          hint="IA, mensageria, e-mail e storage"
          icon={<Cpu className="size-4" />}
        />
        <KpiCard
          label="Margem bruta estimada"
          value={`${Math.round(((mrr - custoApis) / Math.max(mrr, 1)) * 100)}%`}
          hint={`${moeda(mrr - custoApis)} de contribuição`}
          icon={<TrendingUp className="size-4" />}
        />
        <KpiCard
          label="Inadimplência"
          value={String(inadimplentes.length)}
          hint={inadimplentes.map((t) => t.nome).join(", ") || "nenhum tenant"}
          tone={inadimplentes.length ? "alert" : "default"}
          icon={<AlertTriangle className="size-4" />}
        />
        <KpiCard label="Churn 90d" value="1,4%" delta={-0.6} hint="1 cancelamento no período" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="MRR consolidado" hint="Últimos 7 meses" className="xl:col-span-2">
          <Spark values={serieMrr} className="h-24" />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            {tenants[0]?.serie.map((s) => (
              <span key={s.mes}>{s.mes}</span>
            ))}
          </div>
        </Panel>

        <Panel title="Carga da infraestrutura" hint="Snapshot atual">
          <div className="space-y-3">
            <Gauge label="CPU banco primário" value={76} />
            <Gauge label="Memória banco primário" value={81} />
            <Gauge label="Conexões PostgreSQL" value={82} />
            <Gauge label="Memória Redis" value={63} />
            <Gauge label="CPU backend edge" value={42} />
            <Gauge label="Fila de emissão" value={18} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Top tenants por receita" hint="MRR do mês corrente" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Tenant</th>
                  <th className="px-4 py-2">Plano</th>
                  <th className="px-4 py-2 text-right">MRR</th>
                  <th className="px-4 py-2 text-right">Emissões</th>
                  <th className="px-4 py-2 text-right">Saúde</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <Link
                        to="/admin/tenants/$id"
                        params={{ id: t.id }}
                        className="font-medium hover:text-primary"
                      >
                        {t.nome}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{t.dominio}</p>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{rotuloPlano[t.plano]}</td>
                    <td className="tabular px-4 py-2 text-right">{moeda(t.mrr)}</td>
                    <td className="tabular px-4 py-2 text-right">{numero(t.emissoesMes)}</td>
                    <td className="tabular px-4 py-2 text-right">
                      <span className={t.saudeScore < 60 ? "text-alert" : ""}>{t.saudeScore}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Status dos serviços" hint="Monitoramento contínuo" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {servicos.slice(0, 6).map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{s.detalhe}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="tabular text-[11px] text-muted-foreground">p95 {s.p95}ms</span>
                    <StatusDot status={s.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Incidentes em aberto" bodyClassName="p-0">
            {abertos.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum incidente em aberto.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {abertos.map((i) => (
                  <li key={i.id} className="px-4 py-2.5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to="/admin/incidentes" className="font-medium hover:text-primary">
                        {i.titulo}
                      </Link>
                      <span className="rounded bg-alert-soft px-1.5 py-0.5 text-[11px] font-medium text-alert">
                        {i.severidade}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {i.servico} · {i.tenantsAfetados} tenants · aberto em {i.abertoEm}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
