import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, LifeBuoy, LogIn, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { Gauge, KpiCard, Spark, StatusDot, inputCls } from "@/components/admin-kit";
import { Chip, Panel } from "@/components/ui-kit";
import { moeda, numero, rotuloPlano, rotuloRegiao, type PlanoId, type StatusTenant } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/tenants/$id")({
  head: () => ({
    meta: [
      { title: "Cockpit do tenant — Admin Center | Certus SaaS" },
      { name: "description", content: "Consumo, limites, faturas, plano e ações administrativas de um tenant específico da plataforma." },
      { property: "og:title", content: "Cockpit do tenant — Admin Center" },
      { property: "og:description", content: "Consumo, limites, faturas, plano e ações administrativas do tenant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TenantCockpit,
});

const STATUS: StatusTenant[] = ["ativo", "trial", "onboarding", "suspenso", "cancelado"];

function TenantCockpit() {
  const { id } = Route.useParams();
  const { tenants, planos, updateTenant, removeTenant } = useAdmin();
  const navigate = useNavigate();
  const t = tenants.find((x) => x.id === id);

  if (!t) {
    return (
      <AdminShell title="Tenant não encontrado">
        <Panel>
          <p className="text-sm text-muted-foreground">Este tenant não existe ou foi removido.</p>
          <Link to="/admin/tenants" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary">
            <ArrowLeft className="size-4" /> Voltar para tenants
          </Link>
        </Panel>
      </AdminShell>
    );
  }

  const plano = planos.find((p) => p.id === t.plano);
  const excedente = Math.max(0, t.emissoesMes - t.emissoesLimite);
  const custoExcedente = excedente * (plano?.excedenteEmissao ?? 0);

  return (
    <AdminShell
      title={t.nome}
      subtitle={`${t.dominio} · ${t.cnpj} · ${rotuloRegiao[t.regiao]} · cliente desde ${t.desde}`}
      actions={
        <>
          <ExportMenu
            base={`tenant-${t.slug}`}
            datasets={() => [
              { nome: "Resumo", linhas: [{ Tenant: t.nome, Plano: rotuloPlano[t.plano], Status: t.status, MRR: t.mrr, Usuários: t.usuarios, Emissões: t.emissoesMes, Saúde: t.saudeScore }] },
              { nome: "Faturas", linhas: t.faturas.map((f) => ({ Competência: f.competencia, Valor: f.valor, Status: f.status, Vencimento: f.vencimento })) },
              { nome: "Série", linhas: t.serie.map((s) => ({ Mês: s.mes, MRR: s.mrr, Emissões: s.emissoes, IA: s.ia })) },
            ]}
          />
          <button
            onClick={() => toast.success(`Sessão de suporte iniciada em ${t.dominio} (somente leitura).`)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:border-primary"
          >
            <LogIn className="size-4" /> Acessar como suporte
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="MRR" value={moeda(t.mrr)} hint={`${rotuloPlano[t.plano]} · renova ${t.renovaEm}`} />
        <KpiCard label="Emissões no mês" value={numero(t.emissoesMes)} hint={`limite ${numero(t.emissoesLimite)}`} tone={excedente > 0 ? "alert" : "default"} />
        <KpiCard label="Consumo de IA" value={moeda(t.consumoIa)} hint={`${numero(t.mensagensWhats)} msgs · ${numero(t.emailsEnviados)} e-mails`} />
        <KpiCard label="Health score" value={String(t.saudeScore)} tone={t.saudeScore < 60 ? "alert" : "default"} hint={`NPS ${t.nps} · último acesso ${t.ultimoAcesso}`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Evolução" hint="MRR mensal" className="xl:col-span-2">
          <Spark values={t.serie.map((s) => s.mrr)} className="h-24" />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            {t.serie.map((s) => <span key={s.mes}>{s.mes}</span>)}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Gauge label="Usuários contratados" value={Math.round((t.usuarios / t.usuariosLimite) * 100)} />
            <Gauge label="Cota de emissões" value={Math.round((t.emissoesMes / t.emissoesLimite) * 100)} />
            <Gauge label="Storage" value={Math.round((t.storageGb / (plano?.storageGb ?? 100)) * 100)} />
          </div>
        </Panel>

        <Panel title="Contrato & plano">
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium">Plano</span>
              <select
                className={inputCls}
                value={t.plano}
                onChange={(e) => {
                  const p = planos.find((x) => x.id === (e.target.value as PlanoId));
                  updateTenant(t.id, {
                    plano: e.target.value as PlanoId,
                    mrr: p?.preco ?? t.mrr,
                    usuariosLimite: p?.usuarios ?? t.usuariosLimite,
                    emissoesLimite: p?.emissoes ?? t.emissoesLimite,
                  });
                  toast.success("Plano alterado — cobrança pró-rata gerada.");
                }}
              >
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} — {moeda(p.preco)}/mês</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium">Status</span>
              <select
                className={inputCls}
                value={t.status}
                onChange={(e) => {
                  updateTenant(t.id, { status: e.target.value as StatusTenant });
                  toast.success("Status atualizado.");
                }}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="rounded-md border border-border p-3 text-xs">
              <p className="flex justify-between"><span className="text-muted-foreground">Excedente de emissões</span><span className="tabular">{numero(excedente)}</span></p>
              <p className="mt-1 flex justify-between"><span className="text-muted-foreground">Valor do excedente</span><span className="tabular font-medium">{moeda(custoExcedente)}</span></p>
              <p className="mt-1 flex justify-between"><span className="text-muted-foreground">Suporte</span><span>{plano?.suporte}</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toast.success("Nova chave de API gerada e enviada ao administrador do tenant.")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs hover:border-primary"
              >
                <KeyRound className="size-3.5" /> Rotacionar API key
              </button>
              <button
                onClick={() => toast.success("Ticket de sucesso do cliente aberto para este tenant.")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs hover:border-primary"
              >
                <LifeBuoy className="size-3.5" /> Abrir acompanhamento
              </button>
              <button
                onClick={() => {
                  removeTenant(t.id);
                  toast.success("Tenant removido da plataforma.");
                  navigate({ to: "/admin/tenants" });
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-alert/40 px-2.5 text-xs text-alert hover:bg-alert-soft"
              >
                <Trash2 className="size-3.5" /> Desprovisionar
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Faturas" hint="Cobranças recorrentes do SaaS" bodyClassName="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Competência</th>
                <th className="px-4 py-2">Vencimento</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {t.faturas.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{f.competencia}</td>
                  <td className="px-4 py-2 text-muted-foreground">{f.vencimento}</td>
                  <td className="tabular px-4 py-2 text-right">{moeda(f.valor)}</td>
                  <td className="px-4 py-2 text-right">
                    {f.status === "vencida" ? <Chip tone="alert">vencida</Chip> : <StatusDot status={f.status} />}
                  </td>
                </tr>
              ))}
              {t.faturas.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Nenhuma fatura emitida ainda.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Contato & administração">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-[11px] uppercase text-muted-foreground">Responsável</dt><dd>{t.responsavel}</dd></div>
            <div><dt className="text-[11px] uppercase text-muted-foreground">E-mail</dt><dd className="truncate">{t.email}</dd></div>
            <div><dt className="text-[11px] uppercase text-muted-foreground">Telefone</dt><dd>{t.telefone}</dd></div>
            <div><dt className="text-[11px] uppercase text-muted-foreground">Região de dados</dt><dd>{rotuloRegiao[t.regiao]}</dd></div>
            <div><dt className="text-[11px] uppercase text-muted-foreground">Domínio</dt><dd>{t.dominio}</dd></div>
            <div><dt className="text-[11px] uppercase text-muted-foreground">Storage</dt><dd className="tabular">{t.storageGb} GB</dd></div>
          </dl>
        </Panel>
      </div>
    </AdminShell>
  );
}
