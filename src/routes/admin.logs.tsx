import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { KpiCard, inputCls } from "@/components/admin-kit";
import { Paginacao, usePaginacao } from "@/components/pagination";
import { Panel } from "@/components/ui-kit";
import { logs, numero } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({
    meta: [
      { title: "Logs e auditoria da plataforma | Admin Center" },
      { name: "description", content: "Busca em logs de aplicação e trilha de auditoria administrativa por tenant, origem, nível e latência, com exportação." },
      { property: "og:title", content: "Logs e auditoria da plataforma" },
      { property: "og:description", content: "Logs de aplicação e trilha de auditoria administrativa por tenant e origem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogsPage,
});

const AUDITORIA = [
  { quando: "01/09/2026 22:41", ator: "Super Admin", acao: "Alterou plano do tenant Válida Digital para Scale", ip: "189.45.2.10" },
  { quando: "01/09/2026 21:05", ator: "Super Admin", acao: "Rotacionou chave da integração OpenAI", ip: "189.45.2.10" },
  { quando: "01/09/2026 18:44", ator: "SRE · Camila", acao: "Criou índice em produção (incidente inc-104)", ip: "10.2.0.44" },
  { quando: "31/08/2026 15:12", ator: "Super Admin", acao: "Suspendeu tenant CertBrasil Sul por inadimplência", ip: "189.45.2.10" },
  { quando: "30/08/2026 09:33", ator: "Comercial · Rafael", acao: "Aplicou cupom LANCA30 no tenant Prisma AR", ip: "177.12.88.4" },
  { quando: "29/08/2026 17:02", ator: "Super Admin", acao: "Habilitou flag chat.copiloto_ia em 60% dos tenants", ip: "189.45.2.10" },
];

function LogsPage() {
  const { tenants } = useAdmin();
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState<"todos" | "info" | "warn" | "error">("todos");
  const [tenant, setTenant] = useState("todos");

  const filtrados = useMemo(
    () =>
      logs.filter(
        (l) =>
          (nivel === "todos" || l.nivel === nivel) &&
          (tenant === "todos" || l.tenant === tenant) &&
          (l.mensagem.toLowerCase().includes(busca.toLowerCase()) || l.origem.includes(busca.toLowerCase())),
      ),
    [busca, nivel, tenant],
  );

  const pag = usePaginacao(filtrados, 25);

  return (
    <AdminShell
      title="Logs & auditoria"
      subtitle="Eventos de aplicação de todos os tenants e trilha de ações administrativas"
      actions={
        <ExportMenu
          base="admin-logs"
          datasets={() => [
            { nome: "Logs", linhas: filtrados.map((l) => ({ Quando: l.quando, Nível: l.nivel, Origem: l.origem, Tenant: l.tenant, Mensagem: l.mensagem, "Latência (ms)": l.latenciaMs, Ator: l.ator })) },
            { nome: "Auditoria", linhas: AUDITORIA.map((a) => ({ Quando: a.quando, Ator: a.ator, Ação: a.acao, IP: a.ip })) },
          ]}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Eventos na janela" value={numero(logs.length)} hint="últimas 24h (amostra)" />
        <KpiCard label="Erros" value={String(logs.filter((l) => l.nivel === "error").length)} tone="alert" hint="nível error" />
        <KpiCard label="Avisos" value={String(logs.filter((l) => l.nivel === "warn").length)} hint="nível warn" />
        <KpiCard label="Latência média" value={`${Math.round(logs.reduce((s, l) => s + l.latenciaMs, 0) / logs.length)} ms`} hint="por evento processado" />
      </div>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por mensagem ou origem" className={`${inputCls} pl-8`} />
          </div>
          <select value={nivel} onChange={(e) => setNivel(e.target.value as typeof nivel)} className={`${inputCls} w-auto`}>
            <option value="todos">Todos os níveis</option><option value="info">info</option><option value="warn">warn</option><option value="error">error</option>
          </select>
          <select value={tenant} onChange={(e) => setTenant(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="todos">Todos os tenants</option>
            {tenants.map((t) => <option key={t.id} value={t.nome}>{t.nome}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Quando</th>
                <th className="px-4 py-2">Nível</th>
                <th className="px-4 py-2">Origem</th>
                <th className="px-4 py-2">Tenant</th>
                <th className="px-4 py-2">Mensagem</th>
                <th className="px-4 py-2 text-right">Latência</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[12px]">
              {pag.visiveis.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="tabular whitespace-nowrap px-4 py-1.5 text-muted-foreground">{l.quando}</td>
                  <td className="px-4 py-1.5">
                    <span className={l.nivel === "error" ? "text-alert" : l.nivel === "warn" ? "text-primary-deep" : "text-muted-foreground"}>{l.nivel}</span>
                  </td>
                  <td className="px-4 py-1.5">{l.origem}</td>
                  <td className="truncate px-4 py-1.5 text-muted-foreground">{l.tenant}</td>
                  <td className="px-4 py-1.5">{l.mensagem}</td>
                  <td className="tabular px-4 py-1.5 text-right">{l.latenciaMs} ms</td>
                </tr>
              ))}
              {pag.visiveis.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center font-sans text-sm text-muted-foreground">Nenhum evento com os filtros atuais.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacao {...pag} rotulo="eventos" />
      </Panel>

      <Panel className="mt-4" title="Trilha de auditoria administrativa" hint="Ações executadas no Admin Center" bodyClassName="p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-2">Quando</th><th className="px-4 py-2">Ator</th><th className="px-4 py-2">Ação</th><th className="px-4 py-2 text-right">IP</th></tr>
          </thead>
          <tbody>
            {AUDITORIA.map((a) => (
              <tr key={a.quando + a.acao} className="border-b border-border last:border-0">
                <td className="tabular whitespace-nowrap px-4 py-2 text-muted-foreground">{a.quando}</td>
                <td className="px-4 py-2 font-medium">{a.ator}</td>
                <td className="px-4 py-2">{a.acao}</td>
                <td className="tabular px-4 py-2 text-right text-muted-foreground">{a.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AdminShell>
  );
}
