import { createFileRoute } from "@tanstack/react-router";
import { Check, Percent, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { Field, KpiCard, inputCls } from "@/components/admin-kit";
import { Chip, Panel } from "@/components/ui-kit";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { moeda, numero } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/planos")({
  head: () => ({
    meta: [
      { title: "Planos e preços do SaaS — Admin Center | Certus" },
      { name: "description", content: "Crie e personalize planos, limites, excedentes, cupons e política de cobrança do produto vendido como SaaS." },
      { property: "og:title", content: "Planos e preços do SaaS — Admin Center" },
      { property: "og:description", content: "Crie e personalize planos, limites, excedentes e política de cobrança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanosPage,
});

const CUPONS = [
  { codigo: "LANCA30", desconto: "30% por 3 meses", usos: 14, limite: 50, valido: "31/10/2026" },
  { codigo: "CONTADOR15", desconto: "15% recorrente", usos: 6, limite: 100, valido: "31/12/2026" },
  { codigo: "MIGRA1M", desconto: "1 mês grátis", usos: 3, limite: 25, valido: "30/09/2026" },
];

function PlanosPage() {
  const { planos, tenants, updatePlano, addPlano } = useAdmin();
  const [novo, setNovo] = useState(false);

  const receitaPorPlano = planos.map((p) => ({
    ...p,
    clientes: tenants.filter((t) => t.plano === p.id && t.status === "ativo").length,
    receita: tenants.filter((t) => t.plano === p.id && t.status === "ativo").reduce((s, t) => s + t.mrr, 0),
  }));

  return (
    <AdminShell
      title="Planos & preços"
      subtitle="Catálogo comercial do SaaS, limites, excedentes e cupons"
      actions={
        <>
          <ExportMenu
            base="admin-planos"
            datasets={() => [
              { nome: "Planos", linhas: receitaPorPlano.map((p) => ({ Plano: p.nome, Mensal: p.preco, Anual: p.precoAnual, Usuários: p.usuarios, Emissões: p.emissoes, "Excedente (R$)": p.excedenteEmissao, Clientes: p.clientes, Receita: p.receita, Ativo: p.ativo ? "sim" : "não" })) },
              { nome: "Cupons", linhas: CUPONS.map((c) => ({ Código: c.codigo, Desconto: c.desconto, Usos: c.usos, Limite: c.limite, "Válido até": c.valido })) },
            ]}
          />
          <button onClick={() => setNovo(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" /> Novo plano
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Planos ativos" value={String(planos.filter((p) => p.ativo).length)} hint={`${planos.length} no catálogo`} />
        <KpiCard label="Ticket médio" value={moeda(Math.round(receitaPorPlano.reduce((s, p) => s + p.receita, 0) / Math.max(receitaPorPlano.reduce((s, p) => s + p.clientes, 0), 1)))} hint="por tenant ativo" />
        <KpiCard label="Plano mais vendido" value={receitaPorPlano.slice().sort((a, b) => b.clientes - a.clientes)[0]?.nome ?? "—"} hint="por número de tenants" />
        <KpiCard label="Cupons ativos" value={String(CUPONS.length)} hint={`${CUPONS.reduce((s, c) => s + c.usos, 0)} resgates`} icon={<Percent className="size-4" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {receitaPorPlano.map((p) => (
          <section key={p.id} className={`rounded-lg border bg-card p-4 ${p.destaque ? "border-primary" : "border-border"}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold">{p.nome}</h2>
              {p.destaque && <Chip tone="deep">mais vendido</Chip>}
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular">{moeda(p.preco)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
            <p className="text-[11px] text-muted-foreground">ou {moeda(p.precoAnual)}/ano (2 meses grátis)</p>

            <ul className="mt-3 space-y-1.5 text-xs">
              {p.recursos.map((r) => (
                <li key={r} className="flex items-start gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" />{r}</li>
              ))}
            </ul>

            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <div className="flex justify-between"><dt>Usuários</dt><dd className="tabular text-foreground">{p.usuarios}</dd></div>
              <div className="flex justify-between"><dt>Emissões/mês</dt><dd className="tabular text-foreground">{numero(p.emissoes)}</dd></div>
              <div className="flex justify-between"><dt>Excedente</dt><dd className="tabular text-foreground">{moeda(p.excedenteEmissao)}/emissão</dd></div>
              <div className="flex justify-between"><dt>Storage</dt><dd className="tabular text-foreground">{p.storageGb} GB</dd></div>
              <div className="flex justify-between"><dt>Suporte</dt><dd className="text-foreground">{p.suporte}</dd></div>
              <div className="flex justify-between"><dt>Clientes ativos</dt><dd className="tabular text-foreground">{p.clientes} · {moeda(p.receita)}</dd></div>
            </dl>

            <div className="mt-3 space-y-2">
              <label className="flex items-center justify-between gap-2 text-xs">
                Preço mensal
                <input
                  type="number"
                  className={`${inputCls} h-8 w-28 text-right`}
                  value={p.preco}
                  onChange={(e) => updatePlano(p.id, { preco: Number(e.target.value), precoAnual: Number(e.target.value) * 10 })}
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs">
                Limite de emissões
                <input
                  type="number"
                  className={`${inputCls} h-8 w-28 text-right`}
                  value={p.emissoes}
                  onChange={(e) => updatePlano(p.id, { emissoes: Number(e.target.value) })}
                />
              </label>
              <button
                onClick={() => {
                  updatePlano(p.id, { ativo: !p.ativo });
                  toast.success(`Plano ${p.nome} ${p.ativo ? "desativado" : "ativado"}.`);
                }}
                className="h-8 w-full rounded-md border border-border text-xs hover:border-primary"
              >
                {p.ativo ? "Desativar para novas vendas" : "Reativar plano"}
              </button>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Cupons e campanhas" bodyClassName="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-2">Código</th><th className="px-4 py-2">Benefício</th><th className="px-4 py-2 text-right">Usos</th><th className="px-4 py-2 text-right">Validade</th></tr>
            </thead>
            <tbody>
              {CUPONS.map((c) => (
                <tr key={c.codigo} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-medium">{c.codigo}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.desconto}</td>
                  <td className="tabular px-4 py-2 text-right">{c.usos}/{c.limite}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{c.valido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Política de cobrança" hint="Aplicada a todos os tenants">
          <div className="space-y-3 text-sm">
            {[
              ["Cobrança recorrente via Stripe (cartão e boleto)", true],
              ["Cobrar excedente de emissões automaticamente", false],
              ["Suspender tenant após 10 dias de atraso", true],
              ["Trial de 14 dias sem cartão", true],
              ["Reajuste anual por IPCA", true],
            ].map(([label, on]) => (
              <label key={String(label)} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <span>{label}</span>
                <input type="checkbox" defaultChecked={Boolean(on)} onChange={() => toast.success("Política atualizada.")} />
              </label>
            ))}
          </div>
        </Panel>
      </div>

      <NovoPlano open={novo} onOpenChange={setNovo} onCriar={addPlano} />
    </AdminShell>
  );
}

function NovoPlano({
  open,
  onOpenChange,
  onCriar,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCriar: ReturnType<typeof useAdmin>["addPlano"];
}) {
  const [f, setF] = useState({ nome: "", preco: 2900, usuarios: 10, emissoes: 500, excedente: 6.5, storage: 60, suporte: "Chat + e-mail (8h)" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Novo plano comercial</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome do plano"><input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="Preço mensal (R$)"><input type="number" className={inputCls} value={f.preco} onChange={(e) => setF({ ...f, preco: Number(e.target.value) })} /></Field>
          <Field label="Usuários inclusos"><input type="number" className={inputCls} value={f.usuarios} onChange={(e) => setF({ ...f, usuarios: Number(e.target.value) })} /></Field>
          <Field label="Emissões/mês"><input type="number" className={inputCls} value={f.emissoes} onChange={(e) => setF({ ...f, emissoes: Number(e.target.value) })} /></Field>
          <Field label="Excedente por emissão (R$)"><input type="number" step="0.1" className={inputCls} value={f.excedente} onChange={(e) => setF({ ...f, excedente: Number(e.target.value) })} /></Field>
          <Field label="Storage (GB)"><input type="number" className={inputCls} value={f.storage} onChange={(e) => setF({ ...f, storage: Number(e.target.value) })} /></Field>
          <Field label="Suporte"><input className={inputCls} value={f.suporte} onChange={(e) => setF({ ...f, suporte: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground">Cancelar</button>
          <button
            disabled={!f.nome}
            onClick={() => {
              onCriar({
                nome: f.nome, preco: f.preco, precoAnual: f.preco * 10, usuarios: f.usuarios,
                emissoes: f.emissoes, excedenteEmissao: f.excedente, storageGb: f.storage,
                suporte: f.suporte, destaque: false, ativo: true, recursos: ["Plano personalizado"],
              });
              toast.success("Plano criado e disponível para novas vendas.");
              onOpenChange(false);
            }}
            className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Criar plano
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
