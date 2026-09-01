import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { Field, KpiCard, StatusDot, inputCls } from "@/components/admin-kit";
import { Paginacao, usePaginacao } from "@/components/pagination";
import { Chip, Panel } from "@/components/ui-kit";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { moeda, numero, rotuloPlano, rotuloRegiao, type PlanoId, type Regiao, type StatusTenant } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/tenants/")({
  head: () => ({
    meta: [
      { title: "Tenants da plataforma — Admin Center | Certus SaaS" },
      { name: "description", content: "Crie, provisione e acompanhe todos os tenants do SaaS: plano, consumo, saúde, inadimplência e limites contratados." },
      { property: "og:title", content: "Tenants da plataforma — Admin Center" },
      { property: "og:description", content: "Crie, provisione e acompanhe todos os tenants do SaaS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TenantsPage,
});

const STATUS: StatusTenant[] = ["ativo", "trial", "onboarding", "suspenso", "cancelado"];

function TenantsPage() {
  const { tenants, planos, addTenant, updateTenant } = useAdmin();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<"todos" | StatusTenant>("todos");
  const [plano, setPlano] = useState<"todos" | PlanoId>("todos");
  const [novo, setNovo] = useState(false);

  const filtrados = useMemo(
    () =>
      tenants.filter(
        (t) =>
          (status === "todos" || t.status === status) &&
          (plano === "todos" || t.plano === plano) &&
          (t.nome.toLowerCase().includes(busca.toLowerCase()) ||
            t.cnpj.includes(busca) ||
            t.responsavel.toLowerCase().includes(busca.toLowerCase())),
      ),
    [tenants, busca, status, plano],
  );

  const pag = usePaginacao(filtrados, 10);
  const mrr = tenants.reduce((s, t) => s + (t.status === "ativo" ? t.mrr : 0), 0);

  return (
    <AdminShell
      title="Tenants"
      subtitle={`${tenants.length} organizações provisionadas na plataforma`}
      actions={
        <>
          <ExportMenu
            base="admin-tenants"
            datasets={() => [
              {
                nome: "Tenants",
                linhas: filtrados.map((t) => ({
                  Tenant: t.nome, Domínio: t.dominio, CNPJ: t.cnpj, Status: t.status,
                  Plano: rotuloPlano[t.plano], Região: rotuloRegiao[t.regiao], MRR: t.mrr,
                  Usuários: t.usuarios, Emissões: t.emissoesMes, Saúde: t.saudeScore, Inadimplente: t.inadimplente ? "sim" : "não",
                })),
              },
            ]}
          />
          <button
            onClick={() => setNovo(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> Novo tenant
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="MRR ativo" value={moeda(mrr)} hint="somatório dos tenants ativos" />
        <KpiCard label="Em trial" value={String(tenants.filter((t) => t.status === "trial").length)} hint="conversão média 46%" />
        <KpiCard label="Suspensos" value={String(tenants.filter((t) => t.status === "suspenso").length)} tone="alert" hint="bloqueio por inadimplência" />
        <KpiCard label="Emissões no mês" value={numero(tenants.reduce((s, t) => s + t.emissoesMes, 0))} hint="todos os tenants" />
      </div>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CNPJ ou responsável"
              className={`${inputCls} pl-8`}
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={`${inputCls} w-auto`}>
            <option value="todos">Todos os status</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={plano} onChange={(e) => setPlano(e.target.value as typeof plano)} className={`${inputCls} w-auto`}>
            <option value="todos">Todos os planos</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Tenant</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Plano</th>
                <th className="px-4 py-2">Região</th>
                <th className="px-4 py-2 text-right">Usuários</th>
                <th className="px-4 py-2 text-right">Emissões</th>
                <th className="px-4 py-2 text-right">MRR</th>
                <th className="px-4 py-2 text-right">Saúde</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pag.visiveis.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <Link to="/admin/tenants/$id" params={{ id: t.id }} className="font-medium hover:text-primary">
                      {t.nome}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{t.dominio} · {t.responsavel}</p>
                  </td>
                  <td className="px-4 py-2">
                    <StatusDot status={t.status} />
                    {t.inadimplente && <Chip tone="alert" className="ml-1">inadimplente</Chip>}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{rotuloPlano[t.plano]}</td>
                  <td className="px-4 py-2 text-muted-foreground">{rotuloRegiao[t.regiao]}</td>
                  <td className="tabular px-4 py-2 text-right">{t.usuarios}/{t.usuariosLimite}</td>
                  <td className="tabular px-4 py-2 text-right">{numero(t.emissoesMes)}/{numero(t.emissoesLimite)}</td>
                  <td className="tabular px-4 py-2 text-right">{moeda(t.mrr)}</td>
                  <td className={`tabular px-4 py-2 text-right ${t.saudeScore < 60 ? "text-alert" : ""}`}>{t.saudeScore}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => {
                        const ativo = t.status === "ativo";
                        updateTenant(t.id, { status: ativo ? "suspenso" : "ativo" });
                        toast.success(`${t.nome} ${ativo ? "suspenso" : "reativado"}.`);
                      }}
                      className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      {t.status === "ativo" ? "Suspender" : "Reativar"}
                    </button>
                  </td>
                </tr>
              ))}
              {pag.visiveis.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum tenant encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacao {...pag} rotulo="tenants" />
      </Panel>

      <NovoTenantDialog open={novo} onOpenChange={setNovo} onCriar={addTenant} />
    </AdminShell>
  );
}

function NovoTenantDialog({
  open,
  onOpenChange,
  onCriar,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCriar: ReturnType<typeof useAdmin>["addTenant"];
}) {
  const { planos } = useAdmin();
  const [form, setForm] = useState({
    nome: "", slug: "", cnpj: "", responsavel: "", email: "", telefone: "",
    plano: "pro" as PlanoId, regiao: "br-sp" as Regiao, trial: true,
  });

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Provisionar novo tenant</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Razão social / nome">
            <input className={inputCls} value={form.nome} onChange={(e) => { set("nome", e.target.value); set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14)); }} />
          </Field>
          <Field label="Subdomínio" hint={`${form.slug || "tenant"}.certus.app`}>
            <input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label="CNPJ">
            <input className={inputCls} value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} />
          </Field>
          <Field label="Responsável">
            <input className={inputCls} value={form.responsavel} onChange={(e) => set("responsavel", e.target.value)} />
          </Field>
          <Field label="E-mail administrativo">
            <input className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Telefone">
            <input className={inputCls} value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
          </Field>
          <Field label="Plano">
            <select className={inputCls} value={form.plano} onChange={(e) => set("plano", e.target.value)}>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — {moeda(p.preco)}/mês</option>
              ))}
            </select>
          </Field>
          <Field label="Região de dados">
            <select className={inputCls} value={form.regiao} onChange={(e) => set("regiao", e.target.value)}>
              <option value="br-sp">BR São Paulo</option>
              <option value="br-rj">BR Rio de Janeiro</option>
              <option value="br-ne">BR Nordeste</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.trial} onChange={(e) => set("trial", e.target.checked)} />
            Iniciar com 14 dias de trial (sem cobrança)
          </label>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
          <button
            disabled={!form.nome || !form.slug}
            onClick={() => {
              const plano = planos.find((p) => p.id === form.plano);
              onCriar({
                nome: form.nome,
                slug: form.slug,
                cnpj: form.cnpj,
                responsavel: form.responsavel,
                email: form.email,
                telefone: form.telefone,
                plano: form.plano,
                regiao: form.regiao,
                status: form.trial ? "trial" : "onboarding",
                mrr: form.trial ? 0 : (plano?.preco ?? 0),
                usuariosLimite: plano?.usuarios ?? 15,
                emissoesLimite: plano?.emissoes ?? 800,
              });
              toast.success("Tenant provisionado — ambiente sendo preparado.");
              onOpenChange(false);
            }}
            className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Provisionar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
