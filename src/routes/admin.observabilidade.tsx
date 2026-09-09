import { createFileRoute } from "@tanstack/react-router";
import { Activity, Database, HardDrive, Server } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { Gauge, KpiCard, Spark, StatusDot } from "@/components/admin-kit";
import { Panel } from "@/components/ui-kit";
import { integracoes, numero, servicos } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/observabilidade")({
  head: () => ({
    meta: [
      { title: "Observabilidade da plataforma — APIs, banco e filas | Admin Center" },
      {
        name: "description",
        content:
          "Monitoramento de APIs, banco de dados, Redis, filas e workers: latência p95, taxa de erro, carga de CPU/memória e alertas ativos.",
      },
      { property: "og:title", content: "Observabilidade da plataforma — Admin Center" },
      {
        property: "og:description",
        content: "Latência, erros, carga de banco, Redis, filas e alertas ativos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ObservabilidadePage,
});

const ALERTAS = [
  {
    regra: "CPU do banco > 75% por 5 min",
    estado: "disparado",
    canal: "PagerDuty + Slack",
    desde: "há 42 min",
  },
  { regra: "p95 da API > 500 ms", estado: "ok", canal: "Slack", desde: "—" },
  { regra: "Taxa de erro 5xx > 1%", estado: "ok", canal: "PagerDuty", desde: "—" },
  { regra: "Fila de emissão > 500 mensagens", estado: "ok", canal: "Slack", desde: "—" },
  { regra: "Falha de entrega WhatsApp > 2%", estado: "disparado", canal: "Slack", desde: "há 2h" },
  { regra: "Backup diário não concluído", estado: "ok", canal: "E-mail SRE", desde: "—" },
];

function ObservabilidadePage() {
  const { tenants } = useAdmin();
  const p95 = Math.round(servicos.reduce((s, x) => s + x.p95, 0) / servicos.length);
  const erro = (servicos.reduce((s, x) => s + x.erroPct, 0) / servicos.length).toFixed(2);
  const uptime = (servicos.reduce((s, x) => s + x.uptime30d, 0) / servicos.length).toFixed(2);
  const requisicoes = integracoes.reduce((s, i) => s + i.chamadas30d, 0);

  return (
    <AdminShell
      title="Observabilidade"
      subtitle="Saúde técnica da plataforma em tempo real — APIs, banco, cache, filas e workers"
      actions={
        <>
          <ExportMenu
            base="admin-observabilidade"
            datasets={() => [
              {
                nome: "Serviços",
                linhas: servicos.map((s) => ({
                  Serviço: s.nome,
                  Tipo: s.tipo,
                  Status: s.status,
                  "Uptime 30d": s.uptime30d,
                  P95: s.p95,
                  "Erro %": s.erroPct,
                  CPU: s.cpu,
                  Memória: s.memoria,
                })),
              },
              {
                nome: "Alertas",
                linhas: ALERTAS.map((a) => ({
                  Regra: a.regra,
                  Estado: a.estado,
                  Canal: a.canal,
                  Desde: a.desde,
                })),
              },
            ]}
          />
          <button
            onClick={() => toast.success("Snapshot de métricas capturado e anexado ao runbook.")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:border-primary"
          >
            <Activity className="size-4" /> Capturar snapshot
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Uptime 30d"
          value={`${uptime}%`}
          hint="SLA contratado 99,9%"
          icon={<Server className="size-4" />}
        />
        <KpiCard label="Latência p95 média" value={`${p95} ms`} hint="todas as superfícies" />
        <KpiCard
          label="Taxa de erro"
          value={`${erro}%`}
          tone={Number(erro) > 0.4 ? "alert" : "default"}
          hint="janela de 24h"
        />
        <KpiCard
          label="Requisições 30d"
          value={numero(requisicoes)}
          hint="APIs internas + integrações"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Serviços monitorados" className="xl:col-span-2" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Serviço</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 w-28">Tendência p95</th>
                  <th className="px-4 py-2 text-right">p95</th>
                  <th className="px-4 py-2 text-right">Erro</th>
                  <th className="px-4 py-2 text-right">CPU</th>
                  <th className="px-4 py-2 text-right">Uptime</th>
                </tr>
              </thead>
              <tbody>
                {servicos.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <p className="font-medium">{s.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.tipo} · {s.detalhe}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      <StatusDot status={s.status} />
                    </td>
                    <td className="px-4 py-2">
                      <Spark values={s.serie} />
                    </td>
                    <td className="tabular px-4 py-2 text-right">{s.p95} ms</td>
                    <td
                      className={`tabular px-4 py-2 text-right ${s.erroPct > 0.5 ? "text-alert" : ""}`}
                    >
                      {s.erroPct}%
                    </td>
                    <td
                      className={`tabular px-4 py-2 text-right ${s.cpu > 70 ? "text-alert" : ""}`}
                    >
                      {s.cpu}%
                    </td>
                    <td className="tabular px-4 py-2 text-right">{s.uptime30d}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Banco de dados" hint="PostgreSQL primário + réplica">
            <div className="space-y-3">
              <Gauge label="CPU" value={76} />
              <Gauge label="Memória" value={81} />
              <Gauge label="Conexões (412/500)" value={82} />
              <Gauge label="Disco (612/1000 GB)" value={61} />
              <Gauge label="Cache hit ratio" value={97} />
            </div>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <p className="flex justify-between">
                <span>Lag de replicação</span>
                <span className="tabular text-foreground">1,2 s</span>
              </p>
              <p className="flex justify-between">
                <span>Queries lentas (24h)</span>
                <span className="tabular text-foreground">18</span>
              </p>
              <p className="flex justify-between">
                <span>Último backup</span>
                <span className="tabular text-foreground">há 42 min</span>
              </p>
              <p className="flex justify-between">
                <span>PITR</span>
                <span className="tabular text-foreground">30 dias</span>
              </p>
            </div>
          </Panel>

          <Panel title="Redis & filas" hint="Cache, sessão e jobs">
            <div className="space-y-3">
              <Gauge label="Memória Redis (2,1/4 GB)" value={53} />
              <Gauge label="Hit ratio" value={96} />
              <Gauge label="Fila de emissão" value={18} />
              <Gauge label="Fila de notificações" value={9} />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              0 mensagens em dead-letter · 4 workers ativos
            </p>
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Alertas configurados" bodyClassName="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Regra</th>
                <th className="px-4 py-2">Canal</th>
                <th className="px-4 py-2 text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ALERTAS.map((a) => (
                <tr key={a.regra} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    <p>{a.regra}</p>
                    {a.desde !== "—" && (
                      <p className="text-[11px] text-alert">disparado {a.desde}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{a.canal}</td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={
                        a.estado === "disparado"
                          ? "rounded bg-alert-soft px-1.5 py-0.5 text-[11px] font-medium text-alert"
                          : "text-[11px] text-muted-foreground"
                      }
                    >
                      {a.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Consumo por tenant"
          hint="Top 6 por volume de requisições"
          bodyClassName="p-0"
        >
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Tenant</th>
                <th className="px-4 py-2 text-right">Emissões</th>
                <th className="px-4 py-2 text-right">Mensagens</th>
                <th className="px-4 py-2 text-right">Storage</th>
              </tr>
            </thead>
            <tbody>
              {[...tenants]
                .sort((a, b) => b.mensagensWhats - a.mensagensWhats)
                .slice(0, 6)
                .map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <HardDrive className="size-3.5 text-muted-foreground" />
                        {t.nome}
                      </span>
                    </td>
                    <td className="tabular px-4 py-2 text-right">{numero(t.emissoesMes)}</td>
                    <td className="tabular px-4 py-2 text-right">{numero(t.mensagensWhats)}</td>
                    <td className="tabular px-4 py-2 text-right">{t.storageGb} GB</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <Database className="size-3.5" /> Isolamento por schema · row level security ativa em
            todos os tenants
          </p>
        </Panel>
      </div>
    </AdminShell>
  );
}
