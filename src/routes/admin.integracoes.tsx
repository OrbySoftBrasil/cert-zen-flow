import { createFileRoute } from "@tanstack/react-router";
import { Bot, CreditCard, Database, Eye, EyeOff, Mail, MessageCircle, PlugZap, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { Field, KpiCard, StatusDot, inputCls } from "@/components/admin-kit";
import { Panel } from "@/components/ui-kit";
import { moeda, numero, type Integracao } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações e APIs — WhatsApp, Resend, OpenAI | Admin Center" },
      { name: "description", content: "Configure e monitore as APIs da plataforma: Evolution, WhatsApp Cloud, Resend, OpenAI, Stripe e storage, com teste de conexão e custos." },
      { property: "og:title", content: "Integrações e APIs — Admin Center" },
      { property: "og:description", content: "Configure e monitore Evolution, WhatsApp Cloud, Resend, OpenAI e Stripe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegracoesPage,
});

const ICONES: Record<Integracao["categoria"], typeof Bot> = {
  Mensageria: MessageCircle,
  "E-mail": Mail,
  IA: Bot,
  Pagamentos: CreditCard,
  Infra: Database,
};

function IntegracoesPage() {
  const { integracoes, updateIntegracao } = useAdmin();
  const [visivel, setVisivel] = useState<string | null>(null);

  const custo = integracoes.reduce((s, i) => s + i.custoMes, 0);
  const chamadas = integracoes.reduce((s, i) => s + i.chamadas30d, 0);

  return (
    <AdminShell
      title="Integrações & APIs"
      subtitle="Credenciais, endpoints, saúde e custo das APIs usadas por todos os tenants"
      actions={
        <>
          <ExportMenu
            base="admin-integracoes"
            datasets={() => [
              { nome: "Integrações", linhas: integracoes.map((i) => ({ Integração: i.nome, Categoria: i.categoria, Provedor: i.provedor, Status: i.status, Escopo: i.escopo, "Latência (ms)": i.latenciaMs, "Sucesso 30d %": i.sucesso30d, "Chamadas 30d": i.chamadas30d, "Custo mês": i.custoMes })) },
            ]}
          />
          <button
            onClick={() => toast.success("Health check disparado em todas as integrações.")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="size-4" /> Testar todas
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Integrações ativas" value={String(integracoes.filter((i) => i.status === "conectado").length)} hint={`${integracoes.length} configuradas`} icon={<PlugZap className="size-4" />} />
        <KpiCard label="Chamadas 30d" value={numero(chamadas)} hint="somatório de todas as APIs" />
        <KpiCard label="Custo no mês" value={moeda(custo)} hint="IA, mensageria, e-mail e storage" />
        <KpiCard label="Degradadas" value={String(integracoes.filter((i) => i.status !== "conectado").length)} tone={integracoes.some((i) => i.status !== "conectado") ? "alert" : "default"} hint="requerem atenção" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {integracoes.map((i) => {
          const Icon = ICONES[i.categoria] ?? PlugZap;
          const mostrar = visivel === i.id;
          return (
            <Panel
              key={i.id}
              title={i.nome}
              hint={`${i.categoria} · ${i.provedor} · escopo ${i.escopo}`}
              actions={<StatusDot status={i.status} />}
            >
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-deep">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <Field label="Endpoint">
                    <input
                      className={inputCls}
                      value={i.endpoint}
                      onChange={(e) => updateIntegracao(i.id, { endpoint: e.target.value })}
                    />
                  </Field>
                  <Field label="Chave de API" hint="Armazenada criptografada; nunca exposta aos tenants.">
                    <div className="flex gap-2">
                      <input
                        className={inputCls}
                        type={mostrar ? "text" : "password"}
                        value={mostrar ? i.chaveMascarada.replace(/•+/g, "s3cr3tk3y") : i.chaveMascarada}
                        onChange={(e) => updateIntegracao(i.id, { chaveMascarada: e.target.value })}
                      />
                      <button
                        onClick={() => setVisivel(mostrar ? null : i.id)}
                        className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:border-primary"
                        title={mostrar ? "Ocultar" : "Revelar"}
                      >
                        {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                    <div className="rounded-md border border-border px-2 py-1.5"><p className="text-muted-foreground">Latência</p><p className="tabular font-medium">{i.latenciaMs} ms</p></div>
                    <div className="rounded-md border border-border px-2 py-1.5"><p className="text-muted-foreground">Sucesso 30d</p><p className="tabular font-medium">{i.sucesso30d}%</p></div>
                    <div className="rounded-md border border-border px-2 py-1.5"><p className="text-muted-foreground">Chamadas</p><p className="tabular font-medium">{numero(i.chamadas30d)}</p></div>
                    <div className="rounded-md border border-border px-2 py-1.5"><p className="text-muted-foreground">Custo/mês</p><p className="tabular font-medium">{moeda(i.custoMes)}</p></div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">{i.notas} · último teste {i.ultimoTeste}</p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        updateIntegracao(i.id, { status: "conectado", ultimoTeste: "agora" });
                        toast.success(`${i.nome} respondeu com sucesso.`);
                      }}
                      className="h-8 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Testar conexão
                    </button>
                    <button
                      onClick={() => {
                        updateIntegracao(i.id, { status: i.status === "desconectado" ? "conectado" : "desconectado" });
                        toast.success(`${i.nome} ${i.status === "desconectado" ? "reativada" : "desativada"}.`);
                      }}
                      className="h-8 rounded-md border border-border px-2.5 text-xs hover:border-primary"
                    >
                      {i.status === "desconectado" ? "Ativar" : "Desativar"}
                    </button>
                    <button
                      onClick={() => toast.success(`Chave da ${i.nome} rotacionada.`)}
                      className="h-8 rounded-md border border-border px-2.5 text-xs hover:border-primary"
                    >
                      Rotacionar chave
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel className="mt-4" title="Webhooks da plataforma" hint="Eventos enviados a sistemas externos" bodyClassName="p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-2">Evento</th><th className="px-4 py-2">Destino</th><th className="px-4 py-2 text-right">Entregas 24h</th><th className="px-4 py-2 text-right">Falhas</th></tr>
          </thead>
          <tbody>
            {[
              ["tenant.criado", "https://hooks.certus.app/crm", 12, 0],
              ["fatura.paga", "https://hooks.certus.app/financeiro", 214, 1],
              ["emissao.concluida", "https://hooks.certus.app/bi", 3180, 4],
              ["incidente.aberto", "https://hooks.slack.com/services/…", 3, 0],
            ].map(([evento, destino, ok, falha]) => (
              <tr key={String(evento)} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium">{evento}</td>
                <td className="truncate px-4 py-2 text-muted-foreground">{destino}</td>
                <td className="tabular px-4 py-2 text-right">{numero(Number(ok))}</td>
                <td className={`tabular px-4 py-2 text-right ${Number(falha) > 0 ? "text-alert" : ""}`}>{falha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AdminShell>
  );
}
